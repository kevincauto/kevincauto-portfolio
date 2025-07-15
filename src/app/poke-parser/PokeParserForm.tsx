'use client';

import { useState, FormEvent, useEffect } from 'react';
import styles from './PokeParserForm.module.css';
import PokemonIcon from '../../components/PokemonIcon';
import Image from 'next/image';

const awardExplanations: { [key: string]: string } = {
  "The KO Machine": "Most KOs",
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
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch('/api/poke-parser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const responseData = await res.json();
      
      if (!res.ok) {
        throw new Error(responseData.message ?? 'Unknown server error');
      }

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
      setSortDirection('asc');
    }
  }

  function getSortedPokemonStats() {
    if (!data?.pokemonStats) return [];
    
    return [...data.pokemonStats].sort((a, b) => {
      let aValue: string | number = a[sortField];
      let bValue: string | number = b[sortField];
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  function getSortIcon(field: SortField) {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <span className={styles.sortIcon}>▲</span>
    ) : (
      <span className={styles.sortIcon}>▼</span>
    );
  }

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
                      <th onClick={() => handleSort('name')} className={sortField === 'name' ? styles.activeSort : ''}>
                        Pokémon {getSortIcon('name')}
                      </th>
                      <th onClick={() => handleSort('kos')} className={sortField === 'kos' ? styles.activeSort : ''}>
                        KOs {getSortIcon('kos')}
                      </th>
                      <th onClick={() => handleSort('fainted')} className={sortField === 'fainted' ? styles.activeSort : ''}>
                        Fainted {getSortIcon('fainted')}
                      </th>
                      <th onClick={() => handleSort('won')} className={sortField === 'won' ? styles.activeSort : ''}>
                        Won {getSortIcon('won')}
                      </th>
                      <th onClick={() => handleSort('totalDamageDealt')} className={sortField === 'totalDamageDealt' ? styles.activeSort : ''}>
                        Total Damage Dealt {getSortIcon('totalDamageDealt')}
                      </th>
                      <th onClick={() => handleSort('directDamageDealt')} className={sortField === 'directDamageDealt' ? styles.activeSort : ''}>
                        Direct Damage Dealt {getSortIcon('directDamageDealt')}
                      </th>
                      <th onClick={() => handleSort('indirectDamageDealt')} className={sortField === 'indirectDamageDealt' ? styles.activeSort : ''}>
                        Indirect Damage Dealt {getSortIcon('indirectDamageDealt')}
                      </th>
                      <th onClick={() => handleSort('friendlyFireDamage')} className={sortField === 'friendlyFireDamage' ? styles.activeSort : ''}>
                        Friendly Fire Dmg {getSortIcon('friendlyFireDamage')}
                      </th>
                      <th onClick={() => handleSort('damageDealtBySpikes')} className={sortField === 'damageDealtBySpikes' ? styles.activeSort : ''}>
                        Spikes {getSortIcon('damageDealtBySpikes')}
                      </th>
                      <th onClick={() => handleSort('damageDealtByStealthRock')} className={sortField === 'damageDealtByStealthRock' ? styles.activeSort : ''}>
                        Stealth Rock {getSortIcon('damageDealtByStealthRock')}
                      </th>
                      <th onClick={() => handleSort('damageDealtByPoison')} className={sortField === 'damageDealtByPoison' ? styles.activeSort : ''}>
                        Poison {getSortIcon('damageDealtByPoison')}
                      </th>
                      <th onClick={() => handleSort('damageDealtByBurn')} className={sortField === 'damageDealtByBurn' ? styles.activeSort : ''}>
                        Burn {getSortIcon('damageDealtByBurn')}
                      </th>
                      <th onClick={() => handleSort('damageDealtBySandstorm')} className={sortField === 'damageDealtBySandstorm' ? styles.activeSort : ''}>
                        Sandstorm {getSortIcon('damageDealtBySandstorm')}
                      </th>
                      <th onClick={() => handleSort('damageDealtByHail')} className={sortField === 'damageDealtByHail' ? styles.activeSort : ''}>
                        Hail {getSortIcon('damageDealtByHail')}
                      </th>
                      <th onClick={() => handleSort('damageDealtByRockyHelmet')} className={sortField === 'damageDealtByRockyHelmet' ? styles.activeSort : ''}>
                        Rocky Helmet {getSortIcon('damageDealtByRockyHelmet')}
                      </th>
                      <th onClick={() => handleSort('damageDealtByContactAbility')} className={sortField === 'damageDealtByContactAbility' ? styles.activeSort : ''}>
                        Contact Ability {getSortIcon('damageDealtByContactAbility')}
                      </th>
                      <th onClick={() => handleSort('damageDealtByLeechSeed')} className={sortField === 'damageDealtByLeechSeed' ? styles.activeSort : ''}>
                        Leech Seed Dealt {getSortIcon('damageDealtByLeechSeed')}
                      </th>
                      <th onClick={() => handleSort('damageDealtByCurse')} className={sortField === 'damageDealtByCurse' ? styles.activeSort : ''}>
                        Curse Dealt {getSortIcon('damageDealtByCurse')}
                      </th>
                      <th onClick={() => handleSort('totalDamageTaken')} className={sortField === 'totalDamageTaken' ? styles.activeSort : ''}>
                        Total Damage Taken {getSortIcon('totalDamageTaken')}
                      </th>
                      <th onClick={() => handleSort('directDamageTaken')} className={sortField === 'directDamageTaken' ? styles.activeSort : ''}>
                        Direct Damage Taken {getSortIcon('directDamageTaken')}
                      </th>
                      <th onClick={() => handleSort('indirectDamageTaken')} className={sortField === 'indirectDamageTaken' ? styles.activeSort : ''}>
                        Indirect Damage Taken {getSortIcon('indirectDamageTaken')}
                      </th>
                      <th onClick={() => handleSort('damageTakenBySpikes')} className={sortField === 'damageTakenBySpikes' ? styles.activeSort : ''}>
                        Spikes Taken {getSortIcon('damageTakenBySpikes')}
                      </th>
                      <th onClick={() => handleSort('damageTakenByStealthRock')} className={sortField === 'damageTakenByStealthRock' ? styles.activeSort : ''}>
                        Stealth Rock Taken {getSortIcon('damageTakenByStealthRock')}
                      </th>
                      <th onClick={() => handleSort('damageTakenByPoison')} className={sortField === 'damageTakenByPoison' ? styles.activeSort : ''}>
                        Poison Taken {getSortIcon('damageTakenByPoison')}
                      </th>
                      <th onClick={() => handleSort('damageTakenByBurn')} className={sortField === 'damageTakenByBurn' ? styles.activeSort : ''}>
                        Burn Taken {getSortIcon('damageTakenByBurn')}
                      </th>
                      <th onClick={() => handleSort('damageTakenBySandstorm')} className={sortField === 'damageTakenBySandstorm' ? styles.activeSort : ''}>
                        Sandstorm Taken {getSortIcon('damageTakenBySandstorm')}
                      </th>
                      <th onClick={() => handleSort('damageTakenByHail')} className={sortField === 'damageTakenByHail' ? styles.activeSort : ''}>
                        Hail Taken {getSortIcon('damageTakenByHail')}
                      </th>
                      <th onClick={() => handleSort('damageTakenByRockyHelmet')} className={sortField === 'damageTakenByRockyHelmet' ? styles.activeSort : ''}>
                        Rocky Helmet Taken {getSortIcon('damageTakenByRockyHelmet')}
                      </th>
                      <th onClick={() => handleSort('damageTakenByContactAbility')} className={sortField === 'damageTakenByContactAbility' ? styles.activeSort : ''}>
                        Contact Ability Taken {getSortIcon('damageTakenByContactAbility')}
                      </th>
                      <th onClick={() => handleSort('damageTakenByLifeOrb')} className={sortField === 'damageTakenByLifeOrb' ? styles.activeSort : ''}>
                        Life Orb Taken {getSortIcon('damageTakenByLifeOrb')}
                      </th>
                      <th onClick={() => handleSort('damageTakenByMoveRecoil')} className={sortField === 'damageTakenByMoveRecoil' ? styles.activeSort : ''}>
                        Move Recoil Taken {getSortIcon('damageTakenByMoveRecoil')}
                      </th>
                      <th onClick={() => handleSort('damageTakenBySubstitute')} className={sortField === 'damageTakenBySubstitute' ? styles.activeSort : ''}>
                        Substitute Taken {getSortIcon('damageTakenBySubstitute')}
                      </th>
                      <th onClick={() => handleSort('damageTakenBySacrificialMove')} className={sortField === 'damageTakenBySacrificialMove' ? styles.activeSort : ''}>
                        Sacrificial Move Taken {getSortIcon('damageTakenBySacrificialMove')}
                      </th>
                      <th onClick={() => handleSort('damageTakenByRiskRewardMove')} className={sortField === 'damageTakenByRiskRewardMove' ? styles.activeSort : ''}>
                        Risk Reward Move Taken {getSortIcon('damageTakenByRiskRewardMove')}
                      </th>
                      <th onClick={() => handleSort('damageTakenByLeechSeed')} className={sortField === 'damageTakenByLeechSeed' ? styles.activeSort : ''}>
                        Leech Seed Taken {getSortIcon('damageTakenByLeechSeed')}
                      </th>
                      <th onClick={() => handleSort('damageTakenByCurse')} className={sortField === 'damageTakenByCurse' ? styles.activeSort : ''}>
                        Curse Taken {getSortIcon('damageTakenByCurse')}
                      </th>
                      <th onClick={() => handleSort('damageTakenByCurseSelf')} className={sortField === 'damageTakenByCurseSelf' ? styles.activeSort : ''}>
                        Curse Self {getSortIcon('damageTakenByCurseSelf')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedPokemonStats().map((pokemon) => (
                      <tr key={pokemon.name}>
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

            <h3>Knock-outs</h3>
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
