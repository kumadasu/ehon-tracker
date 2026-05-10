import { COLORS } from '../constants/theme';

interface Props {
  value: number;
  onChange?: (rating: number) => void;
}

export const StarRating = ({ value, onChange }: Props) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <span
        key={s}
        onClick={() => onChange?.(s)}
        style={{
          fontSize: 22,
          cursor: onChange ? 'pointer' : 'default',
          color: s <= value ? COLORS.star : COLORS.border,
          transition: 'color .15s',
        }}
      >
        ★
      </span>
    ))}
  </div>
);
