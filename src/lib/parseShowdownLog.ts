/* ---------------------------------------------------------------------- */
/*  Pokémon Showdown draft-log parser                                     */
/*  – extracts teams, direct KOs, and hazard-based KOs                    */
/* ---------------------------------------------------------------------- */

export interface KO { 
  attacker: string; 
  victim: string; 
  hazard?: string; // 'Spikes', 'Stealth Rock', or 'Toxic Spikes'
  move?: string; // The move that caused the KO (for direct attacks)
}

export interface PokemonStats {
  name: string;
  kos: number;    // Number of KOs this Pokémon got
  fainted: number; // 1 if fainted, 0 if survived
  won: number;    // 1 if team won, 0 if team lost
  directDamageDealt: number; // Direct damage dealt to opponents
  indirectDamageDealt: number; // Indirect damage dealt to opponents
  totalDamageDealt: number; // Total damage dealt (direct + indirect)
  directDamageTaken: number; // Direct damage taken from opponents
  indirectDamageTaken: number; // Indirect damage taken (including self-inflicted)
  totalDamageTaken: number; // Total damage taken including all damage (can exceed 100% due to healing)
  // Granular indirect damage categories
  damageDealtBySpikes: number;
  damageDealtByStealthRock: number;
  damageDealtByPoison: number;
  damageDealtByBurn: number;
  damageDealtBySandstorm: number;
  damageDealtByHail: number;
  damageDealtByRockyHelmet: number;
  damageDealtByContactAbility: number; // Rough Skin, Iron Barbs, etc.
  // Granular indirect damage taken categories
  damageTakenBySpikes: number;
  damageTakenByStealthRock: number;
  damageTakenByPoison: number;
  damageTakenByBurn: number;
  damageTakenBySandstorm: number;
  damageTakenByHail: number;
  damageTakenByRockyHelmet: number;
  damageTakenByContactAbility: number; // Rough Skin, Iron Barbs, etc.
  damageTakenByLifeOrb: number;
  damageTakenByMoveRecoil: number;
  damageTakenBySubstitute: number;
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
  directDamageDealt: number;   // Direct damage dealt to opponents
  indirectDamageDealt: number; // Indirect damage dealt to opponents
  directDamageTaken: number;   // Direct damage taken from opponents
  indirectDamageTaken: number; // Indirect damage taken (including self-inflicted)
  totalDamageTaken: number;              // Total damage taken including all damage
  healingDone: number;         // total % self-heal, Wish, etc.
  kos: number;                 // confirmed KOs
  substituteUses: number;      // number of times Substitute was used

  /* attribution helpers */
  lastAttacker?: string;       // most recent damaging mon
  statusBy?: string;           // who inflicted current status

  /* granular indirect damage categories */
  damageDealtBySpikes: number;
  damageDealtByStealthRock: number;
  damageDealtByPoison: number;
  damageDealtByBurn: number;
  damageDealtBySandstorm: number;
  damageDealtByHail: number;
  damageDealtByRockyHelmet: number;
  damageDealtByContactAbility: number; // Rough Skin, Iron Barbs, etc.
  // Granular indirect damage taken categories
  damageTakenBySpikes: number;
  damageTakenByStealthRock: number;
  damageTakenByPoison: number;
  damageTakenByBurn: number;
  damageTakenBySandstorm: number;
  damageTakenByHail: number;
  damageTakenByRockyHelmet: number;
  damageTakenByContactAbility: number; // Rough Skin, Iron Barbs, etc.
  damageTakenByLifeOrb: number;
  damageTakenByMoveRecoil: number;
  damageTakenBySubstitute: number;
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
  rainSetter?:      string;  // nickname that started the current Rain
  sunSetter?:       string;  // nickname that started the current Sun

  /** delayed damage moves */
  futureSightAttacker?: string;  // nickname that used Future Sight
  doomDesireAttacker?: string;   // nickname that used Doom Desire
}

