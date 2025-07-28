const { parseShowdownLog } = require('./src/lib/parseShowdownLog.ts');

// Test log with various types of indirect damage taken
const testLog = `|player|p1|Player1
|player|p2|Player2
|poke|p1|Ferrothorn|Ferrothorn|100/100
|poke|p1|Garchomp|Garchomp|100/100
|poke|p2|Machamp|Franky Jr|100/100
|poke|p2|Latios|Latios|100/100
|start
|turn|1
|move|p2a: Latios|Spikes
|-sidestart|p1: Player1|Spikes
|move|p1a: Ferrothorn|Stealth Rock
|-sidestart|p2: Player2|Stealth Rock
|turn|2
|switch|p2a: Franky Jr|Franky Jr|100/100
|-damage|p2a: Franky Jr|88/100|[from] Stealth Rock
|-damage|p2a: Franky Jr|75/100|[from] Spikes
|move|p2a: Franky Jr|Double-Edge|p1a: Ferrothorn
|-damage|p1a: Ferrothorn|79/100
|-damage|p2a: Franky Jr|67/100|[from] ability: Iron Barbs|[of] p1a: Ferrothorn
|-damage|p2a: Franky Jr|59/100|[from] Recoil
|-status|p2a: Franky Jr|brn|[from] item: Flame Orb
|turn|3
|-weather|Sandstorm|[from] ability: Sand Stream|[of] p1a: Garchomp
|-damage|p2a: Franky Jr|51/100 brn|[from] brn
|-damage|p2a: Franky Jr|43/100 brn|[from] Sandstorm
|move|p2a: Franky Jr|Close Combat|p1a: Ferrothorn
|-damage|p1a: Ferrothorn|31/100
|-damage|p2a: Franky Jr|35/100 brn|[from] item: Rocky Helmet|[of] p1a: Ferrothorn
|turn|4
|move|p1a: Garchomp|Outrage|p2a: Franky Jr
|-damage|p2a: Franky Jr|0 fnt
|faint|p2a: Franky Jr
|win|Player1`;

console.log('Testing granular indirect damage taken categories...\n');

const result = parseShowdownLog(testLog);

if (result) {
  console.log('Teams:');
  console.log('P1:', result.p1.team);
  console.log('P2:', result.p2.team);
  console.log('\nKOs:', result.kos.length);
  result.kos.forEach((ko, i) => {
    console.log(`${i + 1}. ${ko.attacker} KO's ${ko.victim}${ko.move ? ` with ${ko.move}` : ''}${ko.hazard ? ` (${ko.hazard})` : ''}`);
  });
  
  console.log('\nPokémon Stats:');
  result.pokemonStats?.forEach(pokemon => {
    console.log(`\n${pokemon.name}:`);
    console.log(`  KOs: ${pokemon.kos}`);
    console.log(`  Direct Damage Dealt: ${pokemon.directDamageDealt.toFixed(0)}%`);
    console.log(`  Indirect Damage Dealt: ${pokemon.indirectDamageDealt.toFixed(0)}%`);
    console.log(`  Direct Damage Taken: ${pokemon.directDamageTaken.toFixed(0)}%`);
    console.log(`  Indirect Damage Taken: ${pokemon.indirectDamageTaken.toFixed(0)}%`);
    console.log(`  HP Lost: ${pokemon.hpLost.toFixed(0)}%`);
    console.log(`  Damage Taken Breakdown:`);
    console.log(`    Spikes: ${pokemon.damageTakenBySpikes.toFixed(0)}%`);
    console.log(`    Stealth Rock: ${pokemon.damageTakenByStealthRock.toFixed(0)}%`);
    console.log(`    Poison: ${pokemon.damageTakenByPoison.toFixed(0)}%`);
    console.log(`    Burn: ${pokemon.damageTakenByBurn.toFixed(0)}%`);
    console.log(`    Sandstorm: ${pokemon.damageTakenBySandstorm.toFixed(0)}%`);
    console.log(`    Hail: ${pokemon.damageTakenByHail.toFixed(0)}%`);
    console.log(`    Rocky Helmet: ${pokemon.damageTakenByRockyHelmet.toFixed(0)}%`);
    console.log(`    Contact Ability: ${pokemon.damageTakenByContactAbility.toFixed(0)}%`);
    console.log(`    Life Orb: ${pokemon.damageTakenByLifeOrb.toFixed(0)}%`);
    console.log(`    Move Recoil: ${pokemon.damageTakenByMoveRecoil.toFixed(0)}%`);
  });
} else {
  console.log('Failed to parse log');
} 