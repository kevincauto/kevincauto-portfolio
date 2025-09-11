import { Suspense } from 'react';
import PokeParserForm from './PokeParserForm';
import styles from './page.module.css';

export const metadata = { title: 'Poké Parser | Kevin Cauto' };

export default function PokeParserPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Pokemon Single Log Parser</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <PokeParserForm />
      </Suspense>
    </div>
  );
}