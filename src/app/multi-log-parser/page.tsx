import MultiLogParserForm from './MultiLogParserForm';
import styles from './page.module.css';

export default function MultiLogParserPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Pokemon Multiple Log Parser</h1>
      <MultiLogParserForm />
    </div>
  );
} 