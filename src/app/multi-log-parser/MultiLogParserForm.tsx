'use client';

import { useState } from 'react';
import styles from './MultiLogParserForm.module.css';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { AggregatedPokemonStats } from '../api/multi-poke-parser/route'; // Import the new type
import PokemonIcon from '../../components/PokemonIcon';

type SortField = keyof AggregatedPokemonStats;
type SortDirection = 'asc' | 'desc';
type RankedPokemonStats = AggregatedPokemonStats & { rank: number };

// A new component for displaying the results
function ResultsTable({ data }: { data: AggregatedPokemonStats[] }) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getRankedData = (): RankedPokemonStats[] => {
    const sorted = [...data].sort((a, b) => {
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

      // Fallback for mixed types, though shouldn't happen with current data
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    if (sorted.length === 0) {
      return [];
    }

    // Add rank property with tie handling
    const rankedData: RankedPokemonStats[] = [];
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

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <span className={styles.sortIcon}>▲</span>
    ) : (
      <span className={styles.sortIcon}>▼</span>
    );
  };

  const renderHeader = (field: SortField, title: string) => (
    <th onClick={() => handleSort(field)} className={sortField === field ? styles.activeSort : ''}>
      {title} {getSortIcon(field)}
    </th>
  );
  
  const sortedData = getRankedData();

  return (
    <div className={styles.resultsContainer}>
      <h2>Aggregated Statistics</h2>
      <div className={styles.results__statsContainer}>
        <table className={styles.results__stats}>
          <thead>
            <tr>
              <th className={styles.rankHeader}>Rank</th>
              {renderHeader('name', 'Pokémon')}
              {renderHeader('gamesPlayed', 'GP')}
              {renderHeader('won', 'Wins')}
              {renderHeader('kos', 'KOs')}
              {renderHeader('kosPerGame', 'KOs/Game')}
              {renderHeader('fainted', 'Faints')}
              {renderHeader('kosPerFaint', 'K/D Ratio')}
              
              {/* Damage Dealt Section */}
              {renderHeader('totalDamageDealt', 'Total Dmg Dealt')}
              {renderHeader('totalDamageDealtPerGame', 'Dmg Dealt/Game')}
              {renderHeader('directDamageDealt', 'Direct Dmg Dealt')}
              {renderHeader('indirectDamageDealt', 'Indirect Dmg Dealt')}
              {renderHeader('damageDealtBySpikes', 'Spikes Dmg')}
              {renderHeader('damageDealtByStealthRock', 'SR Dmg')}
              {renderHeader('damageDealtByPoison', 'Poison Dmg')}
              {renderHeader('damageDealtByBurn', 'Burn Dmg')}
              {renderHeader('damageDealtBySandstorm', 'Sand Dmg')}
              {renderHeader('damageDealtByHail', 'Hail Dmg')}
              {renderHeader('damageDealtByRockyHelmet', 'Helmet Dmg')}
              {renderHeader('damageDealtByContactAbility', 'Contact Ability Dmg')}
              
              {/* Damage Taken Section */}
              {renderHeader('totalDamageTaken', 'Total Dmg Taken')}
              {renderHeader('totalDamageTakenPerGame', 'Dmg Taken/Game')}
              {renderHeader('directDamageTaken', 'Direct Dmg Taken')}
              {renderHeader('indirectDamageTaken', 'Indirect Dmg Taken')}
              {renderHeader('damageTakenBySpikes', 'Spikes Taken')}
              {renderHeader('damageTakenByStealthRock', 'SR Taken')}
              {renderHeader('damageTakenByPoison', 'Poison Taken')}
              {renderHeader('damageTakenByBurn', 'Burn Taken')}
              {renderHeader('damageTakenBySandstorm', 'Sand Taken')}
              {renderHeader('damageTakenByHail', 'Hail Taken')}
              {renderHeader('damageTakenByRockyHelmet', 'Helmet Taken')}
              {renderHeader('damageTakenByContactAbility', 'Contact Ability Taken')}
              {renderHeader('damageTakenByLifeOrb', 'Life Orb Taken')}
              {renderHeader('damageTakenByMoveRecoil', 'Recoil Taken')}
              {renderHeader('damageTakenBySubstitute', 'Sub Taken')}
              {renderHeader('damageTakenBySacrificialMove', 'Sacrifice Taken')}
              {renderHeader('damageTakenByRiskRewardMove', 'Belly Drum Taken')}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((pokemon) => (
              <tr key={pokemon.name}>
                <td className={styles.rankCell}>{pokemon.rank}</td>
                <td className={sortField === 'name' ? styles.activeSort : ''}>
                  <PokemonIcon species={pokemon.name} />
                  {pokemon.name}
                </td>
                <td className={sortField === 'gamesPlayed' ? styles.activeSort : ''}>{pokemon.gamesPlayed}</td>
                <td className={sortField === 'won' ? styles.activeSort : ''}>{pokemon.won}</td>
                <td className={sortField === 'kos' ? styles.activeSort : ''}>{pokemon.kos}</td>
                <td className={sortField === 'kosPerGame' ? styles.activeSort : ''}>{pokemon.kosPerGame.toFixed(2)}</td>
                <td className={sortField === 'fainted' ? styles.activeSort : ''}>{pokemon.fainted}</td>
                <td className={sortField === 'kosPerFaint' ? styles.activeSort : ''}>{pokemon.kosPerFaint.toFixed(2)}</td>
                
                {/* Damage Dealt Data */}
                <td className={sortField === 'totalDamageDealt' ? styles.activeSort : ''}>{Math.round(pokemon.totalDamageDealt)}%</td>
                <td className={sortField === 'totalDamageDealtPerGame' ? styles.activeSort : ''}>{Math.round(pokemon.totalDamageDealtPerGame)}%</td>
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

                {/* Damage Taken Data */}
                <td className={sortField === 'totalDamageTaken' ? styles.activeSort : ''}>{Math.round(pokemon.totalDamageTaken)}%</td>
                <td className={sortField === 'totalDamageTakenPerGame' ? styles.activeSort : ''}>{Math.round(pokemon.totalDamageTakenPerGame)}%</td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


export default function MultiLogParserForm() {
  const [urls, setUrls] = useState<string[]>([
    'https://replay.pokemonshowdown.com/gen6draft-2285029436',
    'https://replay.pokemonshowdown.com/gen6draft-2285062206',
    'https://replay.pokemonshowdown.com/gen6draft-2284405678-qe49cfosrhd3fk3n1becot0eja8kzw8pw',
    'https://replay.pokemonshowdown.com/gen6draft-2282568731',
    'https://replay.pokemonshowdown.com/gen6draft-2285044929',
    'https://replay.pokemonshowdown.com/gen6draft-2282579062',
    'https://replay.pokemonshowdown.com/gen6draft-2281280985-yx48zc8w07679zy78pm8a1un9ubgd77pw',
    'https://replay.pokemonshowdown.com/gen6draft-2289596322',
    'https://replay.pokemonshowdown.com/gen6draft-2290244859-8dlh167yq8h2ycws9qbbcr4x9dw233lpw',
    'https://replay.pokemonshowdown.com/gen6draft-2290258990',
    'https://replay.pokemonshowdown.com/gen6draft-2289576360-95yvyssrpw7eulekrao0362f948rk35pw',
    'https://replay.pokemonshowdown.com/gen6draft-2290207906-069mdsyf2351bno80brwto9bobiiqsgpw',
    'https://replay.pokemonshowdown.com/gen6ou-2289585899-ka7521e4l22ebepq9cqt1ek9rnwgviupw',
    'https://replay.pokemonshowdown.com/gen6draft-2290225821-kkcfm163t4hiw5luo3jvnfndlv5djuopw',
    'https://replay.pokemonshowdown.com/gen6draft-2293966607',
    'https://replay.pokemonshowdown.com/gen6draft-2293960648',
    'https://replay.pokemonshowdown.com/gen6draft-2298386687-tumdr3x6mh4ul9in4w3ef7pag0feib4pw',
    'https://replay.pokemonshowdown.com/gen6draft-2295277979-je1ambehsl3y08y19goq1w9pfd92m3xpw',
    'https://replay.pokemonshowdown.com/gen6draft-2294627639-vqyvhio8gh77ur9b2eja962cx37461npw',
    'https://replay.pokemonshowdown.com/gen6draft-2294617497-eux5beunbkk3i1e3c57idakim72dgfppw',
    'https://replay.pokemonshowdown.com/gen6draft-2293949568',
    'https://replay.pokemonshowdown.com/gen6draft-2299054978',
    'https://replay.pokemonshowdown.com/gen6draft-2299060627',
    'https://replay.pokemonshowdown.com/gen6draft-2304850226-xginl7mdqcor1b90hwgg33dkqxe1ioepw',
    'https://replay.pokemonshowdown.com/gen6draft-2298398921-ea3sd1r1ahrwm2m4aa4fno6xa18rhoapw',
    'https://replay.pokemonshowdown.com/gen6draft-2299070529-etle3319x10pnxj6o67k18vsq83opcwpw',
    'https://replay.pokemonshowdown.com/gen6draft-2299091893-4nwpfvpuun8123ny83f89hiy6n9ddbtpw',
    'https://replay.pokemonshowdown.com/gen6draft-2299047112',
    'https://replay.pokemonshowdown.com/gen6draft-2304146351',
    'https://replay.pokemonshowdown.com/gen6draft-2303466145-7h9mn40htpech24mlcib65wmrb7joe7pw',
    'https://replay.pokemonshowdown.com/gen6draft-2302870688',
    'https://replay.pokemonshowdown.com/gen6draft-2303499063-a2triattommxakk6bew8y1b04lhjdx3pw',
    'https://replay.pokemonshowdown.com/gen6draft-2303513806',
    'https://replay.pokemonshowdown.com/gen6draft-2303473283',
    'https://replay.pokemonshowdown.com/gen6draft-2303534735-o5305coiclnpidry33jumkkc4qxprmkpw',
    'https://replay.pokemonshowdown.com/gen6draft-2308703278',
    'https://replay.pokemonshowdown.com/gen6draft-2308003900-278gplqlhs5b2ej5nu5fghyffo6tlaypw',
    'https://replay.pokemonshowdown.com/gen6draft-2307990007',
    'https://replay.pokemonshowdown.com/gen6draft-2306611437',
    'https://replay.pokemonshowdown.com/gen6draft-2307291786',
    'https://replay.pokemonshowdown.com/gen6draft-2308014181-77yribtah90n2mtoklq2cl2do2mxyw3pw',
    'https://replay.pokemonshowdown.com/gen6draft-2313425832',
    'https://replay.pokemonshowdown.com/gen6draft-2312670604-tbden1garkng2uv0s7y5ickxovxmn8opw',
    'https://replay.pokemonshowdown.com/gen6draft-2311276956',
    'https://replay.pokemonshowdown.com/gen6draft-2312737369',
    'https://replay.pokemonshowdown.com/gen6draft-2313416526',
    'https://replay.pokemonshowdown.com/gen6draft-2312697339',
    'https://replay.pokemonshowdown.com/gen6draft-2318335414-ibjpb528khxm8p5d9ym15f7bbonuquppw',
    'https://replay.pokemonshowdown.com/gen6draft-2317558250',
    'https://replay.pokemonshowdown.com/gen6draft-2319163694',
    'https://replay.pokemonshowdown.com/gen6draft-2316824538-hh9a86vew9r5lixyr97d82fpsyxwlvppw',
    'https://replay.pokemonshowdown.com/gen6draft-2322833541',
    'https://replay.pokemonshowdown.com/gen6draft-2316838629',
    'https://replay.pokemonshowdown.com/gen6draft-2323557701',
    'https://replay.pokemonshowdown.com/gen6draft-2322041782-desfphlu74lqkk90oqljucs0xsdyq77pw',
    'https://replay.pokemonshowdown.com/gen6draft-2322030433',
    'https://replay.pokemonshowdown.com/gen6draft-2325140350-da9jpgvud1g7l53ljdrrvai3f3ygbpmpw',
    'https://replay.pokemonshowdown.com/gen6draft-2323578264',
    'https://replay.pokemonshowdown.com/gen6draft-2332417125'
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AggregatedPokemonStats[] | null>(null);

  const handleAddInput = () => {
    setUrls([...urls, '']);
  };

  const handleRemoveInput = (index: number) => {
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls);
  };

  const handleInputChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch('/api/multi-poke-parser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });

      const responseData = await res.json();
      
      if (!res.ok) {
        throw new Error(responseData.message ?? 'Unknown server error');
      }

      setResults(responseData.aggregatedStats);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputList}>
          {urls.map((url, index) => (
            <div key={index} className={styles.inputRow}>
              <input
                type="url"
                placeholder="Paste draft replay URL"
                value={url}
                onChange={(e) => handleInputChange(index, e.target.value)}
                className={styles.input}
                required
              />
              <button
                type="button"
                onClick={() => handleRemoveInput(index)}
                className={`${styles.iconButton} ${styles.deleteButton}`}
                disabled={urls.length === 1}
                aria-label="Remove URL"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
        <div className={styles.buttonGroup}>
          <button
            type="button"
            onClick={handleAddInput}
            className={styles.addButton}
            aria-label="Add URL"
          >
            <FaPlus />
            <span>Add Another URL</span>
          </button>
          <button type="submit" className={styles.parseButton} disabled={loading}>
            {loading ? 'Parsing...' : 'Parse All'}
          </button>
        </div>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {results && (
        <>
          <ResultsTable data={results} />
          <div className={styles.resultsContainer}>
            <h2 style={{ marginTop: '1rem' }}>Raw JSON Output</h2>
            <pre className={styles.jsonOutput}>
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        </>
      )}
    </>
  );
} 