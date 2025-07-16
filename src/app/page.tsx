import styles from "./page.module.css";
import Hero from "../components/Hero";
import GitHubContributions from "@/components/GitHubContributions";

export default function Home() {
  return (
    <>
      <main className={styles.main}>
        <Hero />
        <a href="https://github.com/kevincauto" target="_blank" rel="noopener noreferrer" className={styles.contributionLink}>
          <GitHubContributions />
        </a>
      </main>
    </>
  );
}
