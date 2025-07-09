/* ---------------------------------------------------------------------- */
/*  Pokémon Showdown draft-log parser                                     */
/*  – extracts teams, direct KOs, and hazard-based KOs                    */
/* ---------------------------------------------------------------------- */

export interface KO { 
  attacker: string; 
  victim: string; 
  hazard?: string; // 'Spikes', 'Stealth Rock', or 'Toxic Spikes'
}

export interface PokemonStats {
  name: string;
  kos: number;    // Number of KOs this Pokémon got
  fainted: number; // 1 if fainted, 0 if survived
  won: number;    // 1 if team won, 0 if team lost
  damageDealt: number; // Total damage dealt as percentage of health (e.g., 150 = 150% of a full health bar)
  damageTaken: number; // Total damage taken as percentage of health (can exceed 100% due to healing)
  hpLost: number; // Total HP lost including defensive move costs (can exceed 100% due to healing)
}

export interface DraftResult {
  p1: { name: string; team: string[] }
  p2: { name: string; team: string[] }
  kos: KO[]
  winner?: string // player name of the winner
  score?: string // format like "1-0" or "2-1"
  pokemonStats?: PokemonStats[] // Individual Pokémon statistics
}

/** Side of the field */
type SideID = 'p1' | 'p2';

/* ────── per-Pokémon snapshot ────── */
export interface PokemonState {
  /* identity */
  side: SideID;      // 'p1' | 'p2'
  slot: number;      // 1‥6 (order seen in |poke| lines)
  species: string;   // "Garchomp"
  nickname: string;  // "Chompy" (may equal species)

  /* live status */
  hp: number;        // 0‥100  (percent)
  status?: 'brn' | 'psn' | 'tox' | 'par' | 'slp' | 'frz';

  /* cumulative tallies */
  damageGiven:  number;  // total % dealt
  damageTaken:  number;  // total % suffered
  healingDone:  number;  // total % self-heal, Wish, etc.
  kos:          number;  // confirmed KOs

  /* attribution helpers */
  lastAttacker?:     string; // most recent damaging mon
  statusInflictor?:  string; // who caused current status
}

/* ────── entry hazards on *one* side (two exist: hazards.p1 & hazards.p2) ────── */
interface HazardState {
  spikesLayers:        number;  // 0‥3
  spikesSetter?:       string;

  stealthRockSetter?:  string;

  toxicSpikesLayers:   number;  // 0‥2
  toxicSpikesSetter?:  string;
}

/* ────── whole-match mutable state ────── */
interface BattleState {
  turn: number;

  /** all Pokémon, keyed by nickname */
  pokemon: Record<string, PokemonState>;

  /** exactly two HazardStates: hazards.p1 & hazards.p2 */
  hazards: Record<SideID, HazardState>;

  /** weather attribution (global, not side-specific) */
  sandstormSetter?: string;  // nickname that started the current Sand
  hailSetter?:      string;  // nickname that started the current Hail/Snow
}

type LastHit = { attacker: string; turn: number }

