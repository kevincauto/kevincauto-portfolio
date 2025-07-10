'use client';

import { useState, FormEvent } from 'react';
import styles from './PokeParserForm.module.css';

type Parsed = {
  p1: { name: string; team: string[] };
  p2: { name: string; team: string[] };
  kos: { attacker: string; victim: string; hazard?: string; move?: string }[];
  winner?: string;
  score?: string;
  pokemonStats?: { 
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
    // Granular indirect damage categories
    damageDealtBySpikes: number;
    damageDealtByStealthRock: number;
    damageDealtByPoison: number;
    damageDealtByBurn: number;
    damageDealtBySandstorm: number;
    damageDealtByHail: number;
    damageDealtByRockyHelmet: number;
    damageDealtByContactAbility: number;
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
  }[];
};

type SortField = 
  | 'name' 
  | 'kos' 
  | 'fainted' 
  | 'won' 
  | 'directDamageDealt' 
  | 'indirectDamageDealt' 
  | 'totalDamageDealt' 
  | 'directDamageTaken' 
  | 'indirectDamageTaken' 
  | 'totalDamageTaken'
  | 'damageDealtBySpikes'
  | 'damageDealtByStealthRock'
  | 'damageDealtByPoison'
  | 'damageDealtByBurn'
  | 'damageDealtBySandstorm'
  | 'damageDealtByHail'
  | 'damageDealtByRockyHelmet'
  | 'damageDealtByContactAbility'
  | 'damageTakenBySpikes'
  | 'damageTakenByStealthRock'
  | 'damageTakenByPoison'
  | 'damageTakenByBurn'
  | 'damageTakenBySandstorm'
  | 'damageTakenByHail'
  | 'damageTakenByRockyHelmet'
  | 'damageTakenByContactAbility'
  | 'damageTakenByLifeOrb'
  | 'damageTakenByMoveRecoil'
  | 'damageTakenBySubstitute';
