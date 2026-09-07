import { useState } from 'react';
import type { Book } from '../types';
import { addDays, formatDate } from '../utils/dateUtils';
import { cx } from '../utils/cx';
import { BottomSheet } from './BottomSheet';
import styles from './DueDateSheet.module.css';
import form from './sheetForm.module.css';

interface Props {
  books: Book[];
  onSave: (dueDate: string) => void;
  onCancel: () => void;
}

const SHIFTS = [-1, 1, 7, 14];

const shiftLabel = (n: number) => (n < 0 ? `${n}日` : `+${n}日`);

export const DueDateSheet = ({ books, onSave, onCancel }: Props) => {
  const [dueDate, setDueDate] = useState(books[0].dueDate);

  return (
    <BottomSheet onClose={onCancel}>
      <div className={styles.heading}>{books.length}冊の返却期限を変更</div>

      {/* Affected books, so it is clear what the change applies to */}
      <div className={styles.titles}>
        {books.map((b) => (
          <div key={b.id}>{b.title}</div>
        ))}
      </div>

      <label className={cx(form.field, styles.dateField)}>
        <div className={form.label}>新しい返却予定日</div>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={form.control}
        />
      </label>

      {/* Relative shortcuts, applied to the value currently in the picker */}
      <div className={styles.shifts}>
        {SHIFTS.map((n) => (
          <button
            key={n}
            onClick={() => setDueDate((d) => addDays(d, n))}
            disabled={!dueDate}
            className={styles.shift}
          >
            {shiftLabel(n)}
          </button>
        ))}
      </div>

      <button onClick={() => onSave(dueDate)} disabled={!dueDate} className={form.submit}>
        {dueDate ? `${formatDate(dueDate)}に変更する` : '日付を選んでください'}
      </button>
    </BottomSheet>
  );
};
