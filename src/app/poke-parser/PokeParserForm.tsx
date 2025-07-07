'use client';

import { useState, FormEvent } from 'react';
import styles from './PokeParserForm.module.css';

type Parsed = {
  p1: { name: string; team: string[] };
  p2: { name: string; team: string[] };
  kos: { attacker: string; victim: string; hazard?: string }[];
};

export default function PokeParserForm() {
  const [url, setUrl] = useState('');
  const [data, setData] = useState<Parsed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch('/api/poke-parser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const { message } = await res.json();
        throw new Error(message ?? 'Unknown server error');
      }

      const { parsed } = await res.json();
      setData(parsed);
        } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError('Unknown error'); 
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.parser}>
        <input
          type="url"
          placeholder="Paste draft replay URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className={styles.parser__input}
        />
        <button className={styles.parser__button} disabled={loading}>
          {loading ? 'Parsing…' : 'Parse'}
        </button>
      </form>

      {/* Results ----------------------------------------------------------- */}
      {error && <p className={styles.error}>{error}</p>}

      {data && (
        <div className={styles.results}>
          {/* left column – raw JSON */}
          <pre className={styles.results__json}>
            {JSON.stringify(data, null, 2)}
          </pre>

          {/* right column – KO list */}
          <div className={styles.results__kos}>
            <h3>Knock-outs</h3>
            {data.kos.length === 0 ? (
              <p>No KOs recorded.</p>
            ) : (
              <ul>
                {data.kos.map((k, i) => (
                  <li key={i}>
                    <strong>{k.attacker}</strong> KO&apos;s {k.victim}
                    {k.hazard && ` (${k.hazard})`}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
