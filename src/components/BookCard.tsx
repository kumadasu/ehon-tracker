import type { Book } from '../types';
import { COLORS, FONTS } from '../constants/theme';
import { formatDate, daysLeft } from '../utils/dateUtils';
import { StarRating } from './StarRating';

interface Props {
  book: Book;
  onReturn: (id: string) => void;
  onEdit: (book: Book) => void;
}

export const BookCard = ({ book, onReturn, onEdit }: Props) => {
  const left = daysLeft(book.dueDate);
  const urgent = !book.returned && left <= 3;

  return (
    <div
      style={{
        background: COLORS.paper,
        border: `1.5px solid ${urgent ? COLORS.accent : COLORS.border}`,
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        gap: 14,
        boxShadow: urgent ? `0 0 0 3px ${COLORS.accentLight}` : '0 1px 4px #0000000d',
        transition: 'box-shadow .2s',
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: 56,
          height: 76,
          borderRadius: 6,
          background: COLORS.bg,
          border: `1px solid ${COLORS.border}`,
          overflow: 'hidden',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
        }}
      >
        {book.thumbnail ? (
          <img src={book.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          '📚'
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: 15,
            fontWeight: 700,
            color: COLORS.ink,
            marginBottom: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {book.title}
        </div>
        <div style={{ fontSize: 12, color: COLORS.inkLight, marginBottom: 6 }}>{book.authors}</div>
        <StarRating value={book.rating} />
        {book.memo ? (
          <div
            style={{
              fontSize: 12,
              color: COLORS.inkLight,
              marginTop: 4,
              fontStyle: 'italic',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            "{book.memo}"
          </div>
        ) : null}
        {!book.returned && (
          <div
            style={{
              marginTop: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: urgent ? COLORS.accent : COLORS.inkLight,
              background: urgent ? COLORS.accentLight : COLORS.bg,
              borderRadius: 20,
              padding: '2px 8px',
            }}
          >
            {urgent ? '⚠️' : '📅'} 返却 {formatDate(book.dueDate)}（あと{left}日）
          </div>
        )}
        {book.returned && (
          <div
            style={{
              marginTop: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: COLORS.green,
              background: COLORS.greenLight,
              borderRadius: 20,
              padding: '2px 8px',
            }}
          >
            ✓ 返却済
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
        <button
          onClick={() => onEdit(book)}
          style={{
            background: 'none',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 11,
            cursor: 'pointer',
            color: COLORS.inkLight,
          }}
        >
          編集
        </button>
        {!book.returned && (
          <button
            onClick={() => onReturn(book.id)}
            style={{
              background: COLORS.green,
              border: 'none',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 11,
              cursor: 'pointer',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            返却
          </button>
        )}
      </div>
    </div>
  );
};
