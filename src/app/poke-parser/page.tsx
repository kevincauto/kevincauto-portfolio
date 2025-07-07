import PokeParserForm from './PokeParserForm';

export const metadata = { title: 'Poké Parser | Kevin Cauto' };

export default function PokeParserPage() {
  return (
    <main>
      <h1>Pokémon Draft Log Parser</h1>
      <PokeParserForm />
    </main>
  );
}