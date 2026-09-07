import styles from './Toast.module.css';

interface Props {
  message: string;
}

export const Toast = ({ message }: Props) => <div className={styles.toast}>{message}</div>;
