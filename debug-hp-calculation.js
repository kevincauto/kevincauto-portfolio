const { parseShowdownLog } = require('./src/lib/parseShowdownLog.ts');

// Test with detailed logging of HP calculations
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

console.log('Debugging HP calculation step by step...\n');

// Let's manually trace what should happen:
console.log('Expected HP Lost calculation:');
console.log('1. Switch: 100/100');
console.log('2. Stealth Rock: 100 → 88 (12 lost)');
console.log('3. Razor Shell: 88 → 36 (52 lost)');
console.log('4. Substitute: 36 → 11 (25 lost)');
console.log('5. Substitute: 11 → 0 (11 lost)');
console.log('6. Switch: 100/100 (fresh)');
console.log('7. Stealth Rock: 100 → 88 (12 lost)');
console.log('8. U-turn: 88 → 77 (11 lost)');
console.log('Total HP Lost: 12 + 52 + 25 + 11 + 12 + 11 = 123%\n');

const result = parseShowdownLog(testLog);

if (result && result.pokemonStats) {
  console.log('Parser Results:');
  result.pokemonStats.forEach(pokemon => {
    console.log(`${pokemon.name}:`);
    console.log(`  HP Lost: ${pokemon.hpLost.toFixed(1)}%`);
    console.log(`  Damage Taken: ${pokemon.damageTaken.toFixed(1)}%`);
    console.log(`  Damage Dealt: ${pokemon.damageDealt.toFixed(1)}%`);
    console.log('');
  });
} else {
  console.log('Failed to parse log');
} 