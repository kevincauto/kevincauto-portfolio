const { parseShowdownLog } = require('./src/lib/parseShowdownLog.ts');

const sampleLog = `|player|p1|Player1
|player|p2|Player2
|poke|p1|Tyranitar, M
|poke|p1|Ferrothorn, F
|poke|p1|Charizard, M
|poke|p2|Garchomp, M
|poke|p2|Talonflame, F
|poke|p2|Blastoise, M
|start
|turn|1
|move|p1a: Tyranitar|Sandstorm|p2a: Garchomp
|-weather|Sandstorm|[upkeep]
|move|p2a: Garchomp|Earthquake|p1a: Tyranitar
|-damage|p1a: Tyranitar|75/100
|-damage|p2a: Garchomp|90/100|[from] Sandstorm
|turn|2
|move|p1a: Ferrothorn|Spikes|p2a: Garchomp
|-sidestart|p2: Garchomp|Spikes
|move|p2a: Garchomp|Dragon Claw|p1a: Ferrothorn
|-damage|p1a: Ferrothorn|85/100
|-damage|p2a: Garchomp|70/100|[from] Iron Barbs
|turn|3
|move|p1a: Charizard|Flamethrower|p2a: Garchomp
|-damage|p2a: Garchomp|0 fnt
|faint|p2a: Garchomp
|win|Player1`;

console.log('🧪 Testing granular indirect damage categories...\n');

try {
  const result = parseShowdownLog(sampleLog);
  
  if (!result) {
    console.error('❌ Parser returned null');
    process.exit(1);
  }
  
  console.log('✅ Parser completed successfully');
  
  if (result.pokemonStats) {
    console.log('\n📊 Pokémon Statistics with Granular Damage:');
    result.pokemonStats.forEach(pokemon => {
      console.log(`${pokemon.name}:`);
      console.log(`  Total Damage Dealt: ${pokemon.totalDamageDealt.toFixed(1)}%`);
      console.log(`  Direct Damage: ${pokemon.directDamageDealt.toFixed(1)}%`);
      console.log(`  Indirect Damage: ${pokemon.indirectDamageDealt.toFixed(1)}%`);
      console.log(`  Granular Breakdown:`);
      console.log(`    Spikes: ${pokemon.damageDealtBySpikes.toFixed(1)}%`);
      console.log(`    Stealth Rock: ${pokemon.damageDealtByStealthRock.toFixed(1)}%`);
      console.log(`    Poison: ${pokemon.damageDealtByPoison.toFixed(1)}%`);
      console.log(`    Burn: ${pokemon.damageDealtByBurn.toFixed(1)}%`);
      console.log(`    Sandstorm: ${pokemon.damageDealtBySandstorm.toFixed(1)}%`);
      console.log(`    Hail: ${pokemon.damageDealtByHail.toFixed(1)}%`);
      console.log(`    Rocky Helmet: ${pokemon.damageDealtByRockyHelmet.toFixed(1)}%`);
      console.log(`    Contact Ability: ${pokemon.damageDealtByContactAbility.toFixed(1)}%`);
      console.log('');
    });
    
    // Verify expected results
    const tyranitar = result.pokemonStats.find(p => p.name === 'Tyranitar');
    const ferrothorn = result.pokemonStats.find(p => p.name === 'Ferrothorn');
    const charizard = result.pokemonStats.find(p => p.name === 'Charizard');
    
    // Tyranitar: 10% Sandstorm damage
    if (tyranitar && Math.abs(tyranitar.damageDealtBySandstorm - 10) < 1) {
      console.log('✅ Tyranitar Sandstorm damage correct:', tyranitar.damageDealtBySandstorm.toFixed(1) + '%');
    } else {
      console.log('❌ Tyranitar Sandstorm damage incorrect:', tyranitar?.damageDealtBySandstorm);
    }
    
    // Ferrothorn: 20% Contact Ability damage (Iron Barbs)
    if (ferrothorn && Math.abs(ferrothorn.damageDealtByContactAbility - 20) < 1) {
      console.log('✅ Ferrothorn Contact Ability damage correct:', ferrothorn.damageDealtByContactAbility.toFixed(1) + '%');
    } else {
      console.log('❌ Ferrothorn Contact Ability damage incorrect:', ferrothorn?.damageDealtByContactAbility);
    }
    
    // Charizard: 70% direct damage, 0% indirect
    if (charizard && Math.abs(charizard.directDamageDealt - 70) < 1 && charizard.indirectDamageDealt === 0) {
      console.log('✅ Charizard damage breakdown correct: Direct:', charizard.directDamageDealt.toFixed(1) + '%, Indirect:', charizard.indirectDamageDealt.toFixed(1) + '%');
    } else {
      console.log('❌ Charizard damage breakdown incorrect');
    }
  }
  
  console.log('\n🎉 Test completed!');
} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
} 