type LastHit = { attacker: string; turn: number; move: string }

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
        directDamageDealt: 0,
        indirectDamageDealt: 0,
        directDamageTaken: 0,
        indirectDamageTaken: 0,
        totalDamageTaken: 0,
        healingDone: 0,
        kos: 0,
        substituteUses: 0,
        damageDealtBySpikes: 0,
        damageDealtByStealthRock: 0,
        damageDealtByPoison: 0,
        damageDealtByBurn: 0,
        damageDealtBySandstorm: 0,
        damageDealtByHail: 0,
        damageDealtByRockyHelmet: 0,
        damageDealtByContactAbility: 0,
        // Granular indirect damage taken categories
        damageTakenBySpikes: 0,
        damageTakenByStealthRock: 0,
        damageTakenByPoison: 0,
        damageTakenByBurn: 0,
        damageTakenBySandstorm: 0,
        damageTakenByHail: 0,
        damageTakenByRockyHelmet: 0,
        damageTakenByContactAbility: 0,
        damageTakenByLifeOrb: 0,
        damageTakenByMoveRecoil: 0,
        damageTakenBySubstitute: 0,
      }
    }
    return battle.pokemon[nickname]
  }

  /* helper: update Pokémon HP and track damage */
  const updatePokemonHP = (nickname: string, newHP: number, isHealing: boolean = false, attacker?: string, isDirectDamage: boolean = true, isSelfDamage: boolean = false, damageType?: string) => {
    const pokemon = getPokemon(nickname)
    const prevHP = pokemon.hp
    
    // Update HP
    pokemon.hp = newHP
    
    if (!isHealing && newHP < prevHP) {
      // HP Lost - track all damage
      const damage = prevHP - newHP
      pokemon.totalDamageTaken += damage
      
      // Track damage taken
      if (isDirectDamage) {
        pokemon.directDamageTaken += damage
      } else {
        pokemon.indirectDamageTaken += damage
        
        // Track granular indirect damage taken categories
        if (damageType) {
          switch (damageType) {
            case 'Spikes':
              pokemon.damageTakenBySpikes += damage
              break
            case 'Stealth Rock':
              pokemon.damageTakenByStealthRock += damage
              break
            case 'Poison':
              pokemon.damageTakenByPoison += damage
              break
            case 'Burn':
              pokemon.damageTakenByBurn += damage
              break
            case 'Sandstorm':
              pokemon.damageTakenBySandstorm += damage
              break
            case 'Hail':
              pokemon.damageTakenByHail += damage
              break
            case 'Rocky Helmet':
              pokemon.damageTakenByRockyHelmet += damage
              break
            case 'Contact Ability':
              pokemon.damageTakenByContactAbility += damage
              break
            case 'Life Orb':
              pokemon.damageTakenByLifeOrb += damage
              break
            case 'Recoil':
              pokemon.damageTakenByMoveRecoil += damage
              break
            case 'Substitute':
              // Substitute always costs exactly 25% of max HP per use
              // The damage is calculated as 25% * number of uses, not from HP drops
              break
          }
        }
      }
      
      // Track damage dealt (only if not self-damage)
      if (attacker && isDirectDamage && !isSelfDamage) {
        const attackerState = getPokemon(attacker)
        attackerState.directDamageDealt += damage
      } else if (attacker && !isDirectDamage && !isSelfDamage) {
        const attackerState = getPokemon(attacker)
        attackerState.indirectDamageDealt += damage
        
        // Track granular indirect damage categories
        if (damageType) {
          switch (damageType) {
            case 'Spikes':
              attackerState.damageDealtBySpikes += damage
              break
            case 'Stealth Rock':
              attackerState.damageDealtByStealthRock += damage
              break
            case 'Poison':
              attackerState.damageDealtByPoison += damage
              break
            case 'Burn':
              attackerState.damageDealtByBurn += damage
              break
            case 'Sandstorm':
              attackerState.damageDealtBySandstorm += damage
              break
            case 'Hail':
              attackerState.damageDealtByHail += damage
              break
            case 'Rocky Helmet':
              attackerState.damageDealtByRockyHelmet += damage
              break
            case 'Contact Ability':
              attackerState.damageDealtByContactAbility += damage
              break
          }
        }
      }
      
      if (attacker) {
        pokemon.lastAttacker = attacker
      }
    } else if (isHealing && newHP > prevHP) {
      // Healing done
      const healing = newHP - prevHP
      pokemon.healingDone += healing
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
      const moveName = parts[3]
      
      if (atkNick && defNick) {
        const atkSpec = nickToSpecies[atkNick] || atkNick
        const defSpec = nickToSpecies[defNick] || defNick
        lastHit[defSpec] = { attacker: atkSpec, turn: currentTurn, move: parts[3] }
        
        // Track the attacker for ability/item damage attribution
        const defState = getPokemon(defNick)
        defState.lastAttacker = atkNick
      }
      
      // Track delayed damage moves
      if (moveName === 'Future Sight') {
        battle.futureSightAttacker = atkNick
      }
      if (moveName === 'Doom Desire') {
        battle.doomDesireAttacker = atkNick
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
      
      // Check if this is self-inflicted status from an item
      const fromTag = parts[4] || ''
      if (fromTag.includes('[from] item:') && (fromTag.includes('Flame Orb') || fromTag.includes('Toxic Orb'))) {
        // Self-inflicted status from item - don't attribute to anyone
        pokemon.statusBy = undefined
      } else {
        // Find who inflicted the status
        for (let i = idx - 1; i >= Math.max(0, idx - 5); i--) {
          const prevLine = lines[i]
          if (prevLine.startsWith('|move|')) {
            const moveParts = prevLine.split('|')
            const atkNick = moveParts[2].split(':')[1].trim()
            const defNick = moveParts[4]?.split(':')[1]?.trim()
            
            if (defNick === targetNick) {
              pokemon.statusBy = atkNick
              break
            }
          }
        }
      }
    }

    /* ---------------- hazard placement ----------- */
    if (line.startsWith('|-sidestart|')) {
      // look one line up (should be the move that set the hazard)
      const prev = lines[idx - 1] || ''
      const atkNick = prev.split('|')[2]?.split(':')[1]?.trim()

      const parts = line.split('|')
      const sidePart = parts[2] // "p1: Agent LeFlame"
      const raw = parts[3]      // "Spikes"
      const side = sidePart.split(':')[0] as 'p1' | 'p2'

      if (/Spikes/i.test(raw)) {
        battle.hazards[side].spikesLayers++
        battle.hazards[side].spikesSetter = atkNick // Store nickname, not species
      }
      if (/Stealth Rock/i.test(raw)) {
        battle.hazards[side].stealthRockSetter = atkNick // Store nickname, not species
      }
      if (/Toxic Spikes/i.test(raw)) {
        battle.hazards[side].toxicSpikesLayers++
        battle.hazards[side].toxicSpikesSetter = atkNick // Store nickname, not species
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

    /* ---------------- weather tracking ----------- */
    if (line.startsWith('|-weather|')) {
      const parts = line.split('|')
      const weatherType = parts[2]
      
      // Check for ability-based weather (like Sand Stream)
      if (line.includes('[from] ability: Sand Stream')) {
        // Extract the Pokémon that has the ability
        const abilityMatch = line.match(/\[of\] (p\d+a: [^|]+)/)
        if (abilityMatch) {
          const pokemonField = abilityMatch[1]
          const pokemonNick = pokemonField.split(': ')[1].trim()
          if (weatherType === 'Sandstorm') {
            battle.sandstormSetter = pokemonNick
          }
        }
      } else if (line.includes('[from] ability: Snow Warning')) {
        // Extract the Pokémon that has the ability
        const abilityMatch = line.match(/\[of\] (p\d+a: [^|]+)/)
        if (abilityMatch) {
          const pokemonField = abilityMatch[1]
          const pokemonNick = pokemonField.split(': ')[1].trim()
          if (weatherType === 'Hail') {
            battle.hailSetter = pokemonNick
          }
        }
      } else if (line.includes('[from] ability: Drizzle')) {
        // Extract the Pokémon that has the ability
        const abilityMatch = line.match(/\[of\] (p\d+a: [^|]+)/)
        if (abilityMatch) {
          const pokemonField = abilityMatch[1]
          const pokemonNick = pokemonField.split(': ')[1].trim()
          if (weatherType === 'RainDance') {
            battle.rainSetter = pokemonNick
          }
        }
      } else if (line.includes('[from] ability: Drought')) {
        // Extract the Pokémon that has the ability
        const abilityMatch = line.match(/\[of\] (p\d+a: [^|]+)/)
        if (abilityMatch) {
          const pokemonField = abilityMatch[1]
          const pokemonNick = pokemonField.split(': ')[1].trim()
          if (weatherType === 'SunnyDay') {
            battle.sunSetter = pokemonNick
          }
        }
      } else {
        // Look back for the move that set the weather
        for (let i = idx - 1; i >= Math.max(0, idx - 5); i--) {
          const prevLine = lines[i]
          if (prevLine.startsWith('|move|')) {
            const moveParts = prevLine.split('|')
            const atkNick = moveParts[2].split(':')[1].trim()
            const moveName = moveParts[3]
            
            // Map weather types to setter fields
            if (weatherType === 'Sandstorm' && ['Sandstorm', 'Sand Stream'].includes(moveName)) {
              battle.sandstormSetter = atkNick
            } else if (weatherType === 'Hail' && ['Hail', 'Snow Warning'].includes(moveName)) {
              battle.hailSetter = atkNick
            } else if (weatherType === 'RainDance' && ['Rain Dance', 'Drizzle'].includes(moveName)) {
              battle.rainSetter = atkNick
            } else if (weatherType === 'SunnyDay' && ['Sunny Day', 'Drought'].includes(moveName)) {
              battle.sunSetter = atkNick
            }
            break
          }
        }
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
        // Track indirect damage taken by victim (KO = 100% damage)
        const victimState = getPokemon(victimSpec, victimNick)
        victimState.indirectDamageTaken += 100
        victimState.totalDamageTaken += 100
        victimState.hp = 0
        // Track indirect damage dealt by hazard setter
        attackerState.indirectDamageDealt += 100
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
      
      // Find the attacker and determine damage type from the previous move line
      let attackerNick: string | undefined
      let isDirectDamage = true
      let isSelfDamage = false
      let damageType: string | undefined
      
      // Look for the previous move line to determine if this is direct damage
      for (let i = idx - 1; i >= Math.max(0, idx - 5); i--) {
        const prevLine = lines[i]
        if (prevLine.startsWith('|move|')) {
          const moveParts = prevLine.split('|')
          const atkNick = moveParts[2].split(':')[1].trim()
          const defNick = moveParts[4]?.split(':')[1]?.trim()
          const moveName = moveParts[3]
          
          // Check if this is self-damage
          if (atkNick === victimNick) {
            attackerNick = atkNick
            isSelfDamage = true
            isDirectDamage = false // Self-damage is always indirect
            break
          }
          
          // Check if this is a defensive move causing self-damage
          const defensiveMoves = ['Substitute', 'Belly Drum', 'Clangorous Soul', 'Dragon Energy', 'Steel Beam', 'Mind Blown']
          if (defensiveMoves.includes(moveName) && atkNick === victimNick) {
            attackerNick = atkNick
            isSelfDamage = true
            isDirectDamage = false
            break
          }
          
          // Check if this is recoil damage
          if (prevLine.includes('[from] Recoil') || prevLine.includes('[from] Life Orb')) {
            attackerNick = atkNick
            isSelfDamage = true
            isDirectDamage = false
            break
          }
          
          // Regular attack
          if (defNick === victimNick) {
            attackerNick = atkNick
            isDirectDamage = true
            isSelfDamage = false
            break
          }
        }
      }
      
      // Check for hazard damage
      if (line.includes('[from] Stealth Rock')) {
        isDirectDamage = false
        damageType = 'Stealth Rock'
        const side = sideOfNick(victimField)
        if (battle.hazards[side].stealthRockSetter) {
          attackerNick = battle.hazards[side].stealthRockSetter
        }
      }
      if (line.includes('[from] Spikes')) {
        isDirectDamage = false
        damageType = 'Spikes'
        const side = sideOfNick(victimField)
        if (battle.hazards[side].spikesSetter) {
          attackerNick = battle.hazards[side].spikesSetter
        }
      }
      if (line.includes('[from] Toxic Spikes')) {
        isDirectDamage = false
        damageType = 'Poison'
        const side = sideOfNick(victimField)
        if (battle.hazards[side].toxicSpikesSetter) {
          attackerNick = battle.hazards[side].toxicSpikesSetter
        }
      }

      // Check for weather damage
      if (line.includes('[from] Sandstorm')) {
        isDirectDamage = false
        damageType = 'Sandstorm'
        if (battle.sandstormSetter) {
          attackerNick = battle.sandstormSetter
        }
      }
      if (line.includes('[from] Hail')) {
        isDirectDamage = false
        damageType = 'Hail'
        if (battle.hailSetter) {
          attackerNick = battle.hailSetter
        }
      }

      // Check for status damage
      if (line.includes('[from] brn')) {
        isDirectDamage = false
        damageType = 'Burn'
        // Find who inflicted the status
        const victimState = getPokemon(victimNick)
        if (victimState.statusBy) {
          attackerNick = victimState.statusBy
        }
      }
      if (line.includes('[from] psn') || line.includes('[from] tox')) {
        isDirectDamage = false
        damageType = 'Poison'
        // Find who inflicted the status
        const victimState = getPokemon(victimNick)
        if (victimState.statusBy) {
          attackerNick = victimState.statusBy
        }
      }

      // Check for ability/item damage (Rough Skin, Iron Barbs, Rocky Helmet, etc.)
      if (line.includes('[from] ability:')) {
        isDirectDamage = false
        const abilityMatch = line.match(/\[from\] ability: ([^|]+)\|\[of\] (p\da: [^|]+)/)
        if (abilityMatch) {
          const abilityName = abilityMatch[1].trim()
          const pokemonField = abilityMatch[2]
          const pokemonNick = pokemonField.split(': ')[1].trim()
          attackerNick = pokemonNick
          if (abilityName === 'Rough Skin' || abilityName === 'Iron Barbs') {
            damageType = 'Contact Ability'
          }
        }
      }
      if (line.includes('[from] item:')) {
        isDirectDamage = false
        const itemMatch = line.match(/\[from\] item: ([^|]+)\|\[of\] (p\da: [^|]+)/)
        if (itemMatch) {
          const itemName = itemMatch[1].trim()
          const pokemonField = itemMatch[2]
          const pokemonNick = pokemonField.split(': ')[1].trim()
          attackerNick = pokemonNick
          if (itemName === 'Rocky Helmet') {
            damageType = 'Rocky Helmet'
          }
        }
      }

      // Check for item damage (Life Orb, recoil moves)
      if (line.includes('[from] Life Orb')) {
        isDirectDamage = false
        isSelfDamage = true
        attackerNick = victimNick
        damageType = 'Life Orb'
      }
      if (line.includes('[from] Recoil')) {
        isDirectDamage = false
        isSelfDamage = true
        attackerNick = victimNick
        damageType = 'Recoil'
      }
      
      // Check for Future Sight damage
      if (line.includes('[from] Future Sight')) {
        isDirectDamage = false
        isSelfDamage = false
        // Future Sight damage is attributed to the user of Future Sight
        // We need to track this separately or look back for the Future Sight move
        // For now, we'll mark it as indirect damage without specific attribution
        if (battle.futureSightAttacker) {
          attackerNick = battle.futureSightAttacker
          isDirectDamage = true  // Future Sight is direct damage from the original user
        }
      }
      
      // Check for Future Sight damage (alternative format - damage after Future Sight end)
      if (idx > 0 && lines[idx - 1].includes('|-end|') && lines[idx - 1].includes('move: Future Sight')) {
        if (battle.futureSightAttacker) {
          attackerNick = battle.futureSightAttacker
          isDirectDamage = true  // Future Sight is direct damage from the original user
        }
      }
      
      // Check for Doom Desire damage
      if (line.includes('[from] Doom Desire')) {
        isDirectDamage = false
        isSelfDamage = false
        if (battle.doomDesireAttacker) {
          attackerNick = battle.doomDesireAttacker
          isDirectDamage = true  // Doom Desire is direct damage from the original user
        }
      }
      
      // Check for Explosion/Self-Destruct damage
      if (line.includes('[from] Explosion') || line.includes('[from] Self-Destruct')) {
        isDirectDamage = false
        isSelfDamage = true
        attackerNick = victimNick
      }
      
      // Check for drain healing (Giga Drain, etc.)
      if (line.includes('[from] drain')) {
        // This is healing, not damage - handled in healing section
        // But we need to track the drain amount for the attacker
        const drainMatch = line.match(/\[from\] drain: (\d+)/)
        if (drainMatch && attackerNick) {
          const drainAmount = parseInt(drainMatch[1])
          const attackerState = getPokemon(attackerNick)
          attackerState.healingDone += drainAmount
        }
      }
      
      // Check for Substitute damage - damage that occurs right after a Substitute move
      let isSubstituteDamage = false
      if (isSelfDamage && attackerNick === victimNick) {
        // Look back a few lines to see if this is Substitute damage
        for (let i = idx - 1; i >= Math.max(0, idx - 3); i--) {
          const prevLine = lines[i]
          if (prevLine.startsWith('|-start|') && prevLine.includes('Substitute')) {
            // Check if the Pokemon in the start line matches our victim
            const startParts = prevLine.split('|')
            const startNick = startParts[2]?.split(':')[1]?.trim()
            if (startNick === victimNick) {
              // Look back one more line to find the Substitute move
              for (let j = i - 1; j >= Math.max(0, i - 2); j--) {
                const moveLine = lines[j]
                if (moveLine.startsWith('|move|')) {
                  const moveParts = moveLine.split('|')
                  const moveAtkNick = moveParts[2]?.split(':')[1]?.trim()
                  const moveName = moveParts[3]
                  if (moveName === 'Substitute' && moveAtkNick === victimNick) {
                    isSubstituteDamage = true
                    damageType = 'Substitute'
                    // Increment substitute use counter
                    const pokemon = getPokemon(victimNick)
                    pokemon.substituteUses++
                    break
                  }
                }
              }
              if (isSubstituteDamage) break
            }
          }
        }
      }
      
      // Update Pokémon state
      updatePokemonHP(victimNick, newHP, false, attackerNick, isDirectDamage, isSelfDamage, damageType)
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
        updatePokemonHP(targetNick, newHP, true, undefined, true, false, undefined)
      }
    }

    /* ---------------- additional healing sources ---------- */
    // Check for Leftovers healing that might be in different format
    if (line.includes('[from] item: Leftovers') && !line.startsWith('|-heal|')) {
      // This might be healing embedded in other events
      const healMatch = line.match(/(\d+)\/(\d+)/)
      if (healMatch) {
        const [, newHPStr] = healMatch
        const newHP = parseInt(newHPStr)
        const targetField = line.split('|')[2]
        const targetNick = targetField?.split(':')[1]?.trim()
        if (targetNick) {
          updatePokemonHP(targetNick, newHP, true, undefined, true, false, undefined)
        }
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
        kos.push({ attacker: hit.attacker, victim: victimSpec, move: hit.move })
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
    const directDamageDealt = allStates.reduce((sum, p) => sum + p.directDamageDealt, 0)
    const indirectDamageDealt = allStates.reduce((sum, p) => sum + p.indirectDamageDealt, 0)
    const totalDamageDealt = directDamageDealt + indirectDamageDealt
    const directDamageTaken = allStates.reduce((sum, p) => sum + p.directDamageTaken, 0)
    const indirectDamageTaken = allStates.reduce((sum, p) => sum + p.indirectDamageTaken, 0)
    const totalDamageTaken = allStates.reduce((sum, p) => sum + p.totalDamageTaken, 0)

    pokemonStats.push({
      name: pokemonSpecies,
      kos: totalKOs,
      fainted,
      won: (p1Team.includes(pokemonSpecies) && p1Won) || (p2Team.includes(pokemonSpecies) && p2Won) ? 1 : 0,
      directDamageDealt,
      indirectDamageDealt,
      totalDamageDealt,
      directDamageTaken,
      indirectDamageTaken,
      totalDamageTaken, // Renamed from hpLost to totalDamageTaken
      // Granular indirect damage categories
      damageDealtBySpikes: allStates.reduce((sum, p) => sum + p.damageDealtBySpikes, 0),
      damageDealtByStealthRock: allStates.reduce((sum, p) => sum + p.damageDealtByStealthRock, 0),
      damageDealtByPoison: allStates.reduce((sum, p) => sum + p.damageDealtByPoison, 0),
      damageDealtByBurn: allStates.reduce((sum, p) => sum + p.damageDealtByBurn, 0),
      damageDealtBySandstorm: allStates.reduce((sum, p) => sum + p.damageDealtBySandstorm, 0),
      damageDealtByHail: allStates.reduce((sum, p) => sum + p.damageDealtByHail, 0),
      damageDealtByRockyHelmet: allStates.reduce((sum, p) => sum + p.damageDealtByRockyHelmet, 0),
      damageDealtByContactAbility: allStates.reduce((sum, p) => sum + p.damageDealtByContactAbility, 0), // Rough Skin, Iron Barbs, etc.
      // Granular indirect damage taken categories
      damageTakenBySpikes: allStates.reduce((sum, p) => sum + p.damageTakenBySpikes, 0),
      damageTakenByStealthRock: allStates.reduce((sum, p) => sum + p.damageTakenByStealthRock, 0),
      damageTakenByPoison: allStates.reduce((sum, p) => sum + p.damageTakenByPoison, 0),
      damageTakenByBurn: allStates.reduce((sum, p) => sum + p.damageTakenByBurn, 0),
      damageTakenBySandstorm: allStates.reduce((sum, p) => sum + p.damageTakenBySandstorm, 0),
      damageTakenByHail: allStates.reduce((sum, p) => sum + p.damageTakenByHail, 0),
      damageTakenByRockyHelmet: allStates.reduce((sum, p) => sum + p.damageTakenByRockyHelmet, 0),
      damageTakenByContactAbility: allStates.reduce((sum, p) => sum + p.damageTakenByContactAbility, 0), // Rough Skin, Iron Barbs, etc.
      damageTakenByLifeOrb: allStates.reduce((sum, p) => sum + p.damageTakenByLifeOrb, 0),
      damageTakenByMoveRecoil: allStates.reduce((sum, p) => sum + p.damageTakenByMoveRecoil, 0),
      damageTakenBySubstitute: allStates.reduce((sum, p) => sum + (p.substituteUses * 25), 0),
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
