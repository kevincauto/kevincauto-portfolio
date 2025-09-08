'use client';

import { useState, FormEvent, useEffect } from 'react';
import styles from './PokeParserForm.module.css';
import PokemonIcon from '../../components/PokemonIcon';
import Image from 'next/image';

const awardExplanations: { [key: string]: string } = {
  'Glaceon Award (Did Nothing)': 'This Pokémon did not deal or receive any damage, and did not faint.',
  'Shuckle Award (Took a Beating)': 'This Pokémon received the most total damage.',
  "The KO Machine": "Most Knockouts",
  "Conductor of the Pain Train": "Most Damage Dealt",
  "Frank the Tank": "Most Damage Taken",
  "The Passive Aggressor": "Most Indirect Damage Dealt",
  "I'm Trying My Best": "Least Impactful",
};

type PokemonStat = { 
  name: string; 
  kos: number; 
  fainted: number; 
  won: number; 
  directDamageDealt: number; 
  indirectDamageDealt: number; 
  totalDamageDealt: number; 
  directDamageTaken: number; 
  indirectDamageTaken: number; 
  totalDamageTaken: number;
  friendlyFireDamage: number;
  amountHealed: number;
  amountHealedByRegenerator: number;
  // Granular indirect damage categories
  damageDealtBySpikes: number;
  damageDealtByStealthRock: number;
  damageDealtByPoison: number;
  damageDealtByBurn: number;
  damageDealtBySandstorm: number;
  damageDealtByHail: number;
  damageDealtByRockyHelmet: number;
  damageDealtByContactAbility: number;
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
  damageTakenByContactAbility: number;
  damageTakenByLifeOrb: number;
  damageTakenByMoveRecoil: number;
  damageTakenBySubstitute: number;
  damageTakenBySacrificialMove: number;
  damageTakenByRiskRewardMove: number;
  damageTakenByLeechSeed: number;
  damageTakenByCurse: number;
  damageTakenByCurseSelf: number;
};

type Parsed = {
  p1: { name: string; team: string[] };
  p2: { name: string; team: string[] };
  kos: { attacker: string; victim: string; hazard?: string; move?: string }[];
  winner?: string;
  score?: string;
  pokemonStats?: PokemonStat[];
};

type SortField = keyof PokemonStat | 'name';

type SortDirection = 'asc' | 'desc';

type RankedPokemonStat = PokemonStat & { rank: number };

function AwardCard({ pokemon, award }: { pokemon: PokemonStat; award: string }) {
  const formattedSpecies = pokemon.name.toLowerCase().replace(/ /g, '-').replace(/\./g, '');
  const primaryUrl = `https://img.pokemondb.net/artwork/large/${formattedSpecies}.jpg`;
  const fallbackUrl = `https://img.pokemondb.net/artwork/${formattedSpecies}.jpg`;
  
  const [imgSrc, setImgSrc] = useState(primaryUrl);
  const explanation = awardExplanations[award];

  useEffect(() => {
    setImgSrc(primaryUrl);
  }, [primaryUrl]);

  return (
    <div className={styles.awardCard}>
      <h3>{award}</h3>
      {explanation && <p className={styles.awardExplanation}>({explanation})</p>}
      <Image
        src={imgSrc}
        alt={pokemon.name}
        width={200}
        height={200}
        className={styles.awardPokemonImage}
        onError={() => {
          if (imgSrc === primaryUrl) {
            setImgSrc(fallbackUrl);
          }
        }}
      />
      <p>{pokemon.name}</p>
    </div>
  );
}

