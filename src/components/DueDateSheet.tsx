import { useState } from 'react';
import type { Book } from '../types';
import { COLORS, FONTS } from '../constants/theme';
import { addDays, formatDate } from '../utils/dateUtils';
import { BottomSheet } from './BottomSheet';

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
      <div
        style={{
          fontFamily: FONTS.body,
          fontSize: 16,
          fontWeight: 700,
          color: COLORS.ink,
          marginBottom: 8,
        }}
      >
        {books.length}冊の返却期限を変更
      </div>

      {/* Affected books, so it is clear what the change applies to */}
      <div
        style={{
          fontSize: 12,
          color: COLORS.inkLight,
          lineHeight: 1.7,
          marginBottom: 18,
          maxHeight: 96,
          overflowY: 'auto',
        }}
      >
        {books.map((b) => (
          <div key={b.id}>{b.title}</div>
        ))}
      </div>

      {/* Due date */}
      <label style={{ display: 'block', marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.inkLight, marginBottom: 6 }}>
          新しい返却予定日
        </div>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: `1.5px solid ${COLORS.border}`,
            borderRadius: 8,
            background: COLORS.bg,
            fontSize: 15,
            color: COLORS.ink,
            boxSizing: 'border-box',
          }}
        />
      </label>

      {/* Relative shortcuts, applied to the value currently in the picker */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {SHIFTS.map((n) => (
          <button
            key={n}
            onClick={() => setDueDate((d) => addDays(d, n))}
            disabled={!dueDate}
            style={{
              flex: 1,
              padding: '8px 0',
              background: 'none',
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: COLORS.inkLight,
              cursor: dueDate ? 'pointer' : 'not-allowed',
              opacity: dueDate ? 1 : 0.5,
              fontFamily: FONTS.body,
            }}
          >
            {shiftLabel(n)}
          </button>
        ))}
      </div>

      <button
        onClick={() => onSave(dueDate)}
        disabled={!dueDate}
        style={{
          width: '100%',
          padding: '14px',
          background: COLORS.accent,
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 700,
          cursor: dueDate ? 'pointer' : 'not-allowed',
          opacity: dueDate ? 1 : 0.5,
          fontFamily: FONTS.body,
        }}
      >
        {dueDate ? `${formatDate(dueDate)}に変更する` : '日付を選んでください'}
      </button>
    </BottomSheet>
  );
};
