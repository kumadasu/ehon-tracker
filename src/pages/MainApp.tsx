import { useState, useCallback } from 'react';
import type { Book } from '../types';
import { today, addDays, formatDate, daysLeft } from '../utils/dateUtils';
import { cx } from '../utils/cx';
import { fetchBookInfo } from '../services/googleBooks';
import type { NdlMagazineIssue } from '../services/ndlSearch';
import { buildGoogleCalendarUrl, downloadIcs } from '../services/calendarLink';
import { useBooks } from '../hooks/useBooks';
import { BookCard } from '../components/BookCard';
import { BookSheet } from '../components/BookSheet';
import { DueDateSheet } from '../components/DueDateSheet';
import { ScannerView } from '../components/ScannerView';
import { MagazineSearchView } from '../components/MagazineSearchView';
import { Toast } from '../components/Toast';
import styles from './MainApp.module.css';

type Tab = 'borrowing' | 'history' | 'search';

type EditableBook = Partial<Book> & { title: string; authors: string; isbn: string };

const remainingLabel = (left: number) =>
  left < 0 ? `${Math.abs(left)}日超過` : left === 0 ? '今日まで' : `あと${left}日`;

export const MainApp = () => {
  const { books, add, update, changeDueDates, markReturned } = useBooks();
  const [tab, setTab] = useState<Tab>('borrowing');
  const [scanning, setScanning] = useState(false);
  const [showMagazineSearch, setShowMagazineSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editBook, setEditBook] = useState<EditableBook | null>(null);
  const [reschedulingDueDate, setReschedulingDueDate] = useState<string | null>(null);
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

  const handleMagazineSelect = useCallback((issue: NdlMagazineIssue) => {
    setShowMagazineSearch(false);
    const borrowedAt = today();
    setEditBook({
      title: issue.title,
      authors: issue.publisher,
      isbn: issue.issn,
      volume: issue.volume,
      publisher: issue.publisher,
      thumbnail: null,
      description: '',
      borrowedAt,
      dueDate: addDays(borrowedAt, 14),
      returned: false,
      rating: 0,
      memo: '',
    });
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

  const handleReschedule = (dueDate: string) => {
    changeDueDates(
      reschedulingBooks.map((b) => b.id),
      dueDate
    );
    showToast(`📅 ${reschedulingBooks.length}冊の返却期限を${formatDate(dueDate)}に変更しました`);
    setReschedulingDueDate(null);
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

  // Derived from books, so the sheet never shows a stale snapshot of the group
  const reschedulingBooks = reschedulingDueDate
    ? (borrowingByDate.get(reschedulingDueDate) ?? [])
    : [];

  const visibleBooks = tab === 'history' ? history : searchResults;

  const stats = [
    { label: '借り中', value: borrowing.length, tone: styles.borrowing },
    { label: '読了', value: history.length, tone: styles.history },
    { label: '合計', value: books.length, tone: styles.total },
  ];

  const tabs: { id: Tab; label: string }[] = [
    { id: 'borrowing', label: `借り中 (${borrowing.length})` },
    { id: 'history', label: `読了 (${history.length})` },
    { id: 'search', label: '🔍 検索' },
  ];

  return (
    <>
      <div className={styles.app}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <div className={styles.eyebrow}>Library</div>
              <div className={styles.wordmark}>えほん記録帳</div>
            </div>

            <div className={styles.headerActions}>
              <button onClick={() => setShowMagazineSearch(true)} className={styles.magazineButton}>
                📖 雑誌
              </button>
              <button
                onClick={() => setScanning(true)}
                disabled={loading}
                className={styles.scanButton}
              >
                {loading ? '読込中…' : '📷 スキャン'}
              </button>
            </div>
          </div>

          <div className={styles.stats}>
            {stats.map((s) => (
              <div key={s.label} className={styles.stat}>
                <div className={cx(styles.statValue, s.tone)}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.tabs}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cx(styles.tab, tab === t.id && styles.active)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {tab === 'search' && (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="タイトル・著者・メモで検索…"
              className={styles.searchInput}
              autoFocus
            />
          )}

          {tab === 'search' && query && searchResults.length === 0 && (
            <div className={styles.noResults}>「{query}」は見つかりませんでした</div>
          )}

          {tab === 'borrowing' &&
            Array.from(borrowingByDate.entries()).map(([dueDate, group]) => {
              const left = daysLeft(dueDate);
              return (
                <div key={dueDate} className={styles.group}>
                  <div className={styles.groupHeader}>
                    <div className={styles.groupMeta}>
                      <span className={styles.groupDate}>{formatDate(dueDate)}</span>
                      <span className={cx(styles.pill, styles.countPill)}>{group.length}冊</span>
                      <span
                        className={cx(styles.pill, styles.daysPill, left <= 3 && styles.urgent)}
                      >
                        {remainingLabel(left)}
                      </span>
                    </div>
                    <div className={styles.groupActions}>
                      <button
                        onClick={() => setReschedulingDueDate(dueDate)}
                        className={cx(styles.groupAction, styles.accent)}
                      >
                        期限変更
                      </button>
                      <button
                        onClick={() =>
                          window.open(
                            buildGoogleCalendarUrl(group),
                            '_blank',
                            'noopener,noreferrer'
                          )
                        }
                        className={styles.groupAction}
                      >
                        Googleカレンダー
                      </button>
                      <button
                        onClick={() => {
                          downloadIcs(group);
                          showToast('.icsファイルをダウンロードしました');
                        }}
                        className={styles.groupAction}
                      >
                        .ics
                      </button>
                    </div>
                  </div>
                  {group.map((book) => (
                    <div key={book.id} className={styles.cardSlot}>
                      <BookCard book={book} onReturn={handleReturn} onEdit={setEditBook} />
                    </div>
                  ))}
                </div>
              );
            })}

          {tab !== 'borrowing' &&
            visibleBooks.map((book) => (
              <div key={book.id} className={cx(styles.cardSlot, styles.spaced)}>
                <BookCard book={book} onReturn={handleReturn} onEdit={setEditBook} />
              </div>
            ))}

          {tab === 'borrowing' && borrowing.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📚</div>
              <div className={styles.emptyTitle}>借り中の本はありません</div>
              <div className={styles.emptyHint}>上の「スキャン」ボタンで本を登録しましょう</div>
            </div>
          )}

          {tab === 'history' && history.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🌱</div>
              <div className={styles.emptyHint}>返却した本がここに表示されます</div>
            </div>
          )}
        </div>
      </div>

      {scanning && <ScannerView onDetected={handleDetected} onClose={() => setScanning(false)} />}

      {showMagazineSearch && (
        <MagazineSearchView
          onSelect={handleMagazineSelect}
          onClose={() => setShowMagazineSearch(false)}
        />
      )}

      {editBook && (
        <BookSheet book={editBook} onSave={handleSave} onCancel={() => setEditBook(null)} />
      )}

      {reschedulingBooks.length > 0 && (
        <DueDateSheet
          books={reschedulingBooks}
          onSave={handleReschedule}
          onCancel={() => setReschedulingDueDate(null)}
        />
      )}

      {toast && <Toast message={toast} />}
    </>
  );
};
