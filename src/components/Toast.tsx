import { COLORS } from '../constants/theme';

interface Props {
  message: string;
}

export const Toast = ({ message }: Props) => (
  <div
    style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      background: COLORS.ink,
      color: '#fff',
      borderRadius: 24,
      padding: '10px 20px',
      fontSize: 14,
      fontWeight: 600,
      zIndex: 200,
      animation: 'fadeIn .2s ease',
      whiteSpace: 'nowrap',
    }}
  >
    {message}
  </div>
);
