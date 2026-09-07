import { useState } from 'react';
import type { Book } from '../types';
import { addDays, today } from '../utils/dateUtils';
import { cx } from '../utils/cx';
import { BottomSheet } from './BottomSheet';
import { StarRating } from './StarRating';
import styles from './BookSheet.module.css';
import form from './sheetForm.module.css';

interface Props {
  book: Partial<Book> & { title: string; authors: string; isbn: string };
  onSave: (book: Book) => void;
  onCancel: () => void;
}

export const BookSheet = ({ book, onSave, onCancel }: Props) => {
  const [dueDate, setDueDate] = useState(book.dueDate ?? addDays(today(), 14));
  const [rating, setRating] = useState(book.rating ?? 0);
  const [memo, setMemo] = useState(book.memo ?? '');

  const handleSave = () => {
    onSave({
      id: book.id ?? Date.now().toString(),
      isbn: book.isbn,
      title: book.title,
      authors: book.authors,
      thumbnail: book.thumbnail ?? null,
      publisher: book.publisher ?? '',
      description: book.description ?? '',
      borrowedAt: book.borrowedAt ?? today(),
      returned: book.returned ?? false,
      dueDate,
      rating,
      memo,
      volume: book.volume,
    });
  };

  return (
    <BottomSheet onClose={onCancel}>
      <div className={styles.header}>
        <div className={styles.thumbnail}>
          {book.thumbnail ? <img src={book.thumbnail} alt="" /> : '📚'}
        </div>
        <div>
          <div className={styles.title}>{book.title}</div>
          <div className={styles.authors}>{book.authors}</div>
          {book.volume && <div className={styles.volume}>{book.volume}</div>}
        </div>
      </div>

      <label className={form.field}>
        <div className={form.label}>返却予定日</div>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={form.control}
        />
      </label>

      <div className={styles.rating}>
        <div className={form.label}>評価</div>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <label className={cx(form.field, styles.memoField)}>
        <div className={form.label}>感想メモ</div>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="子どもの反応や好きなシーンなど…"
          rows={3}
          className={cx(form.control, form.textarea)}
        />
      </label>

      <button onClick={handleSave} className={form.submit}>
        保存する
      </button>
    </BottomSheet>
  );
};
