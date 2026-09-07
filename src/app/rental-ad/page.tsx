import RentalAdForm from "@/components/RentalAdForm";
import styles from './page.module.css';

export default function RentalAdPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Rental Ad Generator</h1>
      <RentalAdForm />
    </div>
  );
}
