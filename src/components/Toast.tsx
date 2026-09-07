import styles from './Toast.module.css';

interface Props {
  message: string;
}

/**
 * Confirmation notice. `role="status"` (with its implicit polite live region made
 * explicit) lets a screen reader announce the message without stealing focus.
 */
export const Toast = ({ message }: Props) => (
  <div role="status" aria-live="polite" className={styles.toast}>
    {message}
  </div>
);
