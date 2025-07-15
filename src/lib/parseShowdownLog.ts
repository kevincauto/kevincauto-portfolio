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
  friendlyFireDamage: number;
  // Granular indirect damage categories
  damageDealtBySpikes: number;
  damageDealtByStealthRock: number;
  damageDealtByPoison: number;
  damageDealtByBurn: number;
  damageDealtBySandstorm: number;
  damageDealtByHail: number;
  damageDealtByRockyHelmet: number;
  damageDealtByContactAbility: number; // Rough Skin, Iron Barbs, etc.
  damageDealtByLeechSeed: number;
  damageDealtByCurse: number;
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
  damageTakenBySacrificialMove: number;
  damageTakenByRiskRewardMove: number;
  damageTakenByLeechSeed: number;
  damageTakenByCurse: number;
  damageTakenByCurseSelf: number;
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
  faintedByDirectHit?: boolean;
  faintCause?: string;
 
  /* cumulative tallies */
  directDamageDealt: number;   // Direct damage dealt to opponents
  indirectDamageDealt: number; // Indirect damage dealt to opponents
  directDamageTaken: number;   // Direct damage taken from opponents
  indirectDamageTaken: number; // Indirect damage taken (including self-inflicted)
  totalDamageTaken: number;              // Total damage taken including all damage
  healingDone: number;         // total % self-heal, Wish, etc.
  kos: number;                 // confirmed KOs
  substituteUses: number;      // number of times Substitute was used
  friendlyFireDamage: number;

  /* attribution helpers */
  lastAttacker?: string;       // most recent damaging mon (uses unique pokemonKey)
  statusBy?: string;           // who inflicted current status (uses unique pokemonKey)
  trickedBy?: string;          // who used Trick/Switcheroo on this mon (uses unique pokemonKey)

  /* granular indirect damage categories */
  damageDealtBySpikes: number;
  damageDealtByStealthRock: number;
  damageDealtByPoison: number;
  damageDealtByBurn: number;
  damageDealtBySandstorm: number;
  damageDealtByHail: number;
  damageDealtByRockyHelmet: number;
  damageDealtByContactAbility: number; // Rough Skin, Iron Barbs, etc.
  damageDealtByLeechSeed: number;
  damageDealtByCurse: number;
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
  damageTakenBySacrificialMove: number;
  damageTakenByRiskRewardMove: number;
  damageTakenByLeechSeed: number;
  damageTakenByCurse: number;
  damageTakenByCurseSelf: number;
}

/* ────── entry hazards on *one* side (two exist: hazards.p1 & hazards.p2) ────── */
interface HazardState {
  spikesLayers:        number;  // 0‥3
  spikesSetter?:       string;  // uses unique pokemonKey

  stealthRockSetter?:  string;  // uses unique pokemonKey

  toxicSpikesLayers:   number;  // 0‥2
  toxicSpikesSetter?:  string;  // uses unique pokemonKey
}

/* ────── whole-match mutable state ────── */
interface BattleState {
  turn: number;

  /** all Pokémon, keyed by unique pokemonKey (e.g., "p1:Gengar") */
  pokemon: Record<string, PokemonState>;

  /** exactly two HazardStates: hazards.p1 & hazards.p2 */
  hazards: Record<SideID, HazardState>;

  /** A set of pokemonKeys for all pokemon that have used Leech Seed */
  leechSeedUsers: Set<string>;

  /** weather attribution (global, not side-specific) */
  sandstormSetter?: string;  // uses unique pokemonKey
  hailSetter?:      string;  // uses unique pokemonKey
  rainSetter?:      string;  // uses unique pokemonKey
  sunSetter?:       string;  // uses unique pokemonKey

  /** delayed damage moves */
  futureSightAttacker?: string;  // uses unique pokemonKey
  doomDesireAttacker?: string;   // uses unique pokemonKey
}

type LastHit = { attackerKey: string; turn: number; move: string }

