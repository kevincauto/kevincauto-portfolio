'use client';

import { useState, FormEvent } from 'react';
import styles from './PokeParserForm.module.css';

type Parsed = {
  p1: { name: string; team: string[] };
  p2: { name: string; team: string[] };
  kos: { attacker: string; victim: string; hazard?: string }[];
  winner?: string;
  score?: string;
  pokemonStats?: { name: string; kos: number; fainted: number; won: number; damageDealt: number; damageTaken: number; hpLost: number }[];
};

type SortField = 'name' | 'kos' | 'fainted' | 'won' | 'damageDealt' | 'damageTaken' | 'hpLost';
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
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
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
          {/* left column – raw JSON */}
          <pre className={styles.results__json}>
            {JSON.stringify(data, null, 2)}
          </pre>

          {/* right column – KO list */}
          <div className={styles.results__kos}>
            <h3>Knock-outs</h3>
            {data.kos.length === 0 ? (
              <p>No KOs recorded.</p>
            ) : (
              <ul>
                {data.kos.map((k, i) => (
                  <li key={i}>
                    <strong>{k.attacker}</strong> KO&apos;s {k.victim}
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
                <table className={styles.results__stats}>
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('name')}>
                        Pokémon {getSortIcon('name')}
                      </th>
                      <th onClick={() => handleSort('kos')}>
                        KOs {getSortIcon('kos')}
                      </th>
                      <th onClick={() => handleSort('fainted')}>
                        Fainted {getSortIcon('fainted')}
                      </th>
                      <th onClick={() => handleSort('won')}>
                        Won {getSortIcon('won')}
                      </th>
                      <th onClick={() => handleSort('damageDealt')}>
                        Direct Damage Dealt {getSortIcon('damageDealt')}
                      </th>
                      <th onClick={() => handleSort('damageTaken')}>
                        Damage Taken {getSortIcon('damageTaken')}
                      </th>
                      <th onClick={() => handleSort('hpLost')}>
                        HP Lost {getSortIcon('hpLost')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedPokemonStats().map((pokemon, i) => (
                      <tr key={i}>
                        <td>{pokemon.name}</td>
                        <td>{pokemon.kos}</td>
                        <td>{pokemon.fainted ? 'Yes' : 'No'}</td>
                        <td>{pokemon.won ? 'Yes' : 'No'}</td>
                        <td>{pokemon.damageDealt.toFixed(1)}%</td>
                        <td>{pokemon.damageTaken.toFixed(1)}%</td>
                        <td>{pokemon.hpLost.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