type SortDirection = 'asc' | 'desc';

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
        <button className={styles.parser__button} disabled={loading}>
          {loading ? 'Parsing…' : 'Parse'}
        </button>
      </form>
      
      <p className={styles.help}>
        Paste a Pokémon Showdown replay URL (e.g., https://replay.pokemonshowdown.com/gen9draft-1234567890)
      </p>

      {/* Results ----------------------------------------------------------- */}
      {error && <p className={styles.error}>{error}</p>}

      {data && (
        <div className={styles.results}>
          {/* KO list and statistics */}
          <div className={styles.results__content}>
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
                      <th onClick={() => handleSort('indirectDamageDealt')} className={`${styles.indirectDamageHeader} ${sortField === 'indirectDamageDealt' ? styles.activeSort : ''}`}>
                        Indirect Damage Dealt {getSortIcon('indirectDamageDealt')}
                      </th>
                      <th onClick={() => handleSort('damageDealtBySpikes')} className={`${styles.indirectDamageHeader} ${sortField === 'damageDealtBySpikes' ? styles.activeSort : ''}`}>
                        Spikes {getSortIcon('damageDealtBySpikes')}
                      </th>
                      <th onClick={() => handleSort('damageDealtByStealthRock')} className={`${styles.indirectDamageHeader} ${sortField === 'damageDealtByStealthRock' ? styles.activeSort : ''}`}>
                        Stealth Rock {getSortIcon('damageDealtByStealthRock')}
                      </th>
                      <th onClick={() => handleSort('damageDealtByPoison')} className={`${styles.indirectDamageHeader} ${sortField === 'damageDealtByPoison' ? styles.activeSort : ''}`}>
                        Poison {getSortIcon('damageDealtByPoison')}
                      </th>
                      <th onClick={() => handleSort('damageDealtByBurn')} className={`${styles.indirectDamageHeader} ${sortField === 'damageDealtByBurn' ? styles.activeSort : ''}`}>
                        Burn {getSortIcon('damageDealtByBurn')}
                      </th>
                      <th onClick={() => handleSort('damageDealtBySandstorm')} className={`${styles.indirectDamageHeader} ${sortField === 'damageDealtBySandstorm' ? styles.activeSort : ''}`}>
                        Sandstorm {getSortIcon('damageDealtBySandstorm')}
                      </th>
                      <th onClick={() => handleSort('damageDealtByHail')} className={`${styles.indirectDamageHeader} ${sortField === 'damageDealtByHail' ? styles.activeSort : ''}`}>
                        Hail {getSortIcon('damageDealtByHail')}
                      </th>
                      <th onClick={() => handleSort('damageDealtByRockyHelmet')} className={`${styles.indirectDamageHeader} ${sortField === 'damageDealtByRockyHelmet' ? styles.activeSort : ''}`}>
                        Rocky Helmet {getSortIcon('damageDealtByRockyHelmet')}
                      </th>
                      <th onClick={() => handleSort('damageDealtByContactAbility')} className={`${styles.indirectDamageHeader} ${sortField === 'damageDealtByContactAbility' ? styles.activeSort : ''}`}>
                        Contact Ability {getSortIcon('damageDealtByContactAbility')}
                      </th>
                      <th onClick={() => handleSort('totalDamageTaken')} className={sortField === 'totalDamageTaken' ? styles.activeSort : ''}>
                        Total Damage Taken {getSortIcon('totalDamageTaken')}
                      </th>
                      <th onClick={() => handleSort('directDamageTaken')} className={sortField === 'directDamageTaken' ? styles.activeSort : ''}>
                        Direct Damage Taken {getSortIcon('directDamageTaken')}
                      </th>
                      <th onClick={() => handleSort('indirectDamageTaken')} className={`${styles.indirectDamageTakenHeader} ${sortField === 'indirectDamageTaken' ? styles.activeSort : ''}`}>
                        Indirect Damage Taken {getSortIcon('indirectDamageTaken')}
                      </th>
                      <th onClick={() => handleSort('damageTakenBySpikes')} className={`${styles.indirectDamageTakenHeader} ${sortField === 'damageTakenBySpikes' ? styles.activeSort : ''}`}>
                        Spikes Taken {getSortIcon('damageTakenBySpikes')}
                      </th>
                      <th onClick={() => handleSort('damageTakenByStealthRock')} className={`${styles.indirectDamageTakenHeader} ${sortField === 'damageTakenByStealthRock' ? styles.activeSort : ''}`}>
                        Stealth Rock Taken {getSortIcon('damageTakenByStealthRock')}
                      </th>
                      <th onClick={() => handleSort('damageTakenByPoison')} className={`${styles.indirectDamageTakenHeader} ${sortField === 'damageTakenByPoison' ? styles.activeSort : ''}`}>
                        Poison Taken {getSortIcon('damageTakenByPoison')}
                      </th>
                      <th onClick={() => handleSort('damageTakenByBurn')} className={`${styles.indirectDamageTakenHeader} ${sortField === 'damageTakenByBurn' ? styles.activeSort : ''}`}>
                        Burn Taken {getSortIcon('damageTakenByBurn')}
                      </th>
                      <th onClick={() => handleSort('damageTakenBySandstorm')} className={`${styles.indirectDamageTakenHeader} ${sortField === 'damageTakenBySandstorm' ? styles.activeSort : ''}`}>
                        Sandstorm Taken {getSortIcon('damageTakenBySandstorm')}
                      </th>
                      <th onClick={() => handleSort('damageTakenByHail')} className={`${styles.indirectDamageTakenHeader} ${sortField === 'damageTakenByHail' ? styles.activeSort : ''}`}>
                        Hail Taken {getSortIcon('damageTakenByHail')}
                      </th>
                      <th onClick={() => handleSort('damageTakenByRockyHelmet')} className={`${styles.indirectDamageTakenHeader} ${sortField === 'damageTakenByRockyHelmet' ? styles.activeSort : ''}`}>
                        Rocky Helmet Taken {getSortIcon('damageTakenByRockyHelmet')}
                      </th>
                      <th onClick={() => handleSort('damageTakenByContactAbility')} className={`${styles.indirectDamageTakenHeader} ${sortField === 'damageTakenByContactAbility' ? styles.activeSort : ''}`}>
                        Contact Ability Taken {getSortIcon('damageTakenByContactAbility')}
                      </th>
                      <th onClick={() => handleSort('damageTakenByLifeOrb')} className={`${styles.indirectDamageTakenHeader} ${sortField === 'damageTakenByLifeOrb' ? styles.activeSort : ''}`}>
                        Life Orb Taken {getSortIcon('damageTakenByLifeOrb')}
                      </th>
                      <th onClick={() => handleSort('damageTakenByMoveRecoil')} className={`${styles.indirectDamageTakenHeader} ${sortField === 'damageTakenByMoveRecoil' ? styles.activeSort : ''}`}>
                        Move Recoil Taken {getSortIcon('damageTakenByMoveRecoil')}
                      </th>
                      <th onClick={() => handleSort('damageTakenBySubstitute')} className={`${styles.indirectDamageTakenHeader} ${sortField === 'damageTakenBySubstitute' ? styles.activeSort : ''}`}>
                        Substitute Taken {getSortIcon('damageTakenBySubstitute')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedPokemonStats().map((pokemon) => (
                      <tr key={pokemon.name}>
                        <td className={sortField === 'name' ? styles.activeSort : ''}>{pokemon.name}</td>
                        <td className={sortField === 'kos' ? styles.activeSort : ''}>{pokemon.kos}</td>
                        <td className={sortField === 'fainted' ? styles.activeSort : ''}>{pokemon.fainted ? 'Yes' : 'No'}</td>
                        <td className={sortField === 'won' ? styles.activeSort : ''}>{pokemon.won ? 'Yes' : 'No'}</td>
                        <td className={sortField === 'totalDamageDealt' ? styles.activeSort : ''}>{Math.round(pokemon.totalDamageDealt)}%</td>
                        <td className={sortField === 'directDamageDealt' ? styles.activeSort : ''}>{Math.round(pokemon.directDamageDealt)}%</td>
                        <td className={sortField === 'indirectDamageDealt' ? styles.activeSort : ''}>{Math.round(pokemon.indirectDamageDealt)}%</td>
                        <td className={sortField === 'damageDealtBySpikes' ? styles.activeSort : ''}>{Math.round(pokemon.damageDealtBySpikes)}%</td>
                        <td className={sortField === 'damageDealtByStealthRock' ? styles.activeSort : ''}>{Math.round(pokemon.damageDealtByStealthRock)}%</td>
                        <td className={sortField === 'damageDealtByPoison' ? styles.activeSort : ''}>{Math.round(pokemon.damageDealtByPoison)}%</td>
                        <td className={sortField === 'damageDealtByBurn' ? styles.activeSort : ''}>{Math.round(pokemon.damageDealtByBurn)}%</td>
                        <td className={sortField === 'damageDealtBySandstorm' ? styles.activeSort : ''}>{Math.round(pokemon.damageDealtBySandstorm)}%</td>
                        <td className={sortField === 'damageDealtByHail' ? styles.activeSort : ''}>{Math.round(pokemon.damageDealtByHail)}%</td>
                        <td className={sortField === 'damageDealtByRockyHelmet' ? styles.activeSort : ''}>{Math.round(pokemon.damageDealtByRockyHelmet)}%</td>
                        <td className={sortField === 'damageDealtByContactAbility' ? styles.activeSort : ''}>{Math.round(pokemon.damageDealtByContactAbility)}%</td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>

          {/* JSON at the bottom */}
          <div className={styles.results__json}>
            <h3>Raw Data</h3>
            <pre>
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}
