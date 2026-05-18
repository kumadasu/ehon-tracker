import { useState, useCallback } from 'react';
import type { AuthState } from '../hooks/useAuth';
import type { Book } from '../types';
import { COLORS, FONTS } from '../constants/theme';
import { today, addDays, formatDate, daysLeft } from '../utils/dateUtils';
import { fetchBookInfo } from '../services/googleBooks';
import { buildGoogleCalendarUrl, downloadIcs } from '../services/calendarLink';
import { useBooks } from '../hooks/useBooks';
import { BookCard } from '../components/BookCard';
import { BookSheet } from '../components/BookSheet';
import { ScannerView } from '../components/ScannerView';
import { Toast } from '../components/Toast';

type Tab = 'borrowing' | 'history' | 'search';

type EditableBook = Partial<Book> & { title: string; authors: string; isbn: string };

interface Props {
  auth: AuthState & { signIn: () => Promise<void>; signOut: () => void };
}

const TAB_STYLE = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '10px 0',
  background: 'none',
  border: 'none',
  borderBottom: `2.5px solid ${active ? COLORS.accent : 'transparent'}`,
  color: active ? COLORS.accent : COLORS.inkLight,
  fontSize: 13,
  fontWeight: active ? 700 : 400,
  cursor: 'pointer',
  transition: 'all .15s',
  fontFamily: FONTS.body,
});