export function parseShowdownLog(log: string): DraftResult | null {
  /* --- player names --------------------------------------------------- */
  const p1Name = log.match(/\|player\|p1\|([^\|\n]+)/)?.[1]?.trim()
  const p2Name = log.match(/\|player\|p2\|([^\|\n]+)/)?.[1]?.trim()
  
  if (!p1Name || !p2Name) return null

  /* --- accumulators --------------------------------------------------- */
  const p1Team: string[] = []
  const p2Team: string[] = []
  const kos: KO[] = []

  // lastHit, lastMoveUsed, faintedPokemon are all keyed by a unique pokemonKey
  const lastHit: Record<string, LastHit> = {}
  const lastMoveUsed: Record<string, { move: string; turn: number }> = {}
  const faintedPokemon: Record<string, boolean> = {}
  let winner: string | undefined
  let p1Remaining = 6
  let p2Remaining = 6
  const activePokemonInSlot: Record<string, string> = {};
  let lastDamageDealt = 0;
  let lastDamageWasDirect = true;
 
  /* --- battle state --------------------------------------------------- */

  // Define the list of sacrificial moves
  const sacrificialMoves = new Set([
    'Self-Destruct', 'Explosion', 'Misty Explosion', 
    'Final Gambit', 'Mind Blown', 'Memento', 
    'Healing Wish', 'Lunar Dance'
  ]);

  const selfDamageNoFromTag = new Set(['Belly Drum', 'Curse', 'Clangorous Soul', 'Fillet Away']);
  const riskRewardMoves = new Set(['Belly Drum', 'Clangorous Soul', 'Fillet Away']);

  const battle: BattleState = {
    turn: 0,
    pokemon: {},
    hazards: {
      p1: { spikesLayers: 0, toxicSpikesLayers: 0 },
      p2: { spikesLayers: 0, toxicSpikesLayers: 0 }
    },
    leechSeedUsers: new Set(),
  }

  let currentTurn = 0
  const lines = log.split('\n')

  /* helper: get unique key for a Pokémon instance */
  const getPokemonKey = (side: SideID, nickname: string) => `${side}:${nickname}`;

  /* helper: given "p2a: Hop on Minecraft" → "p2" */
  const sideOfNick = (nickField: string): SideID =>
    (nickField.split(':')[0] as 'p1a' | 'p2a').slice(0, 2) as SideID

  /* helper: extracts nickname, handles colons in names */
  const getNickFromField = (field: string): string => {
    const idx = field.indexOf(':');
    return idx === -1 ? field.trim() : field.substring(idx + 1).trim();
  };

  const cleanSpeciesName = (name: string): string => {
    if (name.endsWith('-*')) {
      return name.slice(0, -2);
    }
    return name;
  };

  /* helper: get or create Pokémon state */
  const getPokemon = (nickname: string, side: SideID, species?: string, slot?: number): PokemonState => {
    const key = getPokemonKey(side, nickname);
    if (!battle.pokemon[key]) {
      battle.pokemon[key] = {
        side: side,
        slot: slot || 1,
        species: species || nickname,
        nickname: nickname,
        hp: 100,
        directDamageDealt: 0,
        indirectDamageDealt: 0,
        directDamageTaken: 0,
        indirectDamageTaken: 0,
        totalDamageTaken: 0,
        healingDone: 0,
        kos: 0,
        substituteUses: 0,
        friendlyFireDamage: 0,
        damageDealtBySpikes: 0,
        damageDealtByStealthRock: 0,
        damageDealtByPoison: 0,
        damageDealtByBurn: 0,
        damageDealtBySandstorm: 0,
        damageDealtByHail: 0,
        damageDealtByRockyHelmet: 0,
        damageDealtByContactAbility: 0,
        damageDealtByLeechSeed: 0,
        damageDealtByCurse: 0,
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
        damageTakenBySacrificialMove: 0,
        damageTakenByRiskRewardMove: 0,
        damageTakenByLeechSeed: 0,
        damageTakenByCurse: 0,
        damageTakenByCurseSelf: 0,
      }
    } else if (species && battle.pokemon[key].species === battle.pokemon[key].nickname) {
      // If we learn the true species of a Pokémon we only knew by nickname, update it.
      battle.pokemon[key].species = species;
    }
    return battle.pokemon[key]
  }

  /* helper: update Pokémon HP and track damage */
  const updatePokemonHP = (
    nickname: string, 
    side: SideID, 
    newHP: number, 
    isHealing: boolean = false, 
    attackerKey?: string, 
    isDirectDamage: boolean = true, 
    isSelfDamage: boolean = false, 
    damageType?: string
  ) => {
    const pokemon = getPokemon(nickname, side)
    const prevHP = pokemon.hp
    let damage = 0
    
    pokemon.hp = newHP
    
    if (!isHealing && newHP < prevHP) {
      damage = prevHP - newHP
      if (newHP === 0) {
        pokemon.faintedByDirectHit = isDirectDamage;
        pokemon.faintCause = damageType;
      }
      pokemon.totalDamageTaken += damage
      
      if (isDirectDamage) {
        pokemon.directDamageTaken += damage
      } else {
        pokemon.indirectDamageTaken += damage
        if (damageType) {
          switch (damageType) {
            case 'Spikes': pokemon.damageTakenBySpikes += damage; break
            case 'Stealth Rock': pokemon.damageTakenByStealthRock += damage; break
            case 'Poison': pokemon.damageTakenByPoison += damage; break
            case 'Burn': pokemon.damageTakenByBurn += damage; break
            case 'Sandstorm': pokemon.damageTakenBySandstorm += damage; break
            case 'Hail': pokemon.damageTakenByHail += damage; break
            case 'Rocky Helmet': pokemon.damageTakenByRockyHelmet += damage; break
            case 'Contact Ability': pokemon.damageTakenByContactAbility += damage; break
            case 'Life Orb': pokemon.damageTakenByLifeOrb += damage; break
            case 'Recoil': pokemon.damageTakenByMoveRecoil += damage; break
            case 'Sacrificial Move': pokemon.damageTakenBySacrificialMove += damage; break
            case 'Risk Reward Move': pokemon.damageTakenByRiskRewardMove += damage; break
            case 'Leech Seed': pokemon.damageTakenByLeechSeed += damage; break
            case 'Curse': pokemon.damageTakenByCurse += damage; break;
            case 'CurseSelf': pokemon.damageTakenByCurseSelf += damage; break;
            case 'Substitute': break;
          }
        }
      }
      
      if (attackerKey && !isSelfDamage) {
        const attackerState = battle.pokemon[attackerKey];
        const victimState = pokemon;

        if ((damageType === 'Sandstorm' || damageType === 'Hail') && attackerState.side === victimState.side) {
          attackerState.friendlyFireDamage += damage;
        } else {
          if (isDirectDamage) {
            attackerState.directDamageDealt += damage;
          } else {
            attackerState.indirectDamageDealt += damage;
            if (damageType) {
              switch (damageType) {
                case 'Spikes': attackerState.damageDealtBySpikes += damage; break
                case 'Stealth Rock': attackerState.damageDealtByStealthRock += damage; break
                case 'Poison': attackerState.damageDealtByPoison += damage; break
                case 'Burn': attackerState.damageDealtByBurn += damage; break
                case 'Sandstorm': attackerState.damageDealtBySandstorm += damage; break
                case 'Hail': attackerState.damageDealtByHail += damage; break
                case 'Rocky Helmet': attackerState.damageDealtByRockyHelmet += damage; break
                case 'Contact Ability': attackerState.damageDealtByContactAbility += damage; break
                case 'Leech Seed': attackerState.damageDealtByLeechSeed += damage; break
                case 'Curse': attackerState.damageDealtByCurse += damage; break;
              }
            }
          }
        }
      }
      
      if (attackerKey) {
        pokemon.lastAttacker = attackerKey;
      }
    } else if (isHealing && newHP > prevHP) {
      const healing = newHP - prevHP;
      pokemon.healingDone += healing;
    }
    return damage;
  }

  lines.forEach((line, idx) => {
    if (line.startsWith('|turn|')) {
      currentTurn = Number(line.split('|')[2])
      battle.turn = currentTurn
    }

    if (line.startsWith('|poke|')) {
      const [, , player, raw] = line.split('|')
      const species = cleanSpeciesName(raw.split(',')[0].trim())
      const side = player as SideID
      const slot = (side === 'p1' ? p1Team : p2Team).length + 1
      ;(side === 'p1' ? p1Team : p2Team).push(species)
      getPokemon(species, side, species, slot)
    }

    if (line.startsWith('|drag|') || line.startsWith('|switch|')) {
      const parts = line.split('|')
      const nickField = parts[2]
      const nick = getNickFromField(nickField)
      const species = cleanSpeciesName(parts[3].split(',')[0].trim())
      const side = sideOfNick(nickField)
      const pokemon = getPokemon(nick, side, species)
      const slot = nickField.split(':')[0];
      activePokemonInSlot[slot] = nick;

      const hpMatch = parts[4]?.match(/(\d+)\/(\d+)/) || parts[3].match(/(\d+)\/(\d+)/)
      if (hpMatch) {
        pokemon.hp = parseInt(hpMatch[1])
      }
    }

    if (line.startsWith('|move|')) {
      const parts = line.split('|')
      const atkField = parts[2]
      const atkNick = getNickFromField(atkField)
      const atkSide = sideOfNick(atkField)
      const moveName = parts[3]
      const atkKey = getPokemonKey(atkSide, atkNick)
      
      lastMoveUsed[atkKey] = { move: moveName, turn: currentTurn }

      if (moveName === 'Leech Seed') {
        battle.leechSeedUsers.add(atkKey);
      }

      if (moveName === 'Trick' || moveName === 'Switcheroo') {
        if(parts[4]) {
          const defField = parts[4];
          const defNick = getNickFromField(defField);
          const defSide = sideOfNick(defField);
          const defPokemon = getPokemon(defNick, defSide);
          const atkPokemon = getPokemon(atkNick, atkSide);

          defPokemon.trickedBy = atkKey;
          atkPokemon.trickedBy = getPokemonKey(defSide, defNick);
        }
      }

      if (parts[4]) {
        const defField = parts[4]
        const defNick = getNickFromField(defField)
        const defSide = sideOfNick(defField)
        const defKey = getPokemonKey(defSide, defNick)
        lastHit[defKey] = { attackerKey: atkKey, turn: currentTurn, move: moveName }
        getPokemon(defNick, defSide).lastAttacker = atkKey;
      }

      if (moveName === 'Future Sight') battle.futureSightAttacker = atkKey;
      if (moveName === 'Doom Desire') battle.doomDesireAttacker = atkKey;
    }

    if (line.startsWith('|-status|')) {
      const parts = line.split('|')
      const targetField = parts[2]
      const targetNick = getNickFromField(targetField)
      const targetSide = sideOfNick(targetField)
      const pokemon = getPokemon(targetNick, targetSide)
      pokemon.status = parts[3] as PokemonState['status']
      
      const fromTag = parts[4] || ''
      if (fromTag.includes('[from] item:') && (fromTag.includes('Flame Orb') || fromTag.includes('Toxic Orb'))) {
        if(pokemon.trickedBy) {
          pokemon.statusBy = pokemon.trickedBy
        } else {
          pokemon.statusBy = undefined;
        }
      } else {
        for (let i = idx - 1; i >= Math.max(0, idx - 5); i--) {
          const prevLine = lines[i]
          if (prevLine.startsWith('|move|')) {
            const [, , atkField, , defField] = prevLine.split('|')
            if (defField === targetField) {
              const atkNick = getNickFromField(atkField)
              const atkSide = sideOfNick(atkField)
              pokemon.statusBy = getPokemonKey(atkSide, atkNick)
              break
            }
          }
        }
      }
    }

    if (line.startsWith('|-sidestart|')) {
      const prev = lines[idx - 1] || ''
      const atkField = prev.split('|')[2]
      const atkNick = atkField ? getNickFromField(atkField) : undefined
      const atkSide = atkField ? sideOfNick(atkField) : undefined

      const parts = line.split('|')
      const side = sideOfNick(parts[2])

      if (atkNick && atkSide) {
        const setterKey = getPokemonKey(atkSide, atkNick);
        if (/Spikes/i.test(parts[3])) {
          battle.hazards[side].spikesLayers++;
          battle.hazards[side].spikesSetter = setterKey;
        }
        if (/Stealth Rock/i.test(parts[3])) {
          battle.hazards[side].stealthRockSetter = setterKey;
        }
        if (/Toxic Spikes/i.test(parts[3])) {
          battle.hazards[side].toxicSpikesLayers++;
          battle.hazards[side].toxicSpikesSetter = setterKey;
        }
      }
    }

    if (line.startsWith('|-sideend|')) {
      const [, sidePart, raw] = line.split('|')
      const side = sideOfNick(sidePart)
      if (/Spikes/i.test(raw)) battle.hazards[side].spikesLayers = 0;
      if (/Stealth Rock/i.test(raw)) battle.hazards[side].stealthRockSetter = undefined;
      if (/Toxic Spikes/i.test(raw)) battle.hazards[side].toxicSpikesLayers = 0;
    }

    if (line.startsWith('|-weather|')) {
      const fromAbilityMatch = line.match(/\[from\] ability: [^|]+\|\[of\] (p\da: [^|]+)/)
      if (fromAbilityMatch) {
        const ofField = fromAbilityMatch[1]
        const nick = getNickFromField(ofField)
        const side = sideOfNick(ofField)
        const key = getPokemonKey(side, nick)
        if (line.includes('Sandstorm')) battle.sandstormSetter = key
        else if (line.includes('Hail')) battle.hailSetter = key
        else if (line.includes('RainDance')) battle.rainSetter = key
        else if (line.includes('SunnyDay')) battle.sunSetter = key
      }
    }

    if (line.startsWith('|-damage|')) {
      const parts = line.split('|')
      const victimField = parts[2]
      const hpInfo = parts[3]
      const victimNick = getNickFromField(victimField)
      const victimSide = sideOfNick(victimField)
      
      const newHP = parseInt(hpInfo.match(/(\d+)\/(\d+)|0 fnt/)?.[1] || '0')
      
      let attackerKey: string | undefined
      let isDirectDamage = true
      let isSelfDamage = false
      let damageType: string | undefined

      const fromMatch = line.match(/\[from\] ([^|]+)/)
      const fromContent = fromMatch ? fromMatch[1] : ''
      const ofMatch = line.match(/\[of\] (p\da: [^|]+)/)
      const ofField = ofMatch ? ofMatch[1] : ''

      if (fromContent) {
        isDirectDamage = false
        const ofNick = ofField ? getNickFromField(ofField) : undefined
        const ofSide = ofField ? sideOfNick(ofField) : undefined
        
        if (fromContent.startsWith('ability:')) {
          damageType = 'Contact Ability';
          if (ofNick && ofSide) attackerKey = getPokemonKey(ofSide, ofNick);
        } else if (fromContent.startsWith('item:')) {
          if (ofNick && ofSide) {
            attackerKey = getPokemonKey(ofSide, ofNick);
            if (fromContent.includes('Rocky Helmet')) damageType = 'Rocky Helmet';
          }
        } else if (fromContent === 'Life Orb' || fromContent === 'Recoil') {
          isSelfDamage = true;
          attackerKey = getPokemonKey(victimSide, victimNick);
          damageType = fromContent;
        } else if (fromContent === 'Leech Seed') {
          damageType = 'Leech Seed';
          if (ofNick && ofSide) {
            const potentialAttackerKey = getPokemonKey(ofSide, ofNick);
            if (battle.leechSeedUsers.has(potentialAttackerKey)) {
              attackerKey = potentialAttackerKey;
            }
          }
        } else if (fromContent === 'Curse') {
          damageType = 'Curse';
          if (ofNick && ofSide) attackerKey = getPokemonKey(ofSide, ofNick);
        } else if (['Stealth Rock', 'Spikes'].includes(fromContent)) {
          attackerKey = battle.hazards[victimSide][fromContent === 'Spikes' ? 'spikesSetter' : 'stealthRockSetter'];
          damageType = fromContent;
        } else if (['psn', 'brn', 'tox'].includes(fromContent)) {
          attackerKey = getPokemon(victimNick, victimSide).statusBy;
          damageType = fromContent === 'brn' ? 'Burn' : 'Poison';
        } else if (fromContent === 'Sandstorm') {
          attackerKey = battle.sandstormSetter;
          damageType = 'Sandstorm';
        } else if (fromContent === 'Hail') {
          attackerKey = battle.hailSetter;
          damageType = 'Hail';
        } else if (fromContent === 'Future Sight' || fromContent === 'Doom Desire') {
          isDirectDamage = true;
          attackerKey = fromContent === 'Future Sight' ? battle.futureSightAttacker : battle.doomDesireAttacker;
        }
      }
      
      const lastAction = lastHit[getPokemonKey(victimSide, victimNick)];
      if (!fromContent && lastAction && lastAction.turn === currentTurn) {
        if (selfDamageNoFromTag.has(lastAction.move)) {
          isDirectDamage = false;
          isSelfDamage = true;
          attackerKey = lastAction.attackerKey;
          if (riskRewardMoves.has(lastAction.move)) {
            damageType = 'Risk Reward Move';
          } else if (lastAction.move === 'Curse') {
            damageType = 'CurseSelf';
          }
        } else {
          isDirectDamage = true;
          attackerKey = lastAction.attackerKey;
        }
      }
      
      if (idx > 0 && lines[idx - 1].startsWith('|-start|') && lines[idx - 1].includes('Substitute')) {
        const subUserField = lines[idx-1].split('|')[2];
        if (subUserField === victimField) {
            isSelfDamage = true;
            damageType = 'Substitute';
            getPokemon(victimNick, victimSide).substituteUses++;
        }
      }

      lastDamageDealt = updatePokemonHP(victimNick, victimSide, newHP, false, attackerKey, isDirectDamage, isSelfDamage, damageType)
      lastDamageWasDirect = isDirectDamage;
    }

    if (line.startsWith('|-heal|')) {
      const parts = line.split('|')
      const targetField = parts[2]
      const hpInfo = parts[3]
      const targetNick = getNickFromField(targetField)
      const targetSide = sideOfNick(targetField)
      const hpMatch = hpInfo.match(/(\d+)\/(\d+)/)
      if (hpMatch) {
        updatePokemonHP(targetNick, targetSide, parseInt(hpMatch[1]), true)
      }
    }

    if (line.startsWith('|replace|')) {
      const [, , pos, newDetails] = line.split('|');
      if (!pos || !newDetails) return;

      const slot = pos.split(':')[0]; // e.g. 'p1a'
      const newNick = getNickFromField(pos);
      const side = sideOfNick(pos);
      const newSpecies = cleanSpeciesName(newDetails.split(',')[0].trim());
      const oldNick = activePokemonInSlot[slot];
      
      if (oldNick) {
        const oldKey = getPokemonKey(side, oldNick);
        const newKey = getPokemonKey(side, newNick);
        
        if (lastHit[oldKey]) {
          lastHit[newKey] = lastHit[oldKey];
          delete lastHit[oldKey];
        }
        
        const oldMonState = battle.pokemon[oldKey];
        const newMonState = getPokemon(newNick, side, newSpecies);
        
        // Transfer all relevant state from the illusion to the real Pokémon
        newMonState.hp = oldMonState.hp;
        newMonState.status = oldMonState.status;
        newMonState.lastAttacker = oldMonState.lastAttacker;
        newMonState.faintedByDirectHit = oldMonState.faintedByDirectHit;
        newMonState.faintCause = oldMonState.faintCause;
        
        // Clear the state of the illusioned Pokémon so it doesn't carry over
        oldMonState.hp = 100;
        oldMonState.status = undefined;
        oldMonState.lastAttacker = undefined;
        oldMonState.faintedByDirectHit = undefined;
        oldMonState.faintCause = undefined;

        // Re-apply damage if the illusion fainted, to ensure correct final HP.
        if (newMonState.hp === 0 && lastDamageDealt > 0) {
            newMonState.totalDamageTaken += lastDamageDealt;
            if (lastDamageWasDirect) {
                newMonState.directDamageTaken += lastDamageDealt;
            } else {
                newMonState.indirectDamageTaken += lastDamageDealt;
            }

            const attackerState = battle.pokemon[newMonState.lastAttacker || ''];
            if (attackerState) {
                if (lastDamageWasDirect) {
                    attackerState.directDamageDealt += lastDamageDealt;
                } else {
                    attackerState.indirectDamageDealt += lastDamageDealt;
                }
            }
        }
      }
      
      activePokemonInSlot[slot] = newNick;
    }

    if (line.startsWith('|faint|')) {
      const nickField = line.split('|')[2]
      const nickname = getNickFromField(nickField)
      const side = sideOfNick(nickField)
      const key = getPokemonKey(side, nickname)
      const victimState = getPokemon(nickname, side);

      const lastAction = lastMoveUsed[key];
      if (lastAction && lastAction.turn === currentTurn && sacrificialMoves.has(lastAction.move)) {
        updatePokemonHP(nickname, side, 0, false, undefined, false, true, 'Sacrificial Move');
      }

      if (!faintedPokemon[key]) {
        if (side === 'p1') p1Remaining--
        else p2Remaining--
        faintedPokemon[key] = true
        getPokemon(nickname, side).hp = 0

        // Check for a direct KO
        const lastHitData = lastHit[key];
        
        if (lastHitData && lastHitData.turn === currentTurn && victimState.faintedByDirectHit) {
          const attackerState = battle.pokemon[lastHitData.attackerKey];
          
          if (attackerState && victimState) {
            kos.push({ 
              attacker: attackerState.species, 
              victim: victimState.species, 
              move: lastHitData.move 
            });
            attackerState.kos++;
          }
        } else if (victimState.faintedByDirectHit === false) {
         const attackerKey = victimState.lastAttacker;
         if (attackerKey) {
           const attackerState = battle.pokemon[attackerKey];
           if (attackerState && attackerKey !== key) {
             kos.push({
               attacker: attackerState.species,
               victim: victimState.species,
               hazard: victimState.faintCause,
             });
             attackerState.kos++;
           }
         }
        }
      }
    }

    if (line.startsWith('|win|')) {
      winner = line.split('|')[2]
    }
  })

  // Build pokemonStats array
  const pokemonStats: PokemonStats[] = []
  
  const allPokemon = [...new Set([...p1Team, ...p2Team])]
  const p1Won = winner === p1Name
  
  allPokemon.forEach(pokemonSpecies => {
    const allStates = Object.values(battle.pokemon).filter(p => p.species === pokemonSpecies)
    if (allStates.length === 0) return;

    const totalKOs = allStates.reduce((sum, p) => sum + p.kos, 0)
    const fainted = allStates.some(p => p.hp === 0) ? 1 : 0
    const won = (p1Team.includes(pokemonSpecies) && p1Won) || (p2Team.includes(pokemonSpecies) && !p1Won) ? 1 : 0
    const directDamageDealt = allStates.reduce((sum, p) => sum + p.directDamageDealt, 0)
    const indirectDamageDealt = allStates.reduce((sum, p) => sum + p.indirectDamageDealt, 0)
    const totalDamageDealt = directDamageDealt + indirectDamageDealt
    const directDamageTaken = allStates.reduce((sum, p) => sum + p.directDamageTaken, 0)
    const indirectDamageTaken = allStates.reduce((sum, p) => sum + p.indirectDamageTaken, 0)
    const totalDamageTaken = allStates.reduce((sum, p) => sum + p.totalDamageTaken, 0)
    const friendlyFireDamage = allStates.reduce((sum, p) => sum + p.friendlyFireDamage, 0);

    pokemonStats.push({
      name: pokemonSpecies,
      kos: totalKOs,
      fainted,
      won,
      directDamageDealt,
      indirectDamageDealt,
      totalDamageDealt,
      directDamageTaken,
      indirectDamageTaken,
      totalDamageTaken,
      friendlyFireDamage,
      damageDealtBySpikes: allStates.reduce((sum, p) => sum + p.damageDealtBySpikes, 0),
      damageDealtByStealthRock: allStates.reduce((sum, p) => sum + p.damageDealtByStealthRock, 0),
      damageDealtByPoison: allStates.reduce((sum, p) => sum + p.damageDealtByPoison, 0),
      damageDealtByBurn: allStates.reduce((sum, p) => sum + p.damageDealtByBurn, 0),
      damageDealtBySandstorm: allStates.reduce((sum, p) => sum + p.damageDealtBySandstorm, 0),
      damageDealtByHail: allStates.reduce((sum, p) => sum + p.damageDealtByHail, 0),
      damageDealtByRockyHelmet: allStates.reduce((sum, p) => sum + p.damageDealtByRockyHelmet, 0),
      damageDealtByContactAbility: allStates.reduce((sum, p) => sum + p.damageDealtByContactAbility, 0),
      damageDealtByLeechSeed: allStates.reduce((sum, p) => sum + p.damageDealtByLeechSeed, 0),
      damageDealtByCurse: allStates.reduce((sum, p) => sum + p.damageDealtByCurse, 0),
      damageTakenBySpikes: allStates.reduce((sum, p) => sum + p.damageTakenBySpikes, 0),
      damageTakenByStealthRock: allStates.reduce((sum, p) => sum + p.damageTakenByStealthRock, 0),
      damageTakenByPoison: allStates.reduce((sum, p) => sum + p.damageTakenByPoison, 0),
      damageTakenByBurn: allStates.reduce((sum, p) => sum + p.damageTakenByBurn, 0),
      damageTakenBySandstorm: allStates.reduce((sum, p) => sum + p.damageTakenBySandstorm, 0),
      damageTakenByHail: allStates.reduce((sum, p) => sum + p.damageTakenByHail, 0),
      damageTakenByRockyHelmet: allStates.reduce((sum, p) => sum + p.damageTakenByRockyHelmet, 0),
      damageTakenByContactAbility: allStates.reduce((sum, p) => sum + p.damageTakenByContactAbility, 0),
      damageTakenByLifeOrb: allStates.reduce((sum, p) => sum + p.damageTakenByLifeOrb, 0),
      damageTakenByMoveRecoil: allStates.reduce((sum, p) => sum + p.damageTakenByMoveRecoil, 0),
      damageTakenBySubstitute: allStates.reduce((sum, p) => sum + (p.substituteUses * 25), 0),
      damageTakenBySacrificialMove: allStates.reduce((sum, p) => sum + p.damageTakenBySacrificialMove, 0),
      damageTakenByRiskRewardMove: allStates.reduce((sum, p) => sum + p.damageTakenByRiskRewardMove, 0),
      damageTakenByLeechSeed: allStates.reduce((sum, p) => sum + p.damageTakenByLeechSeed, 0),
      damageTakenByCurse: allStates.reduce((sum, p) => sum + p.damageTakenByCurse, 0),
      damageTakenByCurseSelf: allStates.reduce((sum, p) => sum + p.damageTakenByCurseSelf, 0),
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
