'use client';
import { useState, FormEvent } from 'react';
import styles from './ContactForm.module.css';

export default function ContactForm() {
  const [status, setStatus] = useState<'idle'|'ok'|'error'>('idle');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const payload = {
      name:   (form.elements.namedItem('name')  as HTMLInputElement).value,
      email:  (form.elements.namedItem('email') as HTMLInputElement).value,
      message:(form.elements.namedItem('message') as HTMLTextAreaElement).value,
    };

const res = await fetch('/api/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

    setStatus(res.ok ? 'ok' : 'error');
    if (res.ok) form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className={styles.contact}>
      <input  name="name"    placeholder="Name"  className={styles.contact__input} required />
      <input  name="email"   type="email" placeholder="Email" className={styles.contact__input} required />
      <textarea name="message" placeholder="Message" rows={4} className={styles.contact__input} required />
      <button className={styles.contact__button}>Send</button>

      {status === 'ok'    && <p className={styles.contact__success}>Thanks! I’ll reply soon.</p>}
      {status === 'error' && <p className={styles.contact__error}>Something went wrong. Try again.</p>}
    </form>
  );
}
