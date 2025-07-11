'use client';

import { useState } from 'react';
import styles from './MultiLogParserForm.module.css';
import { FaPlus, FaTrash } from 'react-icons/fa';

export default function MultiLogParserForm() {
  const [urls, setUrls] = useState<string[]>(['']);

  const handleAddInput = () => {
    setUrls([...urls, '']);
  };

  const handleRemoveInput = (index: number) => {
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls);
  };

  const handleInputChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for future functionality
    console.log('Parsing URLs:', urls);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.inputList}>
        {urls.map((url, index) => (
          <div key={index} className={styles.inputRow}>
            <input
              type="url"
              placeholder="Paste draft replay URL"
              value={url}
              onChange={(e) => handleInputChange(index, e.target.value)}
              className={styles.input}
            />
            <button
              type="button"
              onClick={() => handleRemoveInput(index)}
              className={`${styles.iconButton} ${styles.deleteButton}`}
              disabled={urls.length === 1}
              aria-label="Remove URL"
            >
              <FaTrash />
            </button>
          </div>
        ))}
      </div>
      <div className={styles.buttonGroup}>
        <button
          type="button"
          onClick={handleAddInput}
          className={styles.addButton}
          aria-label="Add URL"
        >
          <FaPlus />
          <span>Add Another URL</span>
        </button>
        <button type="submit" className={styles.parseButton}>
          Parse All
        </button>
      </div>
    </form>
  );
} 