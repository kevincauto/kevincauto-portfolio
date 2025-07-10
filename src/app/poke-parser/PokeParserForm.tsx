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
    hpLost: number;
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
  | 'hpLost'
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
  | 'damageTakenByMoveRecoil';
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
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? '▲' : '▼';
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
                      <th
                        onClick={() => handleSort('name')}
                        className={`${styles.pokemonNameHeader} ${styles.sortable} ${sortField === 'name' ? styles.sorted : ''}`}
                        scope="col"
                      >
                        <span>Pokémon</span>
                        {getSortIcon('name') && <span className={styles.caret}>{getSortIcon('name')}</span>}
                      </th>
                      <th
                        onClick={() => handleSort('kos')}
                        className={`${styles.sortable} ${sortField === 'kos' ? styles.sorted : ''}`}
                        scope="col"
                      >
                        <span>KOs</span>
                        {getSortIcon('kos') && <span className={styles.caret}>{getSortIcon('kos')}</span>}
                      </th>
                      <th
                        onClick={() => handleSort('fainted')}
                        className={`${styles.sortable} ${sortField === 'fainted' ? styles.sorted : ''}`}
                        scope="col"
                      >
                        <span>Fainted</span>
                        {getSortIcon('fainted') && <span className={styles.caret}>{getSortIcon('fainted')}</span>}
                      </th>
                      <th
                        onClick={() => handleSort('won')}
                        className={`${styles.sortable} ${sortField === 'won' ? styles.sorted : ''}`}
                        scope="col"
                      >
                        <span>Won</span>
                        {getSortIcon('won') && <span className={styles.caret}>{getSortIcon('won')}</span>}
                      </th>
                      <th
                        onClick={() => handleSort('totalDamageDealt')}
                        className={`${styles.sortable} ${sortField === 'totalDamageDealt' ? styles.sorted : ''}`}
                        scope="col"
                      >
                        <span>Total Damage Dealt</span>
                        {getSortIcon('totalDamageDealt') && <span className={styles.caret}>{getSortIcon('totalDamageDealt')}</span>}
                      </th>
                      <th
                        onClick={() => handleSort('directDamageDealt')}
                        className={`${styles.sortable} ${sortField === 'directDamageDealt' ? styles.sorted : ''}`}
                        scope="col"
                      >
                        <span>Direct Damage Dealt</span>
                        {getSortIcon('directDamageDealt') && <span className={styles.caret}>{getSortIcon('directDamageDealt')}</span>}
                      </th>
                      <th
                        onClick={() => handleSort('indirectDamageDealt')}
                        className={`${styles.indirectDamageHeader} ${styles.sortable} ${sortField === 'indirectDamageDealt' ? styles.sorted : ''}`}
                        scope="col"
                      >
                        <span>Indirect Damage Dealt</span>
                        {getSortIcon('indirectDamageDealt') && <span className={styles.caret}>{getSortIcon('indirectDamageDealt')}</span>}
                      </th>
                      <th onClick={() => handleSort('damageDealtBySpikes')} className={styles.indirectDamageHeader}>
                        <span>Spikes</span>
                        {getSortIcon('damageDealtBySpikes') && <span className={styles.caret}>{getSortIcon('damageDealtBySpikes')}</span>}
                      </th>
                      <th onClick={() => handleSort('damageDealtByStealthRock')} className={styles.indirectDamageHeader}>
                        <span>Stealth Rock</span>
                        {getSortIcon('damageDealtByStealthRock') && <span className={styles.caret}>{getSortIcon('damageDealtByStealthRock')}</span>}
                      </th>
                      <th onClick={() => handleSort('damageDealtByPoison')} className={styles.indirectDamageHeader}>
                        <span>Poison</span>
                        {getSortIcon('damageDealtByPoison') && <span className={styles.caret}>{getSortIcon('damageDealtByPoison')}</span>}
                      </th>
                      <th onClick={() => handleSort('damageDealtByBurn')} className={styles.indirectDamageHeader}>
                        <span>Burn</span>
                        {getSortIcon('damageDealtByBurn') && <span className={styles.caret}>{getSortIcon('damageDealtByBurn')}</span>}
                      </th>
                      <th onClick={() => handleSort('damageDealtBySandstorm')} className={styles.indirectDamageHeader}>
                        <span>Sandstorm</span>
                        {getSortIcon('damageDealtBySandstorm') && <span className={styles.caret}>{getSortIcon('damageDealtBySandstorm')}</span>}
                      </th>
                      <th onClick={() => handleSort('damageDealtByHail')} className={styles.indirectDamageHeader}>
                        <span>Hail</span>
                        {getSortIcon('damageDealtByHail') && <span className={styles.caret}>{getSortIcon('damageDealtByHail')}</span>}
                      </th>
                      <th onClick={() => handleSort('damageDealtByRockyHelmet')} className={styles.indirectDamageHeader}>
                        <span>Rocky Helmet</span>
                        {getSortIcon('damageDealtByRockyHelmet') && <span className={styles.caret}>{getSortIcon('damageDealtByRockyHelmet')}</span>}
                      </th>
                      <th onClick={() => handleSort('damageDealtByContactAbility')} className={styles.indirectDamageHeader}>
                        <span>Contact Ability</span>
                        {getSortIcon('damageDealtByContactAbility') && <span className={styles.caret}>{getSortIcon('damageDealtByContactAbility')}</span>}
                      </th>
                      <th onClick={() => handleSort('hpLost')}>
                        <span>HP Lost</span>
                        {getSortIcon('hpLost') && <span className={styles.caret}>{getSortIcon('hpLost')}</span>}
                      </th>
                      <th onClick={() => handleSort('directDamageTaken')}>
                        <span>Direct Damage Taken</span>
                        {getSortIcon('directDamageTaken') && <span className={styles.caret}>{getSortIcon('directDamageTaken')}</span>}
                      </th>
                      <th onClick={() => handleSort('indirectDamageTaken')} className={styles.indirectDamageTakenHeader}>
                        <span>Indirect Damage Taken</span>
                        {getSortIcon('indirectDamageTaken') && <span className={styles.caret}>{getSortIcon('indirectDamageTaken')}</span>}
                      </th>
                      <th onClick={() => handleSort('damageTakenBySpikes')} className={styles.indirectDamageTakenHeader}>
                        <span>Spikes Taken</span>
                        {getSortIcon('damageTakenBySpikes') && <span className={styles.caret}>{getSortIcon('damageTakenBySpikes')}</span>}
                      </th>
                      <th onClick={() => handleSort('damageTakenByStealthRock')} className={styles.indirectDamageTakenHeader}>
                        <span>Stealth Rock Taken</span>
                        {getSortIcon('damageTakenByStealthRock') && <span className={styles.caret}>{getSortIcon('damageTakenByStealthRock')}</span>}
                      </th>
                      <th onClick={() => handleSort('damageTakenByPoison')} className={styles.indirectDamageTakenHeader}>
                        <span>Poison Taken</span>
                        {getSortIcon('damageTakenByPoison') && <span className={styles.caret}>{getSortIcon('damageTakenByPoison')}</span>}
                      </th>
                      <th onClick={() => handleSort('damageTakenByBurn')} className={styles.indirectDamageTakenHeader}>
                        <span>Burn Taken</span>
                        {getSortIcon('damageTakenByBurn') && <span className={styles.caret}>{getSortIcon('damageTakenByBurn')}</span>}
                      </th>
                      <th onClick={() => handleSort('damageTakenBySandstorm')} className={styles.indirectDamageTakenHeader}>
                        <span>Sandstorm Taken</span>
                        {getSortIcon('damageTakenBySandstorm') && <span className={styles.caret}>{getSortIcon('damageTakenBySandstorm')}</span>}
                      </th>
                      <th onClick={() => handleSort('damageTakenByHail')} className={styles.indirectDamageTakenHeader}>
                        <span>Hail Taken</span>
                        {getSortIcon('damageTakenByHail') && <span className={styles.caret}>{getSortIcon('damageTakenByHail')}</span>}
                      </th>
                      <th onClick={() => handleSort('damageTakenByRockyHelmet')} className={styles.indirectDamageTakenHeader}>
                        <span>Rocky Helmet Taken</span>
                        {getSortIcon('damageTakenByRockyHelmet') && <span className={styles.caret}>{getSortIcon('damageTakenByRockyHelmet')}</span>}
                      </th>
                      <th onClick={() => handleSort('damageTakenByContactAbility')} className={styles.indirectDamageTakenHeader}>
                        <span>Contact Ability Taken</span>
                        {getSortIcon('damageTakenByContactAbility') && <span className={styles.caret}>{getSortIcon('damageTakenByContactAbility')}</span>}
                      </th>
                      <th onClick={() => handleSort('damageTakenByLifeOrb')} className={styles.indirectDamageTakenHeader}>
                        <span>Life Orb Taken</span>
                        {getSortIcon('damageTakenByLifeOrb') && <span className={styles.caret}>{getSortIcon('damageTakenByLifeOrb')}</span>}
                      </th>
                      <th onClick={() => handleSort('damageTakenByMoveRecoil')} className={styles.indirectDamageTakenHeader}>
                        <span>Move Recoil Taken</span>
                        {getSortIcon('damageTakenByMoveRecoil') && <span className={styles.caret}>{getSortIcon('damageTakenByMoveRecoil')}</span>}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedPokemonStats().map((pokemon, i) => (
                      <tr key={i}>
                        <td className={styles.pokemonNameCell}>{pokemon.name}</td>
                        <td>{pokemon.kos}</td>
                        <td>{pokemon.fainted ? 'Yes' : 'No'}</td>
                        <td>{pokemon.won ? 'Yes' : 'No'}</td>
                        <td>{pokemon.totalDamageDealt.toFixed(0)}%</td>
                        <td>{pokemon.directDamageDealt.toFixed(0)}%</td>
                        <td className={styles.indirectDamageCell}>{pokemon.indirectDamageDealt.toFixed(0)}%</td>
                        <td className={styles.indirectDamageCell}>{pokemon.damageDealtBySpikes.toFixed(0)}%</td>
                        <td className={styles.indirectDamageCell}>{pokemon.damageDealtByStealthRock.toFixed(0)}%</td>
                        <td className={styles.indirectDamageCell}>{pokemon.damageDealtByPoison.toFixed(0)}%</td>
                        <td className={styles.indirectDamageCell}>{pokemon.damageDealtByBurn.toFixed(0)}%</td>
                        <td className={styles.indirectDamageCell}>{pokemon.damageDealtBySandstorm.toFixed(0)}%</td>
                        <td className={styles.indirectDamageCell}>{pokemon.damageDealtByHail.toFixed(0)}%</td>
                        <td className={styles.indirectDamageCell}>{pokemon.damageDealtByRockyHelmet.toFixed(0)}%</td>
                        <td className={styles.indirectDamageCell}>{pokemon.damageDealtByContactAbility.toFixed(0)}%</td>
                        <td>{pokemon.hpLost.toFixed(0)}%</td>
                        <td>{pokemon.directDamageTaken.toFixed(0)}%</td>
                        <td className={styles.indirectDamageTakenCell}>{pokemon.indirectDamageTaken.toFixed(0)}%</td>
                        <td className={styles.indirectDamageTakenCell}>{pokemon.damageTakenBySpikes.toFixed(0)}%</td>
                        <td className={styles.indirectDamageTakenCell}>{pokemon.damageTakenByStealthRock.toFixed(0)}%</td>
                        <td className={styles.indirectDamageTakenCell}>{pokemon.damageTakenByPoison.toFixed(0)}%</td>
                        <td className={styles.indirectDamageTakenCell}>{pokemon.damageTakenByBurn.toFixed(0)}%</td>
                        <td className={styles.indirectDamageTakenCell}>{pokemon.damageTakenBySandstorm.toFixed(0)}%</td>
                        <td className={styles.indirectDamageTakenCell}>{pokemon.damageTakenByHail.toFixed(0)}%</td>
                        <td className={styles.indirectDamageTakenCell}>{pokemon.damageTakenByRockyHelmet.toFixed(0)}%</td>
                        <td className={styles.indirectDamageTakenCell}>{pokemon.damageTakenByContactAbility.toFixed(0)}%</td>
                        <td className={styles.indirectDamageTakenCell}>{pokemon.damageTakenByLifeOrb.toFixed(0)}%</td>
                        <td className={styles.indirectDamageTakenCell}>{pokemon.damageTakenByMoveRecoil.toFixed(0)}%</td>
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
