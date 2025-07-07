'use client';

import { useState } from 'react';
import styles from './PokeParserForm.module.css';

export default function PokeParserForm() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error,  setError]  = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null); setError(null);

    const res = await fetch('/api/poke-parser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:   JSON.stringify({ url }),
    });

    if (res.ok) {
        const { parsed } = await res.json();
        setResult(JSON.stringify(parsed, null, 2));   // pretty-print
    } else {
        const { message } = await res.json();
        setError(message ?? 'Unknown error');
    }
  }

  return (
    <>
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

        {result && <pre style={{whiteSpace:'pre-wrap'}}>{result}</pre>}
        {error && <p style={{color:'red'}}>{error}</p>}
    </>
  );
}
