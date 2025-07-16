'use client';

import styles from './FormInput.module.css';

interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

export default function FormInput({
  label,
  name,
  type = 'text',
  placeholder,
  required = false,
}: FormInputProps) {
  return (
    <div className={styles.inputGroup}>
      <label htmlFor={name} className={styles.label}>
        {label}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        placeholder={placeholder}
        required={required}
        className={styles.input}
      />
    </div>
  );
} 