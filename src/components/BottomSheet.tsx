import type { ReactNode } from 'react';
import { COLORS } from '../constants/theme';

interface Props {
  children: ReactNode;
  onClose: () => void;
}

/** Modal sheet that slides up from the bottom. Clicking the backdrop closes it. */
export const BottomSheet = ({ children, onClose }: Props) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(28,25,23,.6)',
      zIndex: 50,
      display: 'flex',
      alignItems: 'flex-end',
    }}
    onClick={onClose}
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
      {children}
    </div>
  </div>
);
