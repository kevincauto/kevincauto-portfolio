import Link from 'next/link';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.link}>
          Home
        </Link>
        <Link href="/poke-parser" className={styles.link}>
          Single Parser
        </Link>
        <Link href="/multi-log-parser" className={styles.link}>
          Multi Parser
        </Link>
        <Link href="/lease-editor" className={styles.link}>
          Lease Editor
        </Link>
      </nav>
    </header>
  );
} 