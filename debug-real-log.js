// Debug script for real battle logs
const { parseShowdownLog } = require('./src/lib/parseShowdownLog.ts');

// Replace this with your actual log content
const realLog = `|j|☆Kaiser Cauto
|j|☆Mattchumaniac44
|t:|1744766612
|gametype|singles
|player|p1|Kaiser Cauto|koga-gen3|
|player|p2|Mattchumaniac44|veteran|
|teamsize|p1|6
|teamsize|p2|6
|gen|6
|tier|[Gen 6] Draft
|rule|Sleep Clause Mod: Limit one foe put to sleep
|rule|OHKO Clause: OHKO moves are banned
|rule|Evasion Clause: Evasion abilities, items, and moves are banned
|rule|Evasion Abilities Clause: Evasion abilities are banned
|rule|Evasion Items Clause: Evasion items are banned
|rule|Evasion Moves Clause: Evasion moves are banned
|rule|Endless Battle Clause: Forcing endless battles is banned
|rule|HP Percentage Mod: HP is shown in percentages
|rule|Moody Clause: Moody is banned
|rule|Swagger Clause: Swagger is banned
|clearpoke
|poke|p1|Klefki, M|item
|poke|p1|Latios, M|item
|poke|p1|Blissey, F|item
|poke|p1|Talonflame, M|
|poke|p1|Muk, F|item
|poke|p1|Staraptor, M|item
|poke|p2|Meloetta|item
|poke|p2|Scizor, F|item
|poke|p2|Rotom-Heat|item
|poke|p2|Garchomp, F|item
|poke|p2|Jolteon, F|item
|poke|p2|Aromatisse, F|item
|teampreview
|j| TheWillager
|j| seto slima
|j| Notabot1234
|j| crystopper_pkmn
|j| jtouey
|j| 6utter
|l| jtouey
|j| son_of_ringo
|c|☆Kaiser Cauto|glhf brother
|c| crystopper_pkmn|gl
|j| OnlyOffensive
|j| jtouey
|c|☆Mattchumaniac44|gl hf
|
|t:|1744766810
|start
|switch|p1a: Blissey|Blissey, F|100/100
|switch|p2a: Jolteon|Jolteon, F|100/100
|turn|1
|l| jtouey
|j| jtouey
|
|t:|1744766840
|move|p2a: Jolteon|Volt Switch|p1a: Blissey
|-damage|p1a: Blissey|87/100
|j| bman5422
|
|t:|1744766872
|switch|p2a: Meloetta|Meloetta|100/100|[from] Volt Switch
|move|p1a: Blissey|Wish|p1a: Blissey
|
|-heal|p1a: Blissey|93/100|[from] item: Leftovers
|upkeep
|turn|2
|
|t:|1744766882
|move|p1a: Blissey|Protect|p1a: Blissey
|-singleturn|p1a: Blissey|Protect
|move|p2a: Meloetta|Substitute|p2a: Meloetta
|-start|p2a: Meloetta|Substitute
|-damage|p2a: Meloetta|75/100
|
|-heal|p1a: Blissey|100/100|[from] move: Wish|[wisher] Blissey
|-heal|p2a: Meloetta|82/100|[from] item: Leftovers
|upkeep
|turn|3
|
|t:|1744766886
|switch|p1a: Klefki|Klefki, M|100/100
|move|p2a: Meloetta|Calm Mind|p2a: Meloetta
|-boost|p2a: Meloetta|spa|1
|-boost|p2a: Meloetta|spd|1
|
|-heal|p2a: Meloetta|88/100|[from] item: Leftovers
|upkeep
|turn|4
|
|t:|1744766940
|move|p1a: Klefki|Confide|p2a: Meloetta
|-unboost|p2a: Meloetta|spa|1
|move|p2a: Meloetta|Shadow Ball|p1a: Klefki
|-damage|p1a: Klefki|78/100
|-unboost|p1a: Klefki|spd|1
|
|-heal|p2a: Meloetta|94/100|[from] item: Leftovers
|-heal|p1a: Klefki|84/100|[from] item: Leftovers
|upkeep
|turn|5
|j| Jmils9
|
|t:|1744767092
|move|p1a: Klefki|Spikes|p2a: Meloetta
|-sidestart|p2: Mattchumaniac44|Spikes
|move|p2a: Meloetta|Shadow Ball|p1a: Klefki
|-damage|p1a: Klefki|50/100
|
|-heal|p2a: Meloetta|99/100|[from] item: Leftovers
|-heal|p1a: Klefki|56/100|[from] item: Leftovers
|upkeep
|turn|6
|
|t:|1744767104
|switch|p1a: Blissey|Blissey, F|100/100
|move|p2a: Meloetta|Calm Mind|p2a: Meloetta
|-boost|p2a: Meloetta|spa|1
|-boost|p2a: Meloetta|spd|1
|
|-heal|p2a: Meloetta|100/100|[from] item: Leftovers
|upkeep
|turn|7
|
|t:|1744767114
|move|p2a: Meloetta|Calm Mind|p2a: Meloetta
|-boost|p2a: Meloetta|spa|1
|-boost|p2a: Meloetta|spd|1
|move|p1a: Blissey|Wish|p1a: Blissey
|
|upkeep
|turn|8
|
|t:|1744767124
|switch|p1a: Klefki|Klefki, M|56/100
|move|p2a: Meloetta|Calm Mind|p2a: Meloetta
|-boost|p2a: Meloetta|spa|1
|-boost|p2a: Meloetta|spd|1
|
|-heal|p1a: Klefki|100/100|[from] move: Wish|[wisher] Blissey
|upkeep
|turn|9
|l| jtouey
|
|t:|1744767167
|move|p1a: Klefki|Confide|p2a: Meloetta
|-unboost|p2a: Meloetta|spa|1
|move|p2a: Meloetta|Shadow Ball|p1a: Klefki
|-damage|p1a: Klefki|57/100
|
|-heal|p1a: Klefki|63/100|[from] item: Leftovers
|upkeep
|turn|10
|j| jtouey
|
|t:|1744767183
|move|p1a: Klefki|Confide|p2a: Meloetta
|-unboost|p2a: Meloetta|spa|1
|move|p2a: Meloetta|Shadow Ball|p1a: Klefki
|-damage|p1a: Klefki|32/100
|-unboost|p1a: Klefki|spd|1
|
|-heal|p1a: Klefki|38/100|[from] item: Leftovers
|upkeep
|turn|11
|
|t:|1744767259
|move|p2a: Meloetta|Calm Mind|p2a: Meloetta
|-boost|p2a: Meloetta|spa|1
|-boost|p2a: Meloetta|spd|1
|move|p1a: Klefki|Foul Play|p2a: Meloetta
|-supereffective|p2a: Meloetta
|-end|p2a: Meloetta|Substitute
|
|-heal|p1a: Klefki|44/100|[from] item: Leftovers
|upkeep
|turn|12
|
|t:|1744767399
|move|p1a: Klefki|Toxic|p2a: Meloetta
|-status|p2a: Meloetta|tox
|move|p2a: Meloetta|Shadow Ball|p1a: Klefki
|-damage|p1a: Klefki|0 fnt
|faint|p1a: Klefki
|
|-damage|p2a: Meloetta|94/100 tox|[from] psn
|upkeep
|l|☆Mattchumaniac44
|player|p2|
|
|t:|1744767441
|switch|p1a: Latios|Latios, M|100/100
|turn|13
|j|☆Mattchumaniac44
|player|p2|Mattchumaniac44|veteran|
|c| bman5422|congrats kev
|
|t:|1744767503
|switch|p1a: Blissey|Blissey, F|100/100
|move|p2a: Meloetta|Shadow Ball|p1a: Blissey
|-immune|p1a: Blissey
|
|-heal|p2a: Meloetta|100/100 tox|[from] item: Leftovers
|-damage|p2a: Meloetta|88/100 tox|[from] psn
|upkeep
|turn|14
|l| jtouey
|j| jtouey
|
|t:|1744767558
|switch|p2a: Doc|Aromatisse, F|100/100
|-damage|p2a: Doc|88/100|[from] Spikes
|move|p1a: Blissey|Wish|p1a: Blissey
|
|upkeep
|turn|15
|
|t:|1744767567
|switch|p1a: Muk|Muk, F|100/100
|move|p2a: Doc|Heal Bell|p2a: Doc
|-activate|p2a: Doc|move: Heal Bell
|-curestatus|p2: Meloetta|tox|[msg]
|
|upkeep
|turn|16
|l| jtouey
|j| jtouey
|
|t:|1744767618
|switch|p2a: Rotom|Rotom-Heat|100/100
|move|p1a: Muk|Substitute|p1a: Muk
|-start|p1a: Muk|Substitute
|-damage|p1a: Muk|76/100
|
|-heal|p1a: Muk|82/100|[from] item: Black Sludge
|upkeep
|turn|17
|l| jtouey
|
|t:|1744767671
|move|p2a: Rotom|Volt Switch|p1a: Muk
|-activate|p1a: Muk|move: Substitute|[damage]
|j| jtouey
|l| jtouey
|
|t:|1744767679
|switch|p2a: Scizor|Scizor, F|100/100|[from] Volt Switch
|-damage|p2a: Scizor|88/100|[from] Spikes
|move|p1a: Muk|Fire Punch|p2a: Scizor
|-supereffective|p2a: Scizor
|-damage|p2a: Scizor|0 fnt
|faint|p2a: Scizor
|
|-heal|p1a: Muk|88/100|[from] item: Black Sludge
|upkeep
|j| jtouey
|
|t:|1744767729
|switch|p2a: Rotom|Rotom-Heat|100/100
|turn|18
|
|t:|1744767733
|move|p2a: Rotom|Volt Switch|p1a: Muk
|-end|p1a: Muk|Substitute
|
|t:|1744767739
|switch|p2a: Meloetta|Meloetta|88/100|[from] Volt Switch
|-damage|p2a: Meloetta|76/100|[from] Spikes
|move|p1a: Muk|Substitute|p1a: Muk
|-start|p1a: Muk|Substitute
|-damage|p1a: Muk|63/100
|
|-heal|p2a: Meloetta|82/100|[from] item: Leftovers
|-heal|p1a: Muk|69/100|[from] item: Black Sludge
|upkeep
|turn|19
|
|t:|1744767749
|move|p2a: Meloetta|Psyshock|p1a: Muk
|-supereffective|p1a: Muk
|-end|p1a: Muk|Substitute
|move|p1a: Muk|Gunk Shot|p2a: Meloetta
|-damage|p2a: Meloetta|16/100
|
|-heal|p2a: Meloetta|22/100|[from] item: Leftovers
|-heal|p1a: Muk|75/100|[from] item: Black Sludge
|upkeep
|turn|20
|
|t:|1744767783
|switch|p1a: Latios|Latios, M|100/100
|move|p2a: Meloetta|Psyshock|p1a: Latios
|-resisted|p1a: Latios
|-damage|p1a: Latios|79/100
|
|-heal|p2a: Meloetta|28/100|[from] item: Leftovers
|upkeep
|turn|21
|
|t:|1744767887
|switch|p1a: Muk|Muk, F|75/100
|switch|p2a: Doc|Aromatisse, F|88/100
|-damage|p2a: Doc|76/100|[from] Spikes
|
|-heal|p1a: Muk|81/100|[from] item: Black Sludge
|upkeep
|turn|22
|l| jtouey
|j| jtouey
|
|t:|1744767965
|switch|p2a: Rotom|Rotom-Heat|100/100
|move|p1a: Muk|Substitute|p1a: Muk
|-start|p1a: Muk|Substitute
|-damage|p1a: Muk|56/100
|
|-heal|p1a: Muk|62/100|[from] item: Black Sludge
|upkeep
|turn|23
|
|t:|1744767990
|move|p2a: Rotom|Foul Play|p1a: Muk
|-end|p1a: Muk|Substitute
|move|p1a: Muk|Gunk Shot|p2a: Rotom
|-damage|p2a: Rotom|33/100
|
|-heal|p1a: Muk|68/100|[from] item: Black Sludge
|upkeep
|turn|24
|l| jtouey
|j| jtouey
|l| jtouey
|j| jtouey
|l| jtouey
|j| jtouey
|l| jtouey
|
|t:|1744768226
|move|p2a: Rotom|Pain Split|p1a: Muk
|-sethp|p1a: Muk|48/100|[from] move: Pain Split|[silent]
|-sethp|p2a: Rotom|56/100|[from] move: Pain Split
|move|p1a: Muk|Gunk Shot|p2a: Rotom
|-damage|p2a: Rotom|0 fnt
|faint|p2a: Rotom
|
|-heal|p1a: Muk|54/100|[from] item: Black Sludge
|upkeep
|j| jtouey
|
|t:|1744768250
|switch|p2a: Garchomp|Garchomp, F|100/100
|-damage|p2a: Garchomp|88/100|[from] Spikes
|turn|25
|
|t:|1744768277
|switch|p1a: Staraptor|Staraptor, M|100/100
|-ability|p1a: Staraptor|Intimidate|boost
|-unboost|p2a: Garchomp|atk|1
|move|p2a: Garchomp|Substitute|p2a: Garchomp
|-start|p2a: Garchomp|Substitute
|-damage|p2a: Garchomp|63/100
|
|upkeep
|turn|26
|l| jtouey
|
|t:|1744768291
|move|p2a: Garchomp|Stealth Rock|p1a: Staraptor
|-sidestart|p1: Kaiser Cauto|move: Stealth Rock
|move|p1a: Staraptor|Brave Bird|p2a: Garchomp
|-end|p2a: Garchomp|Substitute
|-damage|p1a: Staraptor|92/100|[from] Recoil|[of] p2a: Garchomp
|
|upkeep
|turn|27
|j| Diploboiii69
|j| jtouey
|l| jtouey
|
|t:|1744768452
|switch|p2a: Jolteon|Jolteon, F|100/100
|-damage|p2a: Jolteon|88/100|[from] Spikes
|move|p1a: Staraptor|Defog|p2a: Jolteon
|-unboost|p2a: Jolteon|evasion|1
|-sideend|p2: Mattchumaniac44|Spikes|[from] move: Defog|[of] p1a: Staraptor
|-sideend|p1: Kaiser Cauto|Stealth Rock|[from] move: Defog|[of] p1a: Staraptor
|
|upkeep
|turn|28
|j| jtouey
|
|t:|1744768474
|switch|p1a: Blissey|Blissey, F|100/100
|move|p2a: Jolteon|Volt Switch|p1a: Blissey
|-damage|p1a: Blissey|86/100
|l| jtouey
|
|t:|1744768626
|switch|p2a: Garchomp|Garchomp, F|63/100|[from] Volt Switch
|
|-heal|p1a: Blissey|92/100|[from] item: Leftovers
|upkeep
|turn|29
|j| jtouey
|
|t:|1744768643
|switch|p1a: Staraptor|Staraptor, M|92/100
|-ability|p1a: Staraptor|Intimidate|boost
|-unboost|p2a: Garchomp|atk|1
|move|p2a: Garchomp|Outrage|p1a: Staraptor
|-crit|p1a: Staraptor
|-damage|p1a: Staraptor|0 fnt
|-damage|p2a: Garchomp|46/100|[from] item: Rocky Helmet|[of] p1a: Staraptor
|faint|p1a: Staraptor
|-damage|p2a: Garchomp|37/100|[from] item: Life Orb
|
|upkeep
|l| jtouey
|j| jtouey
|l| jtouey
|
|t:|1744768819
|switch|p1a: Latios|Latios, M|79/100
|turn|30
|j| jtouey
|
|t:|1744768836
|move|p1a: Latios|Draco Meteor|p2a: Garchomp|[miss]
|-miss|p1a: Latios|p2a: Garchomp
|move|p2a: Garchomp|Outrage|p1a: Latios|[from] lockedmove
|-supereffective|p1a: Latios
|-damage|p1a: Latios|0 fnt
|faint|p1a: Latios
|-damage|p2a: Garchomp|27/100|[from] item: Life Orb
|-start|p2a: Garchomp|confusion|[fatigue]
|
|upkeep
|l|☆Mattchumaniac44
|player|p2|
|l| jtouey
|j| jtouey
|l| jtouey
|
|t:|1744768997
|switch|p1a: Talonflame|Talonflame, M|100/100
|turn|31
|j| jtouey
|l| jtouey
|j| jtouey
|l| jtouey
|c| son_of_ringo|uhhhhh
|c| seto slima|matt...
|j| jtouey
|l| jtouey
|j|☆Mattchumaniac44
|player|p2|Mattchumaniac44|veteran|
|c|☆Mattchumaniac44|oh my b thought i was in
|l| bman5422
|j| jtouey
|c| seto slima|haha
|j| bman5422
|
|t:|1744769505
|switch|p2a: Jolteon|Jolteon, F|88/100
|switch|p1a: Muk|Muk, F|54/100
|
|-heal|p1a: Muk|60/100|[from] item: Black Sludge
|upkeep
|turn|32
|l| jtouey
|
|t:|1744769773
|move|p2a: Jolteon|Volt Switch|p1a: Muk
|-damage|p1a: Muk|33/100
|
|t:|1744769777
|switch|p2a: Doc|Aromatisse, F|76/100|[from] Volt Switch
|move|p1a: Muk|Substitute|p1a: Muk
|-start|p1a: Muk|Substitute
|-damage|p1a: Muk|8/100
|
|-heal|p1a: Muk|14/100|[from] item: Black Sludge
|upkeep
|turn|33
|l| Diploboiii69
|j| jtouey
|
|t:|1744769837
|move|p1a: Muk|Gunk Shot|p2a: Doc
|-supereffective|p2a: Doc
|-damage|p2a: Doc|0 fnt
|faint|p2a: Doc
|
|-heal|p1a: Muk|20/100|[from] item: Black Sludge
|upkeep
|
|t:|1744769879
|switch|p2a: Meloetta|Meloetta|28/100
|turn|34
|l| jtouey
|
|t:|1744770070
|move|p2a: Meloetta|Psyshock|p1a: Muk
|-supereffective|p1a: Muk
|-end|p1a: Muk|Substitute
|move|p1a: Muk|Gunk Shot|p2a: Meloetta
|-damage|p2a: Meloetta|0 fnt
|faint|p2a: Meloetta
|
|-heal|p1a: Muk|26/100|[from] item: Black Sludge
|upkeep
|
|t:|1744770086
|switch|p2a: Jolteon|Jolteon, F|88/100
|turn|35
|j| jtouey
|l| jtouey
|
|t:|1744770165
|switch|p1a: Blissey|Blissey, F|92/100
|move|p2a: Jolteon|Volt Switch|p1a: Blissey
|-damage|p1a: Blissey|77/100
|
|t:|1744770171
|switch|p2a: Garchomp|Garchomp, F|27/100|[from] Volt Switch
|
|-heal|p1a: Blissey|83/100|[from] item: Leftovers
|upkeep
|turn|36
|l|☆Mattchumaniac44
|player|p2|
|j| jtouey
|j|☆Mattchumaniac44
|player|p2|Mattchumaniac44|veteran|
|l| jtouey
|j| jtouey
|
|t:|1744770271
|move|p2a: Garchomp|Outrage|p1a: Blissey
|-damage|p1a: Blissey|0 fnt
|faint|p1a: Blissey
|-damage|p2a: Garchomp|17/100|[from] item: Life Orb
|
|upkeep
|l| jtouey
|j| jtouey
|
|t:|1744770330
|switch|p1a: Talonflame|Talonflame, M|100/100
|turn|37
|
|t:|1744770340
|move|p1a: Talonflame|Acrobatics|p2a: Garchomp
|-damage|p2a: Garchomp|0 fnt
|-damage|p1a: Talonflame|88/100|[from] ability: Rough Skin|[of] p2a: Garchomp
|faint|p2a: Garchomp
|
|upkeep
|
|t:|1744770345
|switch|p2a: Jolteon|Jolteon, F|88/100
|turn|38
|l| jtouey
|j| jtouey
|l| jtouey
|j| jtouey
|c|☆Mattchumaniac44|text me if im disconeccted
|
|t:|1744770502
|move|p1a: Talonflame|Acrobatics|p2a: Jolteon
|-resisted|p2a: Jolteon
|-damage|p2a: Jolteon|44/100
|move|p2a: Jolteon|Thunderbolt|p1a: Talonflame
|-supereffective|p1a: Talonflame
|-damage|p1a: Talonflame|0 fnt
|faint|p1a: Talonflame
|
|upkeep
|
|t:|1744770511
|switch|p1a: Muk|Muk, F|26/100
|turn|39
|c|☆Kaiser Cauto|you're good
|
|t:|1744770657
|move|p2a: Jolteon|Thunderbolt|p1a: Muk
|-damage|p1a: Muk|0 fnt
|faint|p1a: Muk
|
|win|Mattchumaniac44
|c|☆Kaiser Cauto|gg
|c| crystopper_pkmn|gg
|c|☆Mattchumaniac44|gg
|c| Jmils9|gg
|c| TheWillager|gg
|c| Notabot1234|Gg wp
|c| son_of_ringo|ggsg
|c| seto slima|gg
|c| TheWillager|great season finale
|l| Jmils9`;

