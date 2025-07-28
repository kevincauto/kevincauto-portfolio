const { parseShowdownLog } = require('./src/lib/parseShowdownLog.ts');

// Test log with Suicune damage lines including healing
const testLog = `|player|p1|Player1|
|player|p2|Player2|
|poke|p1|Chansey|
|poke|p2|Suicune|
|switch|p2a: The Swim Reaper|Suicune|100/100
|-damage|p2a: The Swim Reaper|88/100|[from] Stealth Rock
|move|p1a: Barbaracle|Razor Shell|p2a: The Swim Reaper
|-damage|p2a: The Swim Reaper|36/100
|move|p2a: The Swim Reaper|Substitute|p2a: The Swim Reaper
|-start|p2a: The Swim Reaper|Substitute
|-damage|p2a: The Swim Reaper|17/100
|-heal|p2a: The Swim Reaper|42/100|[from] item: Leftovers
|move|p2a: The Swim Reaper|Substitute|p2a: The Swim Reaper
|-start|p2a: The Swim Reaper|Substitute
|-damage|p2a: The Swim Reaper|5/100
|-heal|p2a: The Swim Reaper|23/100|[from] item: Leftovers
|switch|p2a: The Swim Reaper|Suicune|23/100
|-damage|p2a: The Swim Reaper|11/100|[from] Stealth Rock
|move|p1a: Mienshao|U-turn|p2a: The Swim Reaper
|-damage|p2a: The Swim Reaper|0 fnt
|faint|p2a: The Swim Reaper
|win|Player1`;

const result = parseShowdownLog(testLog);
console.log('Suicune stats:', result?.pokemonStats?.find(p => p.name === 'Suicune'));
console.log('Expected damage taken: ~143% (accounting for healing)');
console.log('Expected HP lost: 137% (sum of all damage lines)'); 