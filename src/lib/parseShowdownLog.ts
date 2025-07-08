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
}

export interface DraftResult {
  p1: { name: string; team: string[] }
  p2: { name: string; team: string[] }
  kos: KO[]
  winner?: string // player name of the winner
  score?: string // format like "1-0" or "2-1"
  pokemonStats?: PokemonStats[] // Individual Pokémon statistics
}

type LastHit = { attacker: string; turn: number }
type Hazards = { spikes?: string; rocks?: string; tspikes?: string }

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
  const hazardSetter: Record<'p1' | 'p2', Hazards> = { p1: {}, p2: {} }

  // Track fainted Pokémon for score calculation
  const faintedPokemon: Record<string, boolean> = {}
  let winner: string | undefined
  let p1Remaining = 6
  let p2Remaining = 6

  // Track individual Pokémon statistics
  const pokemonKOCounts: Record<string, number> = {}
  const pokemonFainted: Record<string, boolean> = {}

  let currentTurn = 0
  const lines = log.split('\n')
  
  /* helper: given "p2a: Hop on Minecraft" → "p2" */
  const sideOfNick = (nickField: string): 'p1' | 'p2' =>
    (nickField.split(':')[0] as 'p1a' | 'p2a').slice(0, 2) as 'p1' | 'p2'

  lines.forEach((line, idx) => {
    /* ---------------- turn marker ---------------- */
    if (line.startsWith('|turn|')) {
      currentTurn = Number(line.split('|')[2])
    }

    /* ---------------- team lists ----------------- */
    if (line.startsWith('|poke|')) {
      const [, , player, raw] = line.split('|')
      const species = raw.split(',')[0].trim()
      ;(player === 'p1' ? p1Team : p2Team).push(species)
    }

    /* ---------------- nickname map --------------- */
    if (line.startsWith('|switch|')) {
      // |switch|p2a: Nick|Species, F|HP
      const parts = line.split('|')
      const nick = parts[2].split(':')[1].trim()
      const species = parts[3].split(',')[0].trim()
      nickToSpecies[nick] = species
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

      if (/Spikes/i.test(raw))        hazardSetter[side].spikes  = atkSpec
      if (/Stealth Rock/i.test(raw))  hazardSetter[side].rocks   = atkSpec
      if (/Toxic Spikes/i.test(raw))  hazardSetter[side].tspikes = atkSpec
    }

    /* ---------------- hazard removal ------------- */
    if (line.startsWith('|-sideend|')) {
      const [, sidePart, raw] = line.split('|')
      const side = sidePart.split(':')[0] as 'p1' | 'p2'

      if (/Spikes/i.test(raw))        delete hazardSetter[side].spikes
      if (/Stealth Rock/i.test(raw))  delete hazardSetter[side].rocks
      if (/Toxic Spikes/i.test(raw))  delete hazardSetter[side].tspikes
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
        attacker = hazardSetter[side].rocks
        hazardType = 'Stealth Rock'
      }
      if (/\[from\] Spikes/i.test(fromTag)) {
        attacker = hazardSetter[side].spikes
        hazardType = 'Spikes'
      }
      if (/\[from\] Toxic Spikes/i.test(fromTag)) {
        attacker = hazardSetter[side].tspikes
        hazardType = 'Toxic Spikes'
      }

      if (attacker) {
        kos.push({ attacker, victim: victimSpec, hazard: hazardType })
        // Track KO for the attacker
        pokemonKOCounts[attacker] = (pokemonKOCounts[attacker] || 0) + 1
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
        pokemonKOCounts[hit.attacker] = (pokemonKOCounts[hit.attacker] || 0) + 1
      }

      // Track fainted Pokémon for score calculation
      faintedPokemon[victimSpec] = true
      pokemonFainted[victimSpec] = true
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
  
  allPokemon.forEach(pokemon => {
    pokemonStats.push({
      name: pokemon,
      kos: pokemonKOCounts[pokemon] || 0,
      fainted: pokemonFainted[pokemon] ? 1 : 0,
      won: (p1Team.includes(pokemon) && p1Won) || (p2Team.includes(pokemon) && p2Won) ? 1 : 0
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
