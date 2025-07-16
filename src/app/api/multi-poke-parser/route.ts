import { NextRequest, NextResponse } from 'next/server';
import { parseShowdownLog, PokemonStats } from '@/lib/parseShowdownLog';

// The new, extended interface for aggregated stats
export interface AggregatedPokemonStats extends PokemonStats {
  gamesPlayed: number;
  kosPerGame: number;
  totalDamageDealtPerGame: number;
  totalDamageTakenPerGame: number;
  kosPerFaint: number;
  amountHealedPerGame: number;
  amountRegeneratedPerGame: number;
}

/**
 * Normalizes a Pokémon species name to its base form for aggregation.
 * e.g., "Florges-Blue" -> "Florges"
 */
function getBaseSpeciesName(name: string): string {
  if (name.startsWith('Florges')) {
    return 'Florges';
  }
  if (name.startsWith('Gastrodon')) {
    return 'Gastrodon';
  }
  return name;
}

function normalizeToShowdownUrl(url: string): string | null {
  const trimmedUrl = url.trim().split('?')[0]; // remove query params first
  if (trimmedUrl.startsWith('https://play.pokemonshowdown.com/battle-')) {
    return trimmedUrl.replace('https://play.pokemonshowdown.com/battle-', 'https://replay.pokemonshowdown.com/');
  } else if (trimmedUrl.startsWith('https://replay.pokemonshowdown.com/')) {
    return trimmedUrl;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { urls } = await req.json();
    if (!Array.isArray(urls) || urls.some(u => typeof u !== 'string')) {
      return NextResponse.json({ message: 'Invalid replay URLs provided.' }, { status: 400 });
    }

    const allParsedLogs = await Promise.all(
      urls.filter(url => url.trim() !== '').map(async (url) => {
        try {
          const normalizedUrl = normalizeToShowdownUrl(url);
          if (!normalizedUrl) return null;

          const logUrl = normalizedUrl.endsWith('.log') ? normalizedUrl : `${normalizedUrl}.log`;
          
          const resp = await fetch(logUrl, { signal: AbortSignal.timeout(10000) });
          if (!resp.ok) return null;
          const log = await resp.text();
          return parseShowdownLog(log);
        } catch {
          return null; // Ignore failed fetches or parses
        }
      })
    );

    const validLogs = allParsedLogs.filter(Boolean);
    if (validLogs.length === 0) {
      return NextResponse.json({ message: 'Could not parse any of the provided logs.' }, { status: 422 });
    }

    // --- Aggregation Logic ---
    const aggregatedStats: Map<string, Omit<AggregatedPokemonStats, 'name'>> = new Map();

    for (const log of validLogs) {
      if (!log?.pokemonStats) continue;
      for (const pokemon of log.pokemonStats) {
        const baseName = getBaseSpeciesName(pokemon.name);
        let existing = aggregatedStats.get(baseName);

        if (!existing) {
          existing = {
            gamesPlayed: 0, kos: 0, fainted: 0, won: 0,
            directDamageDealt: 0, indirectDamageDealt: 0, totalDamageDealt: 0,
            directDamageTaken: 0, indirectDamageTaken: 0, totalDamageTaken: 0,
            friendlyFireDamage: 0,
            amountHealed: 0,
            amountHealedByRegenerator: 0,
            damageDealtBySpikes: 0, damageDealtByStealthRock: 0, damageDealtByPoison: 0,
            damageDealtByBurn: 0, damageDealtBySandstorm: 0, damageDealtByHail: 0,
            damageDealtByRockyHelmet: 0, damageDealtByContactAbility: 0,
            damageTakenBySpikes: 0, damageTakenByStealthRock: 0, damageTakenByPoison: 0,
            damageTakenByBurn: 0, damageTakenBySandstorm: 0, damageTakenByHail: 0,
            damageTakenByRockyHelmet: 0, damageTakenByContactAbility: 0,
            damageTakenByLifeOrb: 0, damageTakenByMoveRecoil: 0, damageTakenBySubstitute: 0,
            damageTakenBySacrificialMove: 0, damageTakenByRiskRewardMove: 0,
            kosPerGame: 0, totalDamageDealtPerGame: 0, totalDamageTakenPerGame: 0,
            kosPerFaint: 0,
            amountHealedPerGame: 0,
            amountRegeneratedPerGame: 0,
            damageDealtByLeechSeed: 0,
            damageTakenByLeechSeed: 0,
            damageDealtByCurse: 0,
            damageTakenByCurse: 0,
            damageTakenByCurseSelf: 0
          };
        }
        
        // Create a new object for the updated stats to avoid mutation issues.
        const updatedStats = { ...existing };

        // Aggregate all stats from PokemonStats
        updatedStats.gamesPlayed += 1;
        updatedStats.kos += pokemon.kos;
        updatedStats.fainted += pokemon.fainted;
        updatedStats.won += pokemon.won;
        updatedStats.directDamageDealt += pokemon.directDamageDealt;
        updatedStats.indirectDamageDealt += pokemon.indirectDamageDealt;
        updatedStats.totalDamageDealt += pokemon.totalDamageDealt;
        updatedStats.directDamageTaken += pokemon.directDamageTaken;
        updatedStats.indirectDamageTaken += pokemon.indirectDamageTaken;
        updatedStats.totalDamageTaken += pokemon.totalDamageTaken;
        updatedStats.friendlyFireDamage += pokemon.friendlyFireDamage;
        updatedStats.amountHealed += pokemon.amountHealed;
        updatedStats.amountHealedByRegenerator += pokemon.amountHealedByRegenerator;
        updatedStats.damageDealtBySpikes += pokemon.damageDealtBySpikes;
        updatedStats.damageDealtByStealthRock += pokemon.damageDealtByStealthRock;
        updatedStats.damageDealtByPoison += pokemon.damageDealtByPoison;
        updatedStats.damageDealtByBurn += pokemon.damageDealtByBurn;
        updatedStats.damageDealtBySandstorm += pokemon.damageDealtBySandstorm;
        updatedStats.damageDealtByHail += pokemon.damageDealtByHail;
        updatedStats.damageDealtByRockyHelmet += pokemon.damageDealtByRockyHelmet;
        updatedStats.damageDealtByContactAbility += pokemon.damageDealtByContactAbility;
        updatedStats.damageTakenBySpikes += pokemon.damageTakenBySpikes;
        updatedStats.damageTakenByStealthRock += pokemon.damageTakenByStealthRock;
        updatedStats.damageTakenByPoison += pokemon.damageTakenByPoison;
        updatedStats.damageTakenByBurn += pokemon.damageTakenByBurn;
        updatedStats.damageTakenBySandstorm += pokemon.damageTakenBySandstorm;
        updatedStats.damageTakenByHail += pokemon.damageTakenByHail;
        updatedStats.damageTakenByRockyHelmet += pokemon.damageTakenByRockyHelmet;
        updatedStats.damageTakenByContactAbility += pokemon.damageTakenByContactAbility;
        updatedStats.damageTakenByLifeOrb += pokemon.damageTakenByLifeOrb;
        updatedStats.damageTakenByMoveRecoil += pokemon.damageTakenByMoveRecoil;
        updatedStats.damageTakenBySubstitute += pokemon.damageTakenBySubstitute;
        updatedStats.damageTakenBySacrificialMove += pokemon.damageTakenBySacrificialMove;
        updatedStats.damageTakenByRiskRewardMove += pokemon.damageTakenByRiskRewardMove;
        updatedStats.damageDealtByLeechSeed += pokemon.damageDealtByLeechSeed;
        updatedStats.damageTakenByLeechSeed += pokemon.damageTakenByLeechSeed;
        updatedStats.damageDealtByCurse += pokemon.damageDealtByCurse;
        updatedStats.damageTakenByCurse += pokemon.damageTakenByCurse;
        updatedStats.damageTakenByCurseSelf += pokemon.damageTakenByCurseSelf;
        
        aggregatedStats.set(baseName, updatedStats);
      }
    }

    // --- Calculate Per-Game Stats ---
    const finalStats: AggregatedPokemonStats[] = [];
    for (const [name, stats] of aggregatedStats.entries()) {
      const { gamesPlayed, fainted, kos } = stats;
      finalStats.push({
        ...stats,
        name,
        kosPerGame: gamesPlayed > 0 ? kos / gamesPlayed : 0,
        totalDamageDealtPerGame: gamesPlayed > 0 ? stats.totalDamageDealt / gamesPlayed : 0,
        totalDamageTakenPerGame: gamesPlayed > 0 ? stats.totalDamageTaken / gamesPlayed : 0,
        amountHealedPerGame: gamesPlayed > 0 ? stats.amountHealed / gamesPlayed : 0,
        amountRegeneratedPerGame: gamesPlayed > 0 ? stats.amountHealedByRegenerator / gamesPlayed : 0,
        kosPerFaint: fainted > 0 ? kos / fainted : kos, // Handle division by zero
      });
    }

    return NextResponse.json({ aggregatedStats: finalStats });

  } catch (err) {
    console.error('Multi-poke-parser error:', err);
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
} 