console.log('=== REAL LOG DEBUG ===\n');

const lines = realLog.split('\n');
let moveIndex = -1;
let damageCount = 0;
let moveCount = 0;

console.log('Searching for move and damage patterns...\n');

lines.forEach((line, idx) => {
  // Look for move lines
  if (line.startsWith('|move|')) {
    moveCount++;
    console.log(`Move #${moveCount} at line ${idx}: ${line}`);
    moveIndex = idx;
  }
  
  // Look for damage lines (any line containing "damage")
  if (line.includes('damage') || line.includes('Damage')) {
    damageCount++;
    console.log(`Damage #${damageCount} at line ${idx}: ${line}`);
    
    if (moveIndex !== -1) {
      console.log(`  Previous move was at line ${moveIndex}: ${lines[moveIndex]}`);
      
      // Parse the move line
      const moveParts = lines[moveIndex].split('|');
      const atkNick = moveParts[2]?.split(':')[1]?.trim();
      const defNick = moveParts[4]?.split(':')[1]?.trim();
      
      // Parse the damage line
      const damageParts = line.split('|');
      const victimField = damageParts[2];
      const victimNick = victimField?.split(':')[1]?.trim();
      
      console.log(`  Attacker: ${atkNick}, Defender: ${defNick}, Damage victim: ${victimNick}`);
      console.log(`  Match: ${defNick === victimNick ? 'YES' : 'NO'}\n`);
    } else {
      console.log(`  No previous move found\n`);
    }
  }
});

console.log(`\nSummary:`);
console.log(`- Total move lines: ${moveCount}`);
console.log(`- Total damage lines: ${damageCount}`);

console.log('\n=== PARSER TEST ===');
const result = parseShowdownLog(realLog);
if (result && result.pokemonStats) {
  console.log('\nPokémon Stats:');
  result.pokemonStats.forEach(pokemon => {
    console.log(`${pokemon.name}: ${pokemon.damageDealt.toFixed(1)}% damage`);
  });
} else {
  console.log('Parser returned null or no pokemonStats');
}

// Also show all lines that might be damage-related
console.log('\n=== ALL DAMAGE-RELATED LINES ===');
lines.forEach((line, idx) => {
  if (line.includes('damage') || line.includes('Damage') || line.includes('→') || line.includes('fnt')) {
    console.log(`Line ${idx}: ${line}`);
  }
}); 