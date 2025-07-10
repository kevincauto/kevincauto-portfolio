const { parseShowdownLog } = require('./src/lib/parseShowdownLog.ts');

// Test log with self-inflicted status from items
const testLog = `|player|p1|Player1
|player|p2|Player2
|poke|p1|Ferrothorn|Ferrothorn|100/100
|poke|p2|Machamp|Franky Jr|100/100
|start
|turn|1
|move|p2a: Franky Jr|Double-Edge|p1a: Ferrothorn
|-resisted|p1a: Ferrothorn
|-damage|p1a: Ferrothorn|79/100
|-damage|p2a: Franky Jr|82/100 brn|[from] ability: Iron Barbs|[of] p1a: Ferrothorn
|-damage|p2a: Franky Jr|74/100 brn|[from] Recoil
|-status|p2a: Franky Jr|brn|[from] item: Flame Orb
|turn|2
|-damage|p2a: Franky Jr|66/100 brn|[from] brn
|win|Player1`;

console.log('Testing Flame Orb status attribution...\n');

const result = parseShowdownLog(testLog);

if (result) {
  console.log('Teams:');
  console.log('P1:', result.p1.team);
  console.log('P2:', result.p2.team);
  console.log('\nKOs:', result.kos.length);
  console.log('\nPokémon Stats:');
  result.pokemonStats?.forEach(pokemon => {
    console.log(`${pokemon.name}:`);
    console.log(`  KOs: ${pokemon.kos}`);
    console.log(`  Direct Damage Dealt: ${pokemon.directDamageDealt.toFixed(0)}%`);
    console.log(`  Indirect Damage Dealt: ${pokemon.indirectDamageDealt.toFixed(0)}%`);
    console.log(`  Damage Dealt by Burn: ${pokemon.damageDealtByBurn.toFixed(0)}%`);
    console.log(`  Direct Damage Taken: ${pokemon.directDamageTaken.toFixed(0)}%`);
    console.log(`  Indirect Damage Taken: ${pokemon.indirectDamageTaken.toFixed(0)}%`);
    console.log(`  HP Lost: ${pokemon.hpLost.toFixed(0)}%`);
  });
} else {
  console.log('Failed to parse log');
} 