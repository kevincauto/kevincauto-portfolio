const { parseShowdownLog } = require('./src/lib/parseShowdownLog.ts');

// Test log with healing and multiple switch-ins to verify HP tracking
const testLog = `|player|p1|Player1
|player|p2|Player2
|poke|p1|Suicune
|poke|p2|Opponent
|turn|1
|switch|p2a: The Swim Reaper|Suicune, M|100/100
|-damage|p2a: The Swim Reaper|88/100|[from] Stealth Rock
|move|p1a: Suicune|Razor Shell|p2a: The Swim Reaper
|-damage|p2a: The Swim Reaper|88/100 → 36/100
|turn|2
|move|p2a: The Swim Reaper|Substitute|p2a: The Swim Reaper
|-start|p2a: The Swim Reaper|Substitute
|-damage|p2a: The Swim Reaper|36/100 → 11/100
|turn|3
|move|p2a: The Swim Reaper|Substitute|p2a: The Swim Reaper
|-start|p2a: The Swim Reaper|Substitute
|-damage|p2a: The Swim Reaper|11/100 → 0 fnt
|faint|p2a: The Swim Reaper
|switch|p2a: The Swim Reaper|Suicune, M|100/100
|-damage|p2a: The Swim Reaper|88/100|[from] Stealth Rock
|move|p1a: Suicune|U-turn|p2a: The Swim Reaper
|-damage|p2a: The Swim Reaper|88/100 → 77/100
|win|Player1`;

console.log('Testing comprehensive HP tracking...\n');

const result = parseShowdownLog(testLog);

if (result && result.pokemonStats) {
  console.log('Pokémon Statistics:');
  result.pokemonStats.forEach(pokemon => {
    console.log(`${pokemon.name}:`);
    console.log(`  KOs: ${pokemon.kos}`);
    console.log(`  Fainted: ${pokemon.fainted ? 'Yes' : 'No'}`);
    console.log(`  Won: ${pokemon.won ? 'Yes' : 'No'}`);
    console.log(`  Damage Dealt: ${pokemon.damageDealt.toFixed(1)}%`);
    console.log(`  Damage Taken: ${pokemon.damageTaken.toFixed(1)}%`);
    console.log(`  HP Lost: ${pokemon.hpLost.toFixed(1)}%`);
    console.log('');
  });
} else {
  console.log('Failed to parse log');
} 