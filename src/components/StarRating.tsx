import { cx } from '../utils/cx';
import styles from './StarRating.module.css';

interface Props {
  value: number;
  onChange?: (rating: number) => void;
}

export const StarRating = ({ value, onChange }: Props) => (
  <div className={styles.rating}>
    {[1, 2, 3, 4, 5].map((s) => (
      <span
        key={s}
        onClick={() => onChange?.(s)}
        className={cx(styles.star, s <= value && styles.filled, onChange && styles.interactive)}
      >
        ★
      </span>
    ))}
  </div>
);
