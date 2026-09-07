import type { Book } from '../types';
import { daysLeft } from '../utils/dateUtils';
import { StarRating } from './StarRating';
import styles from './BookCard.module.css';

interface Props {
  book: Book;
  onReturn: (id: string) => void;
  onEdit: (book: Book) => void;
}

const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ');

export const BookCard = ({ book, onReturn, onEdit }: Props) => {
  const left = daysLeft(book.dueDate);
  const urgent = !book.returned && left <= 3;

  return (
    <div className={cx(styles.card, urgent && styles.urgent)}>
      <div className={styles.thumbnail}>
        {book.thumbnail ? <img src={book.thumbnail} alt="" /> : '📚'}
      </div>

      <div className={styles.info}>
        <div className={cx(styles.title, styles.truncate)}>{book.title}</div>
        <div className={cx(styles.authors, book.volume && styles.withVolume)}>{book.authors}</div>
        {book.volume && <div className={styles.volume}>{book.volume}</div>}
        <StarRating value={book.rating} />
        {book.memo ? <div className={cx(styles.memo, styles.truncate)}>"{book.memo}"</div> : null}
        {book.returned && <div className={styles.returnedBadge}>✓ 返却済</div>}
      </div>

      <div className={styles.actions}>
        <button onClick={() => onEdit(book)} className={cx(styles.action, styles.edit)}>
          編集
        </button>
        {!book.returned && (
          <button onClick={() => onReturn(book.id)} className={cx(styles.action, styles.return)}>
            返却
          </button>
        )}
      </div>
    </div>
  );
};