export const MainApp = ({ auth }: Props) => {
  const drive =
    auth.accessToken && auth.driveFileId
      ? { accessToken: auth.accessToken, driveFileId: auth.driveFileId }
      : null;

  const { books, add, update, markReturned } = useBooks(drive);
  const [tab, setTab] = useState<Tab>('borrowing');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editBook, setEditBook] = useState<EditableBook | null>(null);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleDetected = useCallback(async (isbn: string) => {
    setScanning(false);
    setLoading(true);
    try {
      const info = await fetchBookInfo(isbn);
      if (!info) {
        showToast('この本の情報は見つかりませんでした');
        return;
      }
      setEditBook({
        ...info,
        borrowedAt: today(),
        dueDate: addDays(today(), 14),
        returned: false,
        rating: 0,
        memo: '',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('429')) {
        showToast('検索の上限に達しました。しばらくしてからお試しください');
      } else {
        showToast('検索中にエラーが発生しました。通信状況をご確認ください');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSave = (book: Book) => {
    if (books.some((b) => b.id === book.id)) {
      update(book);
      showToast('✏️ 更新しました');
    } else {
      add(book);
      showToast('📚 登録しました！');
      setTab('borrowing');
    }
    setEditBook(null);
  };

  const handleReturn = (id: string) => {
    markReturned(id);
    showToast('✓ 返却済みに変更しました');
  };

  const borrowing = books
    .filter((b) => !b.returned)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const history = books.filter((b) => b.returned);
  const searchResults = query.trim()
    ? books.filter(
        (b) => b.title.includes(query) || b.authors.includes(query) || b.memo.includes(query)
      )
    : [];

  const borrowingByDate = new Map<string, Book[]>();
  for (const book of borrowing) {
    const group = borrowingByDate.get(book.dueDate) ?? [];
    group.push(book);
    borrowingByDate.set(book.dueDate, group);
  }

  const visibleBooks = tab === 'history' ? history : searchResults;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${COLORS.bg}; font-family: ${FONTS.body}; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .card-enter { animation: slideUp .25s ease; }
      `}</style>

      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: COLORS.bg }}>
        {/* Header */}
        <div
          style={{
            padding: '20px 20px 12px',
            borderBottom: `1px solid ${COLORS.border}`,
            background: COLORS.paper,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: 2,
                  color: COLORS.inkLight,
                  textTransform: 'uppercase',
                }}
              >
                Library
              </div>
              <div
                style={{
                  fontFamily: FONTS.heading,
                  fontSize: 22,
                  fontWeight: 700,
                  color: COLORS.ink,
                }}
              >
                えほん記録帳
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {auth.enabled &&
                (auth.accessToken ? (
                  <button
                    onClick={auth.signOut}
                    style={{
                      background: 'none',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 20,
                      padding: '4px 10px',
                      fontSize: 11,
                      color: COLORS.inkLight,
                      cursor: 'pointer',
                    }}
                  >
                    ☁️ 同期中 · サインアウト
                  </button>
                ) : (
                  <button
                    onClick={auth.signIn}
                    style={{
                      background: 'none',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 20,
                      padding: '4px 10px',
                      fontSize: 11,
                      color: COLORS.inkLight,
                      cursor: 'pointer',
                    }}
                  >
                    ☁️ バックアップ
                  </button>
                ))}
              <button
                onClick={() => setScanning(true)}
                disabled={loading}
                style={{
                  background: COLORS.accent,
                  border: 'none',
                  borderRadius: 12,
                  padding: '10px 18px',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: FONTS.body,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? '読込中…' : '📷 スキャン'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
            {(
              [
                { label: '借り中', value: borrowing.length, color: COLORS.accent },
                { label: '読了', value: history.length, color: COLORS.green },
                { label: '合計', value: books.length, color: COLORS.inkLight },
              ] as const
            ).map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: COLORS.inkLight }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: `1px solid ${COLORS.border}`,
            background: COLORS.paper,
          }}
        >
          <button style={TAB_STYLE(tab === 'borrowing')} onClick={() => setTab('borrowing')}>
            借り中 ({borrowing.length})
          </button>
          <button style={TAB_STYLE(tab === 'history')} onClick={() => setTab('history')}>
            読了 ({history.length})
          </button>
          <button style={TAB_STYLE(tab === 'search')} onClick={() => setTab('search')}>
            🔍 検索
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px 16px 100px' }}>
          {tab === 'search' && (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="タイトル・著者・メモで検索…"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1.5px solid ${COLORS.border}`,
                borderRadius: 10,
                background: COLORS.paper,
                fontSize: 15,
                color: COLORS.ink,
                marginBottom: 12,
                fontFamily: FONTS.body,
              }}
              autoFocus
            />
          )}

          {tab === 'search' && query && searchResults.length === 0 && (
            <div style={{ textAlign: 'center', color: COLORS.inkLight, padding: 32, fontSize: 14 }}>
              「{query}」は見つかりませんでした
            </div>
          )}

          {tab === 'borrowing' &&
            Array.from(borrowingByDate.entries()).map(([dueDate, books]) => (
              <div key={dueDate} style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingLeft: 10,
                    marginBottom: 8,
                    paddingBottom: 6,
                    borderLeft: `3px solid ${COLORS.accent}`,
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink }}>
                      {formatDate(dueDate)}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: COLORS.accent,
                        background: COLORS.accentLight,
                        borderRadius: 10,
                        padding: '1px 7px',
                      }}
                    >
                      {books.length}冊
                    </span>
                    {(() => {
                      const left = daysLeft(dueDate);
                      const urgent = left <= 3;
                      return (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: urgent ? COLORS.accent : COLORS.inkLight,
                            background: urgent ? COLORS.accentLight : COLORS.bg,
                            borderRadius: 10,
                            padding: '1px 7px',
                          }}
                        >
                          {urgent && left <= 0 ? `${Math.abs(left)}日超過` : `あと${left}日`}
                        </span>
                      );
                    })()}
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button
                      onClick={() =>
                        window.open(buildGoogleCalendarUrl(books), '_blank', 'noopener,noreferrer')
                      }
                      style={{
                        background: 'none',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 6,
                        padding: '3px 8px',
                        fontSize: 11,
                        cursor: 'pointer',
                        color: COLORS.inkLight,
                        fontFamily: FONTS.body,
                      }}
                    >
                      Googleカレンダー
                    </button>
                    <button
                      onClick={() => {
                        downloadIcs(books);
                        showToast('.icsファイルをダウンロードしました');
                      }}
                      style={{
                        background: 'none',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 6,
                        padding: '3px 8px',
                        fontSize: 11,
                        cursor: 'pointer',
                        color: COLORS.inkLight,
                        fontFamily: FONTS.body,
                      }}
                    >
                      .ics
                    </button>
                  </div>
                </div>
                {books.map((book) => (
                  <div key={book.id} className="card-enter" style={{ marginBottom: 8 }}>
                    <BookCard book={book} onReturn={handleReturn} onEdit={setEditBook} />
                  </div>
                ))}
              </div>
            ))}

          {tab !== 'borrowing' &&
            visibleBooks.map((book) => (
              <div key={book.id} className="card-enter" style={{ marginBottom: 10 }}>
                <BookCard book={book} onReturn={handleReturn} onEdit={setEditBook} />
              </div>
            ))}

          {tab === 'borrowing' && borrowing.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: COLORS.inkLight }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.ink, marginBottom: 6 }}>
                借り中の本はありません
              </div>
              <div style={{ fontSize: 13 }}>上の「スキャン」ボタンで本を登録しましょう</div>
            </div>
          )}

          {tab === 'history' && history.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: COLORS.inkLight }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
              <div style={{ fontSize: 13 }}>返却した本がここに表示されます</div>
            </div>
          )}
        </div>
      </div>

      {scanning && <ScannerView onDetected={handleDetected} onClose={() => setScanning(false)} />}

      {editBook && (
        <BookSheet book={editBook} onSave={handleSave} onCancel={() => setEditBook(null)} />
      )}

      {toast && <Toast message={toast} />}
    </>
  );
};
