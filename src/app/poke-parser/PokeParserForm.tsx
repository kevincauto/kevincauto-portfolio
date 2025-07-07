'use client';

import { useState } from 'react';
import styles from './PokeParserForm.module.css';

export default function PokeParserForm() {
  const [url, setUrl] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // parsing logic will go here later
    alert(`You entered: ${url}`);
  }

  return (
    <form onSubmit={handleSubmit} className={styles.parser}>
      <input
        name="logUrl"
        type="url"
        placeholder="Paste draft log URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
        className={styles.parser__input}
      />
      <button className={styles.parser__button}>Parse</button>
    </form>
  );
}