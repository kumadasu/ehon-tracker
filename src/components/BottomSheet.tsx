import type { ReactNode } from 'react';
import styles from './BottomSheet.module.css';

interface Props {
  children: ReactNode;
  onClose: () => void;
}

/** Modal sheet that slides up from the bottom. Clicking the backdrop closes it. */
export const BottomSheet = ({ children, onClose }: Props) => (
  <div className={styles.backdrop} onClick={onClose}>
    <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
      <div className={styles.handle} />
      {children}
    </div>
  </div>
);