export function parseShowdownLog(log: string): DraftResult | null {
  /* --- player names --------------------------------------------------- */
  const p1Name = log.match(/\|player\|p1\|([^\|\n]+)/)?.[1]?.trim()
  const p2Name = log.match(/\|player\|p2\|([^\|\n]+)/)?.[1]?.trim()
  
  if (!p1Name || !p2Name) return null

  /* --- accumulators --------------------------------------------------- */
  const p1Team: string[] = []
  const p2Team: string[] = []
  const kos: KO[] = []

  const nickToSpecies: Record<string, string> = {}
  const lastHit: Record<string, LastHit> = {}

  // Track fainted Pokémon for score calculation
  const faintedPokemon: Record<string, boolean> = {}
  let winner: string | undefined
  let p1Remaining = 6
  let p2Remaining = 6

  /* --- battle state --------------------------------------------------- */
  const battle: BattleState = {
    turn: 0,
    pokemon: {},
    hazards: {
      p1: { spikesLayers: 0, toxicSpikesLayers: 0 },
      p2: { spikesLayers: 0, toxicSpikesLayers: 0 }
    }
  }

  let currentTurn = 0
  const lines = log.split('\n')
  
  /* helper: given "p2a: Hop on Minecraft" → "p2" */
  const sideOfNick = (nickField: string): 'p1' | 'p2' =>
    (nickField.split(':')[0] as 'p1a' | 'p2a').slice(0, 2) as 'p1' | 'p2'

  /* helper: get or create Pokémon state */
  const getPokemon = (nickname: string, species?: string, side?: SideID, slot?: number): PokemonState => {
    if (!battle.pokemon[nickname]) {
      battle.pokemon[nickname] = {
        side: side || 'p1',
        slot: slot || 1,
        species: species || nickname,
        nickname,
        hp: 100,
        damageGiven: 0,
        damageTaken: 0,
        healingDone: 0,
        kos: 0
      }
    }
    return battle.pokemon[nickname]
  }

  /* helper: update Pokémon HP and track damage */
  const updatePokemonHP = (nickname: string, newHP: number, isHealing: boolean = false, attacker?: string) => {
    const pokemon = getPokemon(nickname)
    const prevHP = pokemon.hp
    
    if (nickname === 'The Swim Reaper') {
      console.log(`[DEBUG] updatePokemonHP: ${nickname}, prevHP: ${prevHP}, newHP: ${newHP}, isHealing: ${isHealing}`)
    }
    
    // Update HP
    pokemon.hp = newHP
    
    if (!isHealing && newHP < prevHP) {
      // Damage taken
      const damage = prevHP - newHP
      pokemon.damageTaken += damage
      
      if (attacker) {
        pokemon.lastAttacker = attacker
      }
      
      if (nickname === 'The Swim Reaper') {
        console.log(`[DEBUG] Damage tracked: ${damage}%, total damageTaken: ${pokemon.damageTaken}`)
      }
    } else if (isHealing && newHP > prevHP) {
      // Healing done
      const healing = newHP - prevHP
      pokemon.healingDone += healing
      
      if (nickname === 'The Swim Reaper') {
        console.log(`[DEBUG] Healing tracked: ${healing}%, total healingDone: ${pokemon.healingDone}`)
      }
    }
  }

  /* helper: track damage dealt by attacker */
  const trackDamageDealt = (attackerNick: string, victimNick: string, damage: number) => {
    const attacker = getPokemon(attackerNick)
    attacker.damageGiven += damage
    
    if (attackerNick === 'The Swim Reaper') {
      console.log(`[DEBUG] Damage dealt: ${damage}%, total damageGiven: ${attacker.damageGiven}`)
    }
  }

  lines.forEach((line, idx) => {
    /* ---------------- turn marker ---------------- */
    if (line.startsWith('|turn|')) {
      currentTurn = Number(line.split('|')[2])
      battle.turn = currentTurn
    }

    /* ---------------- team lists ----------------- */
    if (line.startsWith('|poke|')) {
      const [, , player, raw] = line.split('|')
      const species = raw.split(',')[0].trim()
      const side = player as SideID
      const slot = (side === 'p1' ? p1Team : p2Team).length + 1
      
      ;(side === 'p1' ? p1Team : p2Team).push(species)
      
      // Initialize Pokémon state
      getPokemon(species, species, side, slot)
      
      // Map the species name to itself (in case it's used as a nickname)
      nickToSpecies[species] = species
    }

    /* ---------------- nickname map from drag events --------------- */
    if (line.startsWith('|drag|')) {
      // |drag|p2a: Hell's Messenger|Talonflame, M|100/100
      const parts = line.split('|')
      const nick = parts[2].split(':')[1].trim()
      const species = parts[3].split(',')[0].trim()
      const side = sideOfNick(parts[2])
      
      nickToSpecies[nick] = species
      
      // Initialize HP tracking for this Pokémon
      const hpMatch = parts[3].match(/\|(\d+)\/(\d+)/)
      if (hpMatch) {
        const [, currentHPStr] = hpMatch
        const currentHP = parseInt(currentHPStr)
        const pokemon = getPokemon(nick, species, side)
        pokemon.hp = currentHP
      }
    }

    /* ---------------- nickname map from switch events --------------- */
    if (line.startsWith('|switch|')) {
      // |switch|p2a: Nick|Species, F|HP
      const parts = line.split('|')
      const nick = parts[2].split(':')[1].trim()
      const species = parts[3].split(',')[0].trim()
      const side = sideOfNick(parts[2])
      
      nickToSpecies[nick] = species
      
      // Initialize HP tracking for this Pokémon
      const hpMatch = parts[4]?.match(/(\d+)\/(\d+)/) || parts[3].match(/(\d+)\/(\d+)/)
      if (hpMatch) {
        const [, currentHPStr] = hpMatch
        const currentHP = parseInt(currentHPStr)
        const pokemon = getPokemon(nick, species, side)
        pokemon.hp = currentHP
      }
    }

    /* ---------------- last damaging hit ---------- */
    if (line.startsWith('|move|')) {
      // |move|pXy: Nick|Move|pZy: TargetNick
      const parts = line.split('|')
      const atkNick = parts[2].split(':')[1].trim()
      const defNick = parts[4]?.split(':')[1]?.trim()
      if (atkNick && defNick) {
        const atkSpec = nickToSpecies[atkNick] || atkNick
        const defSpec = nickToSpecies[defNick] || defNick
        lastHit[defSpec] = { attacker: atkSpec, turn: currentTurn }
      }
    }

    /* ---------------- damage tracking ---------- */
    if (line.startsWith('|-damage|')) {
      const parts = line.split('|')
      const victimField = parts[2]
      const hpInfo = parts[3]
      const victimNick = victimField.split(':')[1].trim()
      
      // Parse HP change
      const hpChangeMatch = hpInfo.match(/(\d+)\/(\d+)\s*→\s*(\d+)\/(\d+)/)
      const koChangeMatch = hpInfo.match(/(\d+)\/(\d+)\s*→\s*0 fnt/)
      const currentHPMatch = hpInfo.match(/(\d+)\/(\d+)/)
      const koMatch = hpInfo.match(/0 fnt/)
      
      let newHP = 0
      
      if (hpChangeMatch) {
        // "A/B → C/D"
        const [, , , newHPStr] = hpChangeMatch
        newHP = parseInt(newHPStr)
      } else if (koChangeMatch) {
        // "A/B → 0 fnt"
        newHP = 0
      } else if (koMatch) {
        // "0 fnt"
        newHP = 0
      } else if (currentHPMatch) {
        // "E/F"
        const [, newHPStr] = currentHPMatch
        newHP = parseInt(newHPStr)
      }
      
      // Find the attacker from the previous move line
      let attackerNick: string | undefined
      for (let i = idx - 1; i >= Math.max(0, idx - 5); i--) {
        const prevLine = lines[i]
        if (prevLine.startsWith('|move|')) {
          const moveParts = prevLine.split('|')
          const atkNick = moveParts[2].split(':')[1].trim()
          const defNick = moveParts[4]?.split(':')[1]?.trim()
          const moveName = moveParts[3]
          
          if (atkNick === victimNick) break // Self-damage
          
          const defensiveMoves = ['Substitute', 'Belly Drum', 'Clangorous Soul', 'Dragon Energy', 'Steel Beam', 'Mind Blown', 'Bolt Beak', 'Fishious Rend']
          if (defensiveMoves.includes(moveName)) break
          
          if (defNick === victimNick) {
            attackerNick = atkNick
            break
          }
        }
      }
      
      // Update Pokémon state
      const victim = getPokemon(victimNick)
      const prevHP = victim.hp
      updatePokemonHP(victimNick, newHP, false, attackerNick)
      
      // Track damage dealt by attacker
      if (attackerNick && newHP < prevHP) {
        const damage = prevHP - newHP
        trackDamageDealt(attackerNick, victimNick, damage)
      }
    }

    /* ---------------- healing tracking ---------- */
    if (line.startsWith('|-heal|')) {
      const parts = line.split('|')
      const targetField = parts[2]
      const hpInfo = parts[3]
      const targetNick = targetField.split(':')[1].trim()
      
      // Parse HP change: "A/B" or "A/B slp" etc.
      const hpMatch = hpInfo.match(/(\d+)\/(\d+)/)
      if (hpMatch) {
        const [, newHPStr] = hpMatch
        const newHP = parseInt(newHPStr)
        
        // Update Pokémon state (mark as healing)
        updatePokemonHP(targetNick, newHP, true)
      }
    }

    /* ---------------- status tracking ---------- */
    if (line.startsWith('|-status|')) {
      const parts = line.split('|')
      const targetField = parts[2]
      const status = parts[3] as 'brn' | 'psn' | 'tox' | 'par' | 'slp' | 'frz'
      const targetNick = targetField.split(':')[1].trim()
      
      const pokemon = getPokemon(targetNick)
      pokemon.status = status
      
      // Find who inflicted the status
      for (let i = idx - 1; i >= Math.max(0, idx - 5); i--) {
        const prevLine = lines[i]
        if (prevLine.startsWith('|move|')) {
          const moveParts = prevLine.split('|')
          const atkNick = moveParts[2].split(':')[1].trim()
          const defNick = moveParts[4]?.split(':')[1]?.trim()
          
          if (defNick === targetNick) {
            pokemon.statusInflictor = atkNick
            break
          }
        }
      }
    }

    /* ---------------- hazard placement ----------- */
    if (line.startsWith('|-sidestart|')) {
      // look one line up (should be the move that set the hazard)
      const prev = lines[idx - 1] || ''
      const atkNick = prev.split('|')[2]?.split(':')[1]?.trim()
      const atkSpec = nickToSpecies[atkNick] || atkNick

      const parts = line.split('|')
      const sidePart = parts[2] // "p1: Agent LeFlame"
      const raw = parts[3]      // "Spikes"
      const side = sidePart.split(':')[0] as 'p1' | 'p2'

      if (/Spikes/i.test(raw)) {
        battle.hazards[side].spikesLayers++
        battle.hazards[side].spikesSetter = atkSpec
      }
      if (/Stealth Rock/i.test(raw)) {
        battle.hazards[side].stealthRockSetter = atkSpec
      }
      if (/Toxic Spikes/i.test(raw)) {
        battle.hazards[side].toxicSpikesLayers++
        battle.hazards[side].toxicSpikesSetter = atkSpec
      }
    }

    /* ---------------- hazard removal ------------- */
    if (line.startsWith('|-sideend|')) {
      const [, sidePart, raw] = line.split('|')
      const side = sidePart.split(':')[0] as 'p1' | 'p2'

      if (/Spikes/i.test(raw)) {
        battle.hazards[side].spikesLayers = 0
        battle.hazards[side].spikesSetter = undefined
      }
      if (/Stealth Rock/i.test(raw)) {
        battle.hazards[side].stealthRockSetter = undefined
      }
      if (/Toxic Spikes/i.test(raw)) {
        battle.hazards[side].toxicSpikesLayers = 0
        battle.hazards[side].toxicSpikesSetter = undefined
      }
    }

    /* ---------------- hazard damage -------------- */
    if (line.startsWith('|-damage|') && line.includes('0 fnt') && /\[from\]/.test(line)) {
      const parts = line.split('|')
      const victimField = parts[2]                 // "p1a: Qwilfish"
      const fromTag = parts[parts.length - 1]  // "[from] Spikes"
      const side = sideOfNick(victimField)
      const victimNick = victimField.split(':')[1].trim()
      const victimSpec = nickToSpecies[victimNick] || victimNick
      let attacker: string | undefined
      let hazardType: string | undefined

      if (/\[from\] Stealth Rock/i.test(fromTag)) {
        attacker = battle.hazards[side].stealthRockSetter
        hazardType = 'Stealth Rock'
      }
      if (/\[from\] Spikes/i.test(fromTag)) {
        attacker = battle.hazards[side].spikesSetter
        hazardType = 'Spikes'
      }
      if (/\[from\] Toxic Spikes/i.test(fromTag)) {
        attacker = battle.hazards[side].toxicSpikesSetter
        hazardType = 'Toxic Spikes'
      }

      if (attacker) {
        kos.push({ attacker, victim: victimSpec, hazard: hazardType })
        // Track KO for the attacker
        const attackerState = getPokemon(attacker, attacker)
        attackerState.kos++
        // Track damage taken by victim (KO = 100% damage)
        const victimState = getPokemon(victimSpec, victimNick)
        victimState.damageTaken += 100
        victimState.hp = 0
      }
    }

    /* ---------------- direct KO (no recoil/hazard) */
    if (line.startsWith('|faint|')) {
      const victimNick = line.split('|')[2].split(':')[1].trim()
      const victimSpec = nickToSpecies[victimNick] || victimNick

      const prev = lines[idx - 1] || ''
      const indirect =
        /\[from\] (Recoil|Life Orb|Spikes|Stealth Rock|Toxic Spikes|status)/i.test(prev)

      const hit = lastHit[victimSpec]
      if (hit && hit.turn === currentTurn && !indirect && hit.attacker !== victimSpec) {
        kos.push({ attacker: hit.attacker, victim: victimSpec })
        // Track KO for the attacker
        const attackerState = getPokemon(hit.attacker, hit.attacker)
        attackerState.kos++
      }

      // Track fainted Pokémon for score calculation
      faintedPokemon[victimSpec] = true
      const victimState = getPokemon(victimSpec, victimNick)
      victimState.hp = 0
      const side = sideOfNick(line.split('|')[2])
      if (side === 'p1') {
        p1Remaining--
      } else {
        p2Remaining--
      }
    }

    /* ---------------- winner declaration ---------- */
    if (line.startsWith('|win|')) {
      const winnerName = line.split('|')[2]
      winner = winnerName
    }
  })

  // Build pokemonStats array
  const pokemonStats: PokemonStats[] = []
  
  // Add all Pokémon from both teams
  const allPokemon = [...p1Team, ...p2Team]
  
  // Determine which team won
  const p1Won = winner === p1Name
  const p2Won = winner === p2Name
  
  allPokemon.forEach(pokemonSpecies => {
    // Find all Pokémon states with this species (across all nicknames)
    const allStates = Object.values(battle.pokemon).filter(p => p.species === pokemonSpecies)
    
    // Sum stats across all nicknames for this species
    const totalKOs = allStates.reduce((sum, p) => sum + p.kos, 0)
    const fainted = allStates.some(p => p.hp === 0) ? 1 : 0
    const damageDealt = allStates.reduce((sum, p) => sum + p.damageGiven, 0)
    const damageTaken = allStates.reduce((sum, p) => sum + p.damageTaken, 0)
    const hpLost = damageTaken // For now, same as damageTaken

    pokemonStats.push({
      name: pokemonSpecies,
      kos: totalKOs,
      fainted,
      won: (p1Team.includes(pokemonSpecies) && p1Won) || (p2Team.includes(pokemonSpecies) && p2Won) ? 1 : 0,
      damageDealt,
      damageTaken,
      hpLost
    })
  })

  return {
    p1: { name: p1Name, team: p1Team },
    p2: { name: p2Name, team: p2Team },
    kos,
    winner,
    score: `${p1Remaining}-${p2Remaining}`,
    pokemonStats
  }
}