export default function PokeParserForm() {
  const [url, setUrl] = useState('https://replay.pokemonshowdown.com/gen6draft-2335637717-nwegnp5dgbuu4768334bxodu0lmvnnopw');
  const [data, setData] = useState<Parsed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>('kos');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const normalizeUrl = (inputUrl: string): string => {
    let normalized = inputUrl.trim();
    if (normalized.startsWith('https://play.pokemonshowdown.com/')) {
      normalized = normalized.replace('play.pokemonshowdown.com/', 'replay.pokemonshowdown.com/');
      normalized = normalized.replace('/battle-', '/');
    }
    if (!normalized.endsWith('.log')) {
      normalized += '.log';
    }
    return normalized;
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const normalizedUrl = normalizeUrl(url);
      const response = await fetch('/api/poke-parser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      
      setData(responseData.parsed);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Unknown error'); 
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setUrl('');
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }

  const getRankedData = (): RankedPokemonStat[] => {
    if (!data?.pokemonStats) return [];

    const sorted = [...data.pokemonStats].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      // Handle numeric comparison for descending order on most stats
      if (typeof aValue === 'number' && typeof bValue === 'number' && sortField !== 'name') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string comparison for name
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Fallback for mixed types
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    if (sorted.length === 0) {
      return [];
    }

    // Add rank property with tie handling
    const rankedData: RankedPokemonStat[] = [];
    const totalItems = sorted.length;
    for (let i = 0; i < totalItems; i++) {
      const current = sorted[i];
      let rank: number;

      if (i === 0) {
        // Top item rank depends on sort order for numeric fields
        if (sortDirection === 'asc' && sortField !== 'name') {
          rank = totalItems;
        } else {
          rank = 1;
        }
      } else {
        const previous = sorted[i - 1];
        const previousRanked = rankedData[i - 1];
        const currentValue = current[sortField];
        const previousValue = previous[sortField];

        if (currentValue === previousValue) {
          rank = previousRanked.rank;
        } else {
          // Rank depends on sort order for numeric fields
          if (sortDirection === 'asc' && sortField !== 'name') {
            rank = totalItems - i;
          } else {
            rank = i + 1;
          }
        }
      }
      rankedData.push({ ...current, rank });
    }
    return rankedData;
  };

  function getSortIcon(field: SortField) {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <span className={styles.sortIcon}>▲</span>
    ) : (
      <span className={styles.sortIcon}>▼</span>
    );
  }

  const renderHeader = (field: SortField, title: string) => {
    const emojis: { [key: string]: string } = {
      'KOs': '😵🥊', // Updated to smiley with xx eyes
      'Fainted': '💀',
      'Won': '🏆',
      'Total Damage Dealt': '⚔️',
      'Direct Damage Dealt': '💥', // Updated to explosion emoji
      'Indirect Damage Dealt': '🎯',
      'Friendly Fire Dmg': '🔥',
      'Amount Healed': '❤️‍🩹',
      'Amount Regenerated': '🔄',
      'Spikes': '✨',
      'Stealth Rock': '🪨',
      'Poison': '☠️',
      'Burn': '🔥',
      'Sandstorm': '🏜️',
      'Hail': '❄️',
      'Rocky Helmet': '🪖',
      'Contact Ability': '🤝',
      'Leech Seed Dealt': '🌱',
      'Curse Dealt': '👻',
      'Total Damage Taken': '🛡️',
      'Direct Damage Taken': '💥', // Following pattern of Direct Damage Dealt
      'Indirect Damage Taken': '🎯', // Following pattern of Indirect Damage Dealt
      'Life Orb Taken': '🔮',
      'Move Recoil Taken': '😵‍💫',
      'Substitute Taken': '🪆',
      'Sacrificial Move Taken': '⚰️',
      'Risk Reward Move Taken': '🎲',
      'Leech Seed Taken': '🌱', // Following pattern of Leech Seed Dealt
      'Curse Taken': '👻', // Following pattern of Curse Dealt
      'Curse Self': '👻', // Following pattern of Curse Dealt
      'Poison Taken': '☠️', // Reusing emoji from Poison
      'Stealth Rock Taken': '🪨', // Reusing emoji from Stealth Rock
      'Spikes Taken': '✨',
      'Burn Taken': '🔥',
      'Sandstorm Taken': '🏜️',
      'Hail Taken': '❄️',
      'Rocky Helmet Taken': '🪖',
      'Contact Ability Taken': '🤝'
    };
    return (
      <th onClick={() => handleSort(field)} className={sortField === field ? styles.activeSort : ''}>
        {title} {emojis[title] || ''} {getSortIcon(field)}
      </th>
    );
  };

  let shadowRealmAdmin: PokemonStat | undefined;
  let conductorOfThePainTrain: PokemonStat | undefined;
  let frankTheTank: PokemonStat | undefined;
  let passiveAggressor: PokemonStat | undefined;
  let tryingMyBest: PokemonStat | undefined;

  if (data?.pokemonStats && data.pokemonStats.length > 0) {
    const stats = data.pokemonStats;

    shadowRealmAdmin = [...stats].sort((a, b) => {
      if (a.kos > b.kos) return -1;
      if (a.kos < b.kos) return 1;
      if (a.totalDamageDealt > b.totalDamageDealt) return -1;
      if (a.totalDamageDealt < b.totalDamageDealt) return 1;
      return 0;
    })[0];
    
    conductorOfThePainTrain = stats.reduce((best, current) => 
      current.totalDamageDealt > best.totalDamageDealt ? current : best
    );

    frankTheTank = stats.reduce((best, current) => 
      current.totalDamageTaken > best.totalDamageTaken ? current : best
    );

    passiveAggressor = stats.reduce((best, current) => 
      current.indirectDamageDealt > best.indirectDamageDealt ? current : best
    );

    tryingMyBest = [...stats].sort((a, b) => {
      // 1. Least KOs
      if (a.kos < b.kos) return -1;
      if (a.kos > b.kos) return 1;
      // 2. Least total damage dealt
      if (a.totalDamageDealt < b.totalDamageDealt) return -1;
      if (a.totalDamageDealt > b.totalDamageDealt) return 1;
      // 3. Least total damage taken
      if (a.totalDamageTaken < b.totalDamageTaken) return -1;
      if (a.totalDamageTaken > b.totalDamageTaken) return 1;
      return 0;
    })[0];
  }

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.parser}>
        <input
          type="url"
          placeholder="Paste draft replay URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className={styles.parser__input}
        />
        <div className={styles.formActions}>
          <button type="button" onClick={handleClear} className={styles.clearButton}>
            Clear
          </button>
          <button className={styles.parser__button} disabled={loading}>
            {loading ? 'Parsing…' : 'Parse'}
          </button>
        </div>
      </form>
      
      <p className={styles.help}>
        Paste a Pokémon Showdown replay URL (e.g., https://replay.pokemonshowdown.com/gen6draft-2343718562-vejctxvc2repvwcffvmfb9mi2wxanknpw)
      </p>

      {/* Results ----------------------------------------------------------- */}
      {error && <p className={styles.error}>{error}</p>}

      {data && (
        <div className={styles.results}>
          <div className={styles.results__content}>

            {/* Awards Section */}
            {(shadowRealmAdmin || conductorOfThePainTrain || frankTheTank || passiveAggressor || tryingMyBest) && (
              <div className={styles.awardsSection}>
                <h3>Award Winners</h3>
                <div className={styles.awardCardsContainer}>
                  {shadowRealmAdmin && <AwardCard pokemon={shadowRealmAdmin} award="The KO Machine" />}
                  {conductorOfThePainTrain && <AwardCard pokemon={conductorOfThePainTrain} award="Conductor of the Pain Train" />}
                  {frankTheTank && <AwardCard pokemon={frankTheTank} award="Frank the Tank" />}
                  {passiveAggressor && <AwardCard pokemon={passiveAggressor} award="The Passive Aggressor" />}
                  {tryingMyBest && <AwardCard pokemon={tryingMyBest} award="I'm Trying My Best" />}
                </div>
              </div>
            )}

            {/* Pokémon Statistics */}
            {data.pokemonStats && data.pokemonStats.length > 0 && (
              <div className={styles.results__summary}>
                <h3>Pokémon Statistics</h3>
                <div className={styles.results__statsContainer}>
                  <table className={styles.results__stats}>
                    <thead>
                      <tr>
                        <th className={styles.rankHeader}>Rank</th>
                        {renderHeader('name', 'Pokémon')}
                        {renderHeader('kos', 'KOs')}
                        {renderHeader('fainted', 'Fainted')}
                        {renderHeader('won', 'Won')}
                        {renderHeader('totalDamageDealt', 'Total Damage Dealt')}
                        {renderHeader('directDamageDealt', 'Direct Damage Dealt')}
                        {renderHeader('indirectDamageDealt', 'Indirect Damage Dealt')}
                        {renderHeader('friendlyFireDamage', 'Friendly Fire Dmg')}
                        {renderHeader('amountHealed', 'Amount Healed')}
                        {renderHeader('amountHealedByRegenerator', 'Amount Regenerated')}
                        {renderHeader('damageDealtBySpikes', 'Spikes')}
                        {renderHeader('damageDealtByStealthRock', 'Stealth Rock')}
                        {renderHeader('damageDealtByPoison', 'Poison')}
                        {renderHeader('damageDealtByBurn', 'Burn')}
                        {renderHeader('damageDealtBySandstorm', 'Sandstorm')}
                        {renderHeader('damageDealtByHail', 'Hail')}
                        {renderHeader('damageDealtByRockyHelmet', 'Rocky Helmet')}
                        {renderHeader('damageDealtByContactAbility', 'Contact Ability')}
                        {renderHeader('damageDealtByLeechSeed', 'Leech Seed Dealt')}
                        {renderHeader('damageDealtByCurse', 'Curse Dealt')}
                        {renderHeader('totalDamageTaken', 'Total Damage Taken')}
                        {renderHeader('directDamageTaken', 'Direct Damage Taken')}
                        {renderHeader('indirectDamageTaken', 'Indirect Damage Taken')}
                        {renderHeader('damageTakenBySpikes', 'Spikes Taken')}
                        {renderHeader('damageTakenByStealthRock', 'Stealth Rock Taken')}
                        {renderHeader('damageTakenByPoison', 'Poison Taken')}
                        {renderHeader('damageTakenByBurn', 'Burn Taken')}
                        {renderHeader('damageTakenBySandstorm', 'Sandstorm Taken')}
                        {renderHeader('damageTakenByHail', 'Hail Taken')}
                        {renderHeader('damageTakenByRockyHelmet', 'Rocky Helmet Taken')}
                        {renderHeader('damageTakenByContactAbility', 'Contact Ability Taken')}
                        {renderHeader('damageTakenByLifeOrb', 'Life Orb Taken')}
                        {renderHeader('damageTakenByMoveRecoil', 'Move Recoil Taken')}
                        {renderHeader('damageTakenBySubstitute', 'Substitute Taken')}
                        {renderHeader('damageTakenBySacrificialMove', 'Sacrificial Move Taken')}
                        {renderHeader('damageTakenByRiskRewardMove', 'Risk Reward Move Taken')}
                        {renderHeader('damageTakenByLeechSeed', 'Leech Seed Taken')}
                        {renderHeader('damageTakenByCurse', 'Curse Taken')}
                        {renderHeader('damageTakenByCurseSelf', 'Curse Self')}
                      </tr>
                    </thead>
                    <tbody>
                      {getRankedData().map((pokemon) => (
                        <tr key={pokemon.name}>
                          <td className={styles.rankCell}>{pokemon.rank}</td>
                          <td className={sortField === 'name' ? styles.activeSort : ''}>
                            <PokemonIcon species={pokemon.name} />
                            {pokemon.name}
                          </td>
                          <td className={sortField === 'kos' ? styles.activeSort : ''}>{pokemon.kos}</td>
                          <td className={sortField === 'fainted' ? styles.activeSort : ''}>{pokemon.fainted ? 'Yes' : 'No'}</td>
                          <td className={sortField === 'won' ? styles.activeSort : ''}>{pokemon.won ? 'Yes' : 'No'}</td>
                          <td className={sortField === 'totalDamageDealt' ? styles.activeSort : ''}>{Math.round(pokemon.totalDamageDealt)}%</td>
                          <td className={sortField === 'directDamageDealt' ? styles.activeSort : ''}>{Math.round(pokemon.directDamageDealt)}%</td>
                          <td className={sortField === 'indirectDamageDealt' ? styles.activeSort : ''}>{Math.round(pokemon.indirectDamageDealt)}%</td>
                          <td className={sortField === 'friendlyFireDamage' ? styles.activeSort : ''}>{Math.round(pokemon.friendlyFireDamage)}%</td>
                          <td className={sortField === 'amountHealed' ? styles.activeSort : ''}>{Math.round(pokemon.amountHealed)}%</td>
                          <td className={sortField === 'amountHealedByRegenerator' ? styles.activeSort : ''}>{Math.round(pokemon.amountHealedByRegenerator)}%</td>
                          <td className={sortField === 'damageDealtBySpikes' ? styles.activeSort : ''}>{Math.round(pokemon.damageDealtBySpikes)}%</td>
                          <td className={sortField === 'damageDealtByStealthRock' ? styles.activeSort : ''}>{Math.round(pokemon.damageDealtByStealthRock)}%</td>
                          <td className={sortField === 'damageDealtByPoison' ? styles.activeSort : ''}>{Math.round(pokemon.damageDealtByPoison)}%</td>
                          <td className={sortField === 'damageDealtByBurn' ? styles.activeSort : ''}>{Math.round(pokemon.damageDealtByBurn)}%</td>
                          <td className={sortField === 'damageDealtBySandstorm' ? styles.activeSort : ''}>{Math.round(pokemon.damageDealtBySandstorm)}%</td>
                          <td className={sortField === 'damageDealtByHail' ? styles.activeSort : ''}>{Math.round(pokemon.damageDealtByHail)}%</td>
                          <td className={sortField === 'damageDealtByRockyHelmet' ? styles.activeSort : ''}>{Math.round(pokemon.damageDealtByRockyHelmet)}%</td>
                          <td className={sortField === 'damageDealtByContactAbility' ? styles.activeSort : ''}>{Math.round(pokemon.damageDealtByContactAbility)}%</td>
                          <td className={sortField === 'damageDealtByLeechSeed' ? styles.activeSort : ''}>{Math.round(pokemon.damageDealtByLeechSeed)}%</td>
                          <td className={sortField === 'damageDealtByCurse' ? styles.activeSort : ''}>{Math.round(pokemon.damageDealtByCurse)}%</td>
                          <td className={sortField === 'totalDamageTaken' ? styles.activeSort : ''}>{Math.round(pokemon.totalDamageTaken)}%</td>
                          <td className={sortField === 'directDamageTaken' ? styles.activeSort : ''}>{Math.round(pokemon.directDamageTaken)}%</td>
                          <td className={sortField === 'indirectDamageTaken' ? styles.activeSort : ''}>{Math.round(pokemon.indirectDamageTaken)}%</td>
                          <td className={sortField === 'damageTakenBySpikes' ? styles.activeSort : ''}>{Math.round(pokemon.damageTakenBySpikes)}%</td>
                          <td className={sortField === 'damageTakenByStealthRock' ? styles.activeSort : ''}>{Math.round(pokemon.damageTakenByStealthRock)}%</td>
                          <td className={sortField === 'damageTakenByPoison' ? styles.activeSort : ''}>{Math.round(pokemon.damageTakenByPoison)}%</td>
                          <td className={sortField === 'damageTakenByBurn' ? styles.activeSort : ''}>{Math.round(pokemon.damageTakenByBurn)}%</td>
                          <td className={sortField === 'damageTakenBySandstorm' ? styles.activeSort : ''}>{Math.round(pokemon.damageTakenBySandstorm)}%</td>
                          <td className={sortField === 'damageTakenByHail' ? styles.activeSort : ''}>{Math.round(pokemon.damageTakenByHail)}%</td>
                          <td className={sortField === 'damageTakenByRockyHelmet' ? styles.activeSort : ''}>{Math.round(pokemon.damageTakenByRockyHelmet)}%</td>
                          <td className={sortField === 'damageTakenByContactAbility' ? styles.activeSort : ''}>{Math.round(pokemon.damageTakenByContactAbility)}%</td>
                          <td className={sortField === 'damageTakenByLifeOrb' ? styles.activeSort : ''}>{Math.round(pokemon.damageTakenByLifeOrb)}%</td>
                          <td className={sortField === 'damageTakenByMoveRecoil' ? styles.activeSort : ''}>{Math.round(pokemon.damageTakenByMoveRecoil)}%</td>
                          <td className={sortField === 'damageTakenBySubstitute' ? styles.activeSort : ''}>{Math.round(pokemon.damageTakenBySubstitute)}%</td>
                          <td className={sortField === 'damageTakenBySacrificialMove' ? styles.activeSort : ''}>{Math.round(pokemon.damageTakenBySacrificialMove)}%</td>
                          <td className={sortField === 'damageTakenByRiskRewardMove' ? styles.activeSort : ''}>{Math.round(pokemon.damageTakenByRiskRewardMove)}%</td>
                          <td className={sortField === 'damageTakenByLeechSeed' ? styles.activeSort : ''}>{Math.round(pokemon.damageTakenByLeechSeed)}%</td>
                          <td className={sortField === 'damageTakenByCurse' ? styles.activeSort : ''}>{Math.round(pokemon.damageTakenByCurse)}%</td>
                          <td className={sortField === 'damageTakenByCurseSelf' ? styles.activeSort : ''}>{Math.round(pokemon.damageTakenByCurseSelf)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Winner and Score */}
            {(data.winner || data.score) && (
              <div className={styles.results__summary}>
                <h3>Result</h3>
                {data.winner && (
                  <p><strong>Winner:</strong> {data.winner}</p>
                )}
                {data.score && (
                  <p><strong>Score:</strong> {data.score}</p>
                )}
              </div>
            )}

            <p><strong>Knock-outs:</strong></p>
            {data.kos.length === 0 ? (
              <p>No KOs recorded.</p>
            ) : (
              <ul>
                {data.kos.map((k, i) => (
                  <li key={i}>
                    <strong>{k.attacker}</strong> KO&apos;s {k.victim}
                    {k.move && ` with ${k.move}`}
                    {k.hazard && ` (${k.hazard})`}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* JSON at the bottom */}
          {/*
          <div className={styles.results__json}>
            <h3>Raw Data</h3>
            <pre>
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
          */}
        </div>
      )}
    </>
  );
}
