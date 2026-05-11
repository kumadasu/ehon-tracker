import { COLORS, FONTS } from '../constants/theme';

interface Props {
  onSignIn: () => Promise<void>;
}

export const LoginPage = ({ onSignIn }: Props) => (
  <div
    style={{
      minHeight: '100vh',
      background: COLORS.bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: FONTS.body,
    }}
  >
    <div style={{ fontSize: 56, marginBottom: 16 }}>📚</div>
    <div
      style={{
        fontFamily: FONTS.heading,
        fontSize: 28,
        fontWeight: 700,
        color: COLORS.ink,
        marginBottom: 8,
      }}
    >
      えほん記録帳
    </div>
    <div
      style={{
        fontSize: 14,
        color: COLORS.inkLight,
        marginBottom: 48,
        textAlign: 'center',
        lineHeight: 1.6,
      }}
    >
      図書館で借りた絵本を
      <br />
      バーコードスキャンで記録しましょう
    </div>

    <button
      onClick={onSignIn}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: COLORS.paper,
        border: `1.5px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: '14px 24px',
        fontSize: 15,
        fontWeight: 700,
        color: COLORS.ink,
        cursor: 'pointer',
        fontFamily: FONTS.body,
        boxShadow: '0 2px 8px #0000001a',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 48 48">
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
      </svg>
      Googleでサインイン
    </button>

    <div
      style={{
        fontSize: 12,
        color: COLORS.inkLight,
        marginTop: 32,
        textAlign: 'center',
        maxWidth: 280,
        lineHeight: 1.5,
      }}
    >
      サインインするとGoogleカレンダーへの返却日登録と、複数端末でのデータ同期が利用できます
    </div>
  </div>
);
