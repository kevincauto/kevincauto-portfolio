import styles from './Hero.module.css';
export default function Hero() {
  return (
    <section className={styles.hero}>
      <h1 className={styles.hero__title}>Kevin Cauto</h1>
      <p className={styles.hero__subtitle}>
        Software Engineer • Real-estate Investor
      </p>
    </section>
  );
}