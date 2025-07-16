import LeaseEditorForm from "@/components/LeaseEditorForm";
import styles from './page.module.css';

export default function LeaseEditorPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Lease Editor</h1>
      <LeaseEditorForm />
    </div>
  );
} 