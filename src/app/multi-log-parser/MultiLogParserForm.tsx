'use client';

import { useState, useEffect } from 'react';
import styles from './MultiLogParserForm.module.css';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { AggregatedPokemonStats } from '../api/multi-poke-parser/route'; // Import the new type
import PokemonIcon from '../../components/PokemonIcon';
import Image from 'next/image';

const awardExplanations: { [key: string]: string } = {
  "Most Valuable Pokémon": "Best K/D, High Usage",
  "Frank the Tank": "Most Damage Taken",
  "The Passive Aggressor": "Most Indirect Damage Dealt",
  "I'm Trying My Best": "Worst K/D",
  "Conductor of the Pain Train": "Most Damage Dealt",
  "The KO Machine": "Most Knockouts",
};

type DisplayPokemonStats = AggregatedPokemonStats & { winPercentage: number };
type SortField = keyof DisplayPokemonStats;
type SortDirection = 'asc' | 'desc';
type RankedPokemonStats = DisplayPokemonStats & { rank: number };

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
    const dataWithWinPercentage: DisplayPokemonStats[] = data.map(pokemon => ({
      ...pokemon,
      winPercentage: pokemon.gamesPlayed > 0 ? (pokemon.won / pokemon.gamesPlayed) * 100 : 0,
    }));

    const sorted = [...dataWithWinPercentage].sort((a, b) => {
      // Special handling for KOs: if tied, sort by fainted (asc)
      if (sortField === 'kos') {
        const kosComparison = sortDirection === 'asc' ? a.kos - b.kos : b.kos - a.kos;
        if (kosComparison !== 0) {
          return kosComparison;
        }
        return a.fainted - b.fainted; // Ascending faints is better
      }

      const aValue = a[sortField];
      const bValue = b[sortField];

      // Handle numeric comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string comparison for name
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0; // Should not be reached with current data types
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
      <div className={styles.results__statsContainer}>
        <table className={styles.results__stats}>
          <thead>
            <tr>
              <th className={styles.rankHeader}>Rank</th>
              {renderHeader('name', 'Pokémon')}
              {renderHeader('gamesPlayed', 'GP')}
              {renderHeader('won', 'Wins')}
              {renderHeader('winPercentage', 'Win %')}
              {renderHeader('kos', 'KOs')}
              {renderHeader('kosPerGame', 'KOs/Game')}
              {renderHeader('fainted', 'Faints')}
              {renderHeader('kosPerFaint', 'K/D Ratio')}
              {renderHeader('amountHealed', 'Amount Healed')}
              {renderHeader('amountHealedPerGame', 'Healed/Game')}
              {renderHeader('amountHealedByRegenerator', 'Amount Regenerated')}
              {renderHeader('amountRegeneratedPerGame', 'Regen/Game')}
              
              {/* Damage Dealt Section */}
              {renderHeader('totalDamageDealt', 'Total Dmg Dealt')}
              {renderHeader('totalDamageDealtPerGame', 'Dmg Dealt/Game')}
              {renderHeader('directDamageDealt', 'Direct Dmg Dealt')}
              {renderHeader('indirectDamageDealt', 'Indirect Dmg Dealt')}
              {renderHeader('friendlyFireDamage', 'Friendly Fire Dmg')}
              {renderHeader('amountHealed', 'Amount Healed')}
              {renderHeader('damageDealtBySpikes', 'Spikes Dmg')}
              {renderHeader('damageDealtByStealthRock', 'SR Dmg')}
              {renderHeader('damageDealtByPoison', 'Poison Dmg')}
              {renderHeader('damageDealtByBurn', 'Burn Dmg')}
              {renderHeader('damageDealtBySandstorm', 'Sand Dmg')}
              {renderHeader('damageDealtByHail', 'Hail Dmg')}
              {renderHeader('damageDealtByRockyHelmet', 'Helmet Dmg')}
              {renderHeader('damageDealtByContactAbility', 'Contact Ability Dmg')}
              {renderHeader('damageDealtByLeechSeed', 'Leech Seed Dmg')}
              {renderHeader('damageDealtByCurse', 'Curse Dmg')}
              
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
              {renderHeader('damageTakenByLeechSeed', 'Leech Seed Taken')}
              {renderHeader('damageTakenByCurse', 'Curse Taken')}
              {renderHeader('damageTakenByCurseSelf', 'Curse Self Dmg')}
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
                <td className={sortField === 'winPercentage' ? styles.activeSort : ''}>{pokemon.winPercentage.toFixed(1)}%</td>
                <td className={sortField === 'kos' ? styles.activeSort : ''}>{pokemon.kos}</td>
                <td className={sortField === 'kosPerGame' ? styles.activeSort : ''}>{pokemon.kosPerGame.toFixed(2)}</td>
                <td className={sortField === 'fainted' ? styles.activeSort : ''}>{pokemon.fainted}</td>
                <td className={sortField === 'kosPerFaint' ? styles.activeSort : ''}>{pokemon.kosPerFaint.toFixed(2)}</td>
                <td className={sortField === 'amountHealed' ? styles.activeSort : ''}>{Math.round(pokemon.amountHealed)}%</td>
                <td className={sortField === 'amountHealedPerGame' ? styles.activeSort : ''}>{Math.round(pokemon.amountHealedPerGame)}%</td>
                <td className={sortField === 'amountHealedByRegenerator' ? styles.activeSort : ''}>{Math.round(pokemon.amountHealedByRegenerator)}%</td>
                <td className={sortField === 'amountRegeneratedPerGame' ? styles.activeSort : ''}>{Math.round(pokemon.amountRegeneratedPerGame)}%</td>
                
                {/* Damage Dealt Data */}
                <td className={sortField === 'totalDamageDealt' ? styles.activeSort : ''}>{Math.round(pokemon.totalDamageDealt)}%</td>
                <td className={sortField === 'totalDamageDealtPerGame' ? styles.activeSort : ''}>{Math.round(pokemon.totalDamageDealtPerGame)}%</td>
                <td className={sortField === 'directDamageDealt' ? styles.activeSort : ''}>{Math.round(pokemon.directDamageDealt)}%</td>
                <td className={sortField === 'indirectDamageDealt' ? styles.activeSort : ''}>{Math.round(pokemon.indirectDamageDealt)}%</td>
                <td className={sortField === 'friendlyFireDamage' ? styles.activeSort : ''}>{Math.round(pokemon.friendlyFireDamage)}%</td>
                <td className={sortField === 'amountHealed' ? styles.activeSort : ''}>{Math.round(pokemon.amountHealed)}%</td>
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
                <td className={sortField === 'damageTakenByLeechSeed' ? styles.activeSort : ''}>{Math.round(pokemon.damageTakenByLeechSeed)}%</td>
                <td className={sortField === 'damageTakenByCurse' ? styles.activeSort : ''}>{Math.round(pokemon.damageTakenByCurse)}%</td>
                <td className={sortField === 'damageTakenByCurseSelf' ? styles.activeSort : ''}>{Math.round(pokemon.damageTakenByCurseSelf)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AwardCard({ pokemon, award }: { pokemon: AggregatedPokemonStats; award: string }) {
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


export default function MultiLogParserForm() {
  const [urls, setUrls] = useState<string[]>([
    "https://replay.pokemonshowdown.com/gen6draft-2285029436",
    "https://replay.pokemonshowdown.com/gen6draft-2285062206",
    "https://replay.pokemonshowdown.com/gen6draft-2284405678-qe49cfosrhd3fk3n1becot0eja8kzw8pw",
    "https://replay.pokemonshowdown.com/gen6draft-2282568731",
    "https://replay.pokemonshowdown.com/gen6draft-2285044929",
    "https://replay.pokemonshowdown.com/gen6draft-2282579062",
    "https://replay.pokemonshowdown.com/gen6draft-2281280985-yx48zc8w07679zy78pm8a1un9ubgd77pw",
    "https://replay.pokemonshowdown.com/gen6draft-2289596322",
    "https://replay.pokemonshowdown.com/gen6draft-2290244859-8dlh167yq8h2ycws9qbbcr4x9dw233lpw",
    "https://replay.pokemonshowdown.com/gen6draft-2290258990",
    "https://replay.pokemonshowdown.com/gen6draft-2289576360-95yvyssrpw7eulekrao0362f948rk35pw",
    "https://replay.pokemonshowdown.com/gen6draft-2290207906-069mdsyf2351bno80brwto9bobiiqsgpw",
    "https://replay.pokemonshowdown.com/gen6ou-2289585899-ka7521e4l22ebepq9cqt1ek9rnwgviupw",
    "https://replay.pokemonshowdown.com/gen6draft-2290225821-kkcfm163t4hiw5luo3jvnfndlv5djuopw",
    "https://replay.pokemonshowdown.com/gen6draft-2293966607",
    "https://replay.pokemonshowdown.com/gen6draft-2293960648",
    "https://replay.pokemonshowdown.com/gen6draft-2298386687-tumdr3x6mh4ul9in4w3ef7pag0feib4pw",
    "https://replay.pokemonshowdown.com/gen6draft-2295277979-je1ambehsl3y08y19goq1w9pfd92m3xpw",
    "https://replay.pokemonshowdown.com/gen6draft-2294627639-vqyvhio8gh77ur9b2eja962cx37461npw",
    "https://replay.pokemonshowdown.com/gen6draft-2294617497-eux5beunbkk3i1e3c57idakim72dgfppw",
    "https://replay.pokemonshowdown.com/gen6draft-2293949568",
    "https://replay.pokemonshowdown.com/gen6draft-2299054978",
    "https://replay.pokemonshowdown.com/gen6draft-2299060627",
    "https://replay.pokemonshowdown.com/gen6draft-2304850226-xginl7mdqcor1b90hwgg33dkqxe1ioepw",
    "https://replay.pokemonshowdown.com/gen6draft-2298398921-ea3sd1r1ahrwm2m4aa4fno6xa18rhoapw",
    "https://replay.pokemonshowdown.com/gen6draft-2299070529-etle3319x10pnxj6o67k18vsq83opcwpw",
    "https://replay.pokemonshowdown.com/gen6draft-2299091893-4nwpfvpuun8123ny83f89hiy6n9ddbtpw",
    "https://replay.pokemonshowdown.com/gen6draft-2299047112",
    "https://replay.pokemonshowdown.com/gen6draft-2304146351",
    "https://replay.pokemonshowdown.com/gen6draft-2303466145-7h9mn40htpech24mlcib65wmrb7joe7pw",
    "https://replay.pokemonshowdown.com/gen6draft-2302870688",
    "https://replay.pokemonshowdown.com/gen6draft-2303499063-a2triattommxakk6bew8y1b04lhjdx3pw",
    "https://replay.pokemonshowdown.com/gen6draft-2303513806",
    "https://replay.pokemonshowdown.com/gen6draft-2303473283",
    "https://replay.pokemonshowdown.com/gen6draft-2303534735-o5305coiclnpidry33jumkkc4qxprmkpw",
    "https://replay.pokemonshowdown.com/gen6draft-2308703278",
    "https://replay.pokemonshowdown.com/gen6draft-2308003900-278gplqlhs5b2ej5nu5fghyffo6tlaypw",
    "https://replay.pokemonshowdown.com/gen6draft-2307990007",
    "https://replay.pokemonshowdown.com/gen6draft-2306611437",
    "https://replay.pokemonshowdown.com/gen6draft-2307291786",
    "https://replay.pokemonshowdown.com/gen6draft-2308014181-77yribtah90n2mtoklq2cl2do2mxyw3pw",
    "https://replay.pokemonshowdown.com/gen6draft-2313425832",
    "https://replay.pokemonshowdown.com/gen6draft-2312670604-tbden1garkng2uv0s7y5ickxovxmn8opw",
    "https://replay.pokemonshowdown.com/gen6draft-2311276956",
    "https://replay.pokemonshowdown.com/gen6draft-2312737369",
    "https://replay.pokemonshowdown.com/gen6draft-2313416526",
    "https://replay.pokemonshowdown.com/gen6draft-2312697339",
    "https://replay.pokemonshowdown.com/gen6draft-2318335414-ibjpb528khxm8p5d9ym15f7bbonuquppw",
    "https://replay.pokemonshowdown.com/gen6draft-2317558250",
    "https://replay.pokemonshowdown.com/gen6draft-2319163694",
    "https://replay.pokemonshowdown.com/gen6draft-2316824538-hh9a86vew9r5lixyr97d82fpsyxwlvppw",
    "https://replay.pokemonshowdown.com/gen6draft-2322833541",
    "https://replay.pokemonshowdown.com/gen6draft-2316838629",
    "https://replay.pokemonshowdown.com/gen6draft-2323557701",
    "https://replay.pokemonshowdown.com/gen6draft-2322041782-desfphlu74lqkk90oqljucs0xsdyq77pw",
    "https://replay.pokemonshowdown.com/gen6draft-2322030433",
    "https://replay.pokemonshowdown.com/gen6draft-2325140350-da9jpgvud1g7l53ljdrrvai3f3ygbpmpw",
    "https://replay.pokemonshowdown.com/gen6draft-2323578264",
    "https://replay.pokemonshowdown.com/gen6draft-2332417125",
    "https://replay.pokemonshowdown.com/gen6draft-2127166045-gx5ejeumkzii7snh7z7ao6m2ko2iaw2pw",
    "https://replay.pokemonshowdown.com/gen6draft-2125316358-mstf3erlm3e0noj8tcspamy9ct4bs9apw",
    "https://replay.pokemonshowdown.com/gen6draft-2127175580",
    "https://replay.pokemonshowdown.com/gen6draft-2127145319-ckkoixh3x3gip1nilrtqetncj1ud4l0pw",
    "https://replay.pokemonshowdown.com/gen6ou-2127187716",
    "https://replay.pokemonshowdown.com/gen6ou-2127156037",
    "https://replay.pokemonshowdown.com/gen6ou-2131883365",
    "https://replay.pokemonshowdown.com/gen6draft-2131173482",
    "https://replay.pokemonshowdown.com/gen6draft-2132551551-nhynz0kmu73nujh11dob00xjr2auf5cpw",
    "https://replay.pokemonshowdown.com/gen6draft-2130607501",
    "https://replay.pokemonshowdown.com/gen6ou-2131849952",
    "https://replay.pokemonshowdown.com/gen6draft-2133226401-8snpmmnl53qj2qrr8e5unaz44gfpsp8pw",
    "https://replay.pokemonshowdown.com/gen6draft-2132502553",
    "https://replay.pokemonshowdown.com/gen6ou-2131807843",
    "https://replay.pokemonshowdown.com/gen6draft-2135744932",
    "https://replay.pokemonshowdown.com/gen6draft-2137793094-0ijbfwele39231gzt5zcbqjvxzpo3wtpw",
    "https://replay.pokemonshowdown.com/gen6draft-2136446052",
    "https://replay.pokemonshowdown.com/gen6ou-2136463917",
    "https://replay.pokemonshowdown.com/gen6ou-2137115984",
    "https://replay.pokemonshowdown.com/gen6draft-2135141787-6bcgvcr9ow77kwzfy62zdnh7pmsme11pw",
    "https://replay.pokemonshowdown.com/gen6draft-2134534316",
    "https://replay.pokemonshowdown.com/gen6draft-2140928713",
    "https://replay.pokemonshowdown.com/gen6draft-2140923296-mdksw7d3tsy6lxdgfs44qxpqpujf17opw",
    "https://replay.pokemonshowdown.com/gen6draft-2140940707",
    "https://replay.pokemonshowdown.com/gen6ou-2141588413",
    "https://replay.pokemonshowdown.com/gen6draft-2142262497",
    "https://replay.pokemonshowdown.com/gen6draft-2142273493",
    "https://replay.pokemonshowdown.com/gen6draft-2142246610",
    "https://replay.pokemonshowdown.com/gen6draft-2145315847",
    "https://replay.pokemonshowdown.com/gen6draft-2145946653-w72p1i3szkq99khp39klp48x0h5ia75pw",
    "https://replay.pokemonshowdown.com/gen6draft-2145329527-6gux630fwvson8m8o5nwt9v2h2kzr82pw",
    "https://replay.pokemonshowdown.com/gen6draft-2142900092",
    "https://replay.pokemonshowdown.com/gen6ou-2145308088",
    "https://replay.pokemonshowdown.com/gen6draft-2148923163",
    "https://replay.pokemonshowdown.com/gen6draft-2145936196",
    "https://replay.pokemonshowdown.com/gen6draft-2149518804",
    "https://replay.pokemonshowdown.com/gen6draft-2150112301-xc0ouvqh4obynq185znor8wtu5qqbhypw",
    "https://replay.pokemonshowdown.com/gen6draft-2150125334",
    "https://replay.pokemonshowdown.com/gen6draft-2149536223-kijezbr08dxj0h2n81qe7fu9pq6ofmspw",
    "https://replay.pokemonshowdown.com/gen6draft-2147166853",
    "https://replay.pokemonshowdown.com/gen6ou-2149498958",
    "https://replay.pokemonshowdown.com/gen6draft-2149511111",
    "https://replay.pokemonshowdown.com/gen6draft-2153584120",
    "https://replay.pokemonshowdown.com/gen6draft-2153608231-wptz3d73uykaqj8qhh2b9k8hgdmx8nipw",
    "https://replay.pokemonshowdown.com/gen6draft-2153564109",
    "https://replay.pokemonshowdown.com/gen6draft-2152683246-1n181mf9pxi84k8jh923h8y2yczkxdwpw",
    "https://replay.pokemonshowdown.com/gen6draft-2153578008",
    "https://replay.pokemonshowdown.com/gen6draft-2154773422",
    "https://replay.pokemonshowdown.com/gen6draft-2159388710",
    "https://play.pokemonshowdown.com/battle-gen6draft-2158794027-v08u7z834o200s0ry2iu3jo9j8shi5ypw",
    "https://replay.pokemonshowdown.com/gen6draft-2157583228",
    "https://replay.pokemonshowdown.com/gen6draft-2158184440",
    "https://replay.pokemonshowdown.com/gen6draft-2158783839",
    "https://play.pokemonshowdown.com/battle-gen6draft-2161646059",
    "https://replay.pokemonshowdown.com/gen6draft-2165695994",
    "https://replay.pokemonshowdown.com/gen6draft-2157596687-5c4tzn7o82ggshofsmudfrbwga8z6k5pw",
    "https://replay.pokemonshowdown.com/gen6draft-2161654354",
    "https://replay.pokemonshowdown.com/gen6draft-2163442738",
    "https://replay.pokemonshowdown.com/gen6draft-2163451088",
    "https://replay.pokemonshowdown.com/gen6draft-2165113699",
    "https://replay.pokemonshowdown.com/gen6draft-2166337478",
    "https://replay.pokemonshowdown.com/gen6draft-2161640713",
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AggregatedPokemonStats[] | null>(null);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

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

  const handleDeleteAll = () => {
    setUrls(['']);
    setResults(null);
    setError(null);
  };

  const handleParseSeason2 = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const response = await fetch('/season-2.txt');
      if (!response.ok) {
        throw new Error('Failed to fetch season 2 games list.');
      }
      const text = await response.text();
      const urls = text.split('\n').filter(url => url.trim() !== '');
      
      const res = await fetch('/api/multi-poke-parser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'An unexpected error occurred');
      }

      const data = await res.json();
      setResults(data.aggregatedStats);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleParseSeason3 = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      // Fetch the list of URLs from the text file
      const response = await fetch('/season-3-games.txt');
      if (!response.ok) {
        throw new Error('Failed to fetch season 3 games list.');
      }
      const text = await response.text();
      const urls = text.split('\n').filter(url => url.trim() !== '');
      
      // Use these URLs to submit
      const res = await fetch('/api/multi-poke-parser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'An unexpected error occurred');
      }

      const data = await res.json();
      setResults(data.aggregatedStats);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAccordionOpen(false); // Always close accordion on submit
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const normalizedUrls = urls.map(normalizeUrl);
      const res = await fetch('/api/multi-poke-parser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: normalizedUrls }),
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

  let mvp: AggregatedPokemonStats | undefined;
  let frankTheTank: AggregatedPokemonStats | undefined;
  let passiveAggressor: AggregatedPokemonStats | undefined;
  let tryingMyBest: AggregatedPokemonStats | undefined;
  let conductorOfThePainTrain: AggregatedPokemonStats | undefined;
  let shadowRealmAdmin: AggregatedPokemonStats | undefined;

  if (results && results.length > 0) {
    const avgGamesPlayed = results.reduce((sum, p) => sum + p.gamesPlayed, 0) / results.length;
    const eligibleForMvp = results.filter(p => p.gamesPlayed > avgGamesPlayed);

    if (eligibleForMvp.length > 0) {
      mvp = eligibleForMvp.reduce((best, current) => {
        return current.kosPerFaint > best.kosPerFaint ? current : best;
      });
    }

    frankTheTank = results.reduce((best, current) => {
      return current.totalDamageTaken > best.totalDamageTaken ? current : best;
    });

    passiveAggressor = results.reduce((best, current) => {
      return current.indirectDamageDealt > best.indirectDamageDealt ? current : best;
    });

    tryingMyBest = [...results].sort((a, b) => {
      if (a.kosPerFaint < b.kosPerFaint) return -1;
      if (a.kosPerFaint > b.kosPerFaint) return 1;
      // Tie-breaker: more faints is "worse"
      if (a.fainted > b.fainted) return -1;
      if (a.fainted < b.fainted) return 1;
      return 0;
    })[0];

    conductorOfThePainTrain = results.reduce((best, current) => {
      return current.totalDamageDealt > best.totalDamageDealt ? current : best;
    });

    shadowRealmAdmin = [...results].sort((a, b) => {
      if (a.kos > b.kos) return -1;
      if (a.kos < b.kos) return 1;
      // Tie-breaker: more damage dealt
      if (a.totalDamageDealt > b.totalDamageDealt) return -1;
      if (a.totalDamageDealt < b.totalDamageDealt) return 1;
      return 0;
    })[0];
  }

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.accordion}>
          <button
            type="button"
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            className={styles.accordionToggle}
          >
            <span>{isAccordionOpen ? 'Hide Replay URLs' : 'Show Replay URLs'}</span>
            <span className={`${styles.accordionIcon} ${isAccordionOpen ? styles.open : ''}`}>▼</span>
          </button>
          <div className={`${styles.accordionContent} ${isAccordionOpen ? styles.open : ''}`}>
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
            </div>
          </div>
        </div>
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={handleDeleteAll}
            className={styles.deleteAllButton}
          >
            Delete All URLs
          </button>
          <button onClick={handleParseSeason2} className={styles.parseButton} disabled={loading}>
            {loading ? 'Parsing...' : 'Parse Season 2'}
          </button>
          <button onClick={handleParseSeason3} className={styles.parseButton} disabled={loading}>
            {loading ? 'Parsing...' : 'Parse Season 3'}
          </button>
          <button type="submit" className={styles.parseButton} disabled={loading}>
            {loading ? 'Parsing...' : 'Parse All'}
          </button>
        </div>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {(mvp || frankTheTank || passiveAggressor || tryingMyBest || conductorOfThePainTrain || shadowRealmAdmin) && (
        <div className={styles.awardsSection}>
          <h2>Award Winners</h2>
          <div className={styles.awardCardsContainer}>
            {mvp && <AwardCard pokemon={mvp} award="Most Valuable Pokémon" />}
            {shadowRealmAdmin && <AwardCard pokemon={shadowRealmAdmin} award="The KO Machine" />}
            {conductorOfThePainTrain && <AwardCard pokemon={conductorOfThePainTrain} award="Conductor of the Pain Train" />}
            {frankTheTank && <AwardCard pokemon={frankTheTank} award="Frank the Tank" />}
            {passiveAggressor && <AwardCard pokemon={passiveAggressor} award="The Passive Aggressor" />}
            {tryingMyBest && <AwardCard pokemon={tryingMyBest} award="I'm Trying My Best" />}
          </div>
        </div>
      )}

      {results && (
        <>
          <ResultsTable data={results} />
          {/*
          <div className={styles.resultsContainer}>
            <h2 style={{ marginTop: '1rem' }}>Raw JSON Output</h2>
            <pre className={styles.jsonOutput}>
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
          */}
        </>
      )}
    </>
  );
} 