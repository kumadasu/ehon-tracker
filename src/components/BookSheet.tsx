import { useState } from 'react';
import type { Book } from '../types';
import { COLORS, FONTS } from '../constants/theme';
import { addDays, today } from '../utils/dateUtils';
import { StarRating } from './StarRating';

interface Props {
  book: Partial<Book> & { title: string; authors: string; isbn: string };
  isManual?: boolean;
  onSave: (book: Book) => void;
  onCancel: () => void;
}

export const BookSheet = ({ book, isManual = false, onSave, onCancel }: Props) => {
  const [dueDate, setDueDate] = useState(book.dueDate ?? addDays(today(), 14));
  const [rating, setRating] = useState(book.rating ?? 0);
  const [memo, setMemo] = useState(book.memo ?? '');
  const [title, setTitle] = useState(book.title);
  const [authors, setAuthors] = useState(book.authors);

  const handleSave = () => {
    onSave({
      id: book.id ?? Date.now().toString(),
      isbn: book.isbn,
      title: isManual ? title : book.title,
      authors: isManual ? authors : book.authors,
      thumbnail: book.thumbnail ?? null,
      publisher: book.publisher ?? '',
      description: book.description ?? '',
      borrowedAt: book.borrowedAt ?? today(),
      returned: book.returned ?? false,
      dueDate,
      rating,
      memo,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28,25,23,.6)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-end',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: COLORS.paper,
          borderRadius: '20px 20px 0 0',
          padding: '24px 20px 36px',
          width: '100%',
          maxWidth: 480,
          margin: '0 auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div
          style={{
            width: 40,
            height: 4,
            background: COLORS.border,
            borderRadius: 2,
            margin: '0 auto 20px',
          }}
        />

        {/* Book header */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
          <div
            style={{
              width: 52,
              height: 70,
              borderRadius: 6,
              background: COLORS.bg,
              border: `1px solid ${COLORS.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {book.thumbnail ? (
              <img
                src={book.thumbnail}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              '📚'
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {isManual ? (
              <>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="タイトル（必須）"
                  style={{
                    width: '100%',
                    fontFamily: FONTS.body,
                    fontSize: 15,
                    fontWeight: 700,
                    color: COLORS.ink,
                    border: `1.5px solid ${COLORS.border}`,
                    borderRadius: 6,
                    padding: '6px 8px',
                    background: COLORS.bg,
                    boxSizing: 'border-box',
                  }}
                />
                <input
                  type="text"
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  placeholder="著者・出版社など"
                  style={{
                    width: '100%',
                    fontSize: 13,
                    color: COLORS.inkLight,
                    border: `1.5px solid ${COLORS.border}`,
                    borderRadius: 6,
                    padding: '5px 8px',
                    background: COLORS.bg,
                    marginTop: 6,
                    boxSizing: 'border-box',
                  }}
                />
              </>
            ) : (
              <>
                <div
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 16,
                    fontWeight: 700,
                    color: COLORS.ink,
                  }}
                >
                  {book.title}
                </div>
                <div style={{ fontSize: 13, color: COLORS.inkLight, marginTop: 2 }}>
                  {book.authors}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Due date */}
        <label style={{ display: 'block', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.inkLight, marginBottom: 6 }}>
            返却予定日
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

        {/* Rating */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.inkLight, marginBottom: 6 }}>
            評価
          </div>
          <StarRating value={rating} onChange={setRating} />
        </div>

        {/* Memo */}
        <label style={{ display: 'block', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.inkLight, marginBottom: 6 }}>
            感想メモ
          </div>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="子どもの反応や好きなシーンなど…"
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: 8,
              background: COLORS.bg,
              fontSize: 14,
              color: COLORS.ink,
              resize: 'none',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />
        </label>

        <button
          onClick={handleSave}
          disabled={isManual && title.trim() === ''}
          style={{
            width: '100%',
            padding: '14px',
            background: COLORS.accent,
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            cursor: isManual && title.trim() === '' ? 'not-allowed' : 'pointer',
            fontFamily: FONTS.body,
            opacity: isManual && title.trim() === '' ? 0.5 : 1,
          }}
        >
          保存する
        </button>
      </div>
    </div>
  );
};
