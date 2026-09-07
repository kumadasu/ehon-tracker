import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MainApp } from './MainApp';
import { makeBook } from '../test/fixtures';
import { addDays, today, formatDate } from '../utils/dateUtils';
import { fetchBookInfo } from '../services/googleBooks';
import { downloadIcs } from '../services/calendarLink';
import type { Book } from '../types';

// Mock the two HTTP boundaries and the barcode library; MainApp is the composition
// root, so its children reach the camera and both remote APIs.
vi.mock('../services/googleBooks', () => ({ fetchBookInfo: vi.fn() }));
vi.mock('../services/ndlSearch', () => ({ searchMagazineIssues: vi.fn().mockResolvedValue([]) }));
vi.mock('@zxing/browser', () => ({
  BrowserMultiFormatReader: class {
    decodeFromVideoDevice = vi.fn().mockRejectedValue(new Error('no camera'));
  },
}));
vi.mock('../services/calendarLink', async (original) => ({
  ...(await original<typeof import('../services/calendarLink')>()),
  downloadIcs: vi.fn(),
}));

const fetchMock = vi.mocked(fetchBookInfo);
const STORAGE_KEY = 'ehon-tracker-books';

const seed = (...books: Book[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
const stored = (): Book[] => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.stubGlobal('open', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MainApp — borrowing tab', () => {
  it('when nothing is borrowed, it should show the empty state', () => {
    // Verifies the first-run screen points at the scan button

    // Arrange & Act
    render(<MainApp />);

    // Assert
    expect(screen.getByText('借り中の本はありません')).toBeInTheDocument();
  });

  it('when books share a due date, it should group them under one heading', () => {
    // Verifies the grouping that the bulk due-date feature relies on

    // Arrange
    const due = addDays(today(), 10);
    seed(
      makeBook({ id: '1', title: 'ぐりとぐら', dueDate: due }),
      makeBook({ id: '2', title: 'ノンタン', dueDate: due })
    );

    // Act
    render(<MainApp />);

    // Assert
    expect(screen.getByText(formatDate(due))).toBeInTheDocument();
    expect(screen.getByText('2冊')).toBeInTheDocument();
  });

  it('when a due date is in the future, it should show the remaining days', () => {
    // Verifies the non-urgent countdown wording

    // Arrange
    seed(makeBook({ dueDate: addDays(today(), 10) }));

    // Act
    render(<MainApp />);

    // Assert
    expect(screen.getByText('あと10日')).toBeInTheDocument();
  });

  it('when the due date is today, it should say so rather than showing zero days', () => {
    // Verifies the boundary wording fixed in an earlier change

    // Arrange
    seed(makeBook({ dueDate: today() }));

    // Act
    render(<MainApp />);

    // Assert
    expect(screen.getByText('今日まで')).toBeInTheDocument();
  });

  it('when the due date has passed, it should show how many days overdue', () => {
    // Verifies the overdue wording

    // Arrange
    seed(makeBook({ dueDate: addDays(today(), -2) }));

    // Act
    render(<MainApp />);

    // Assert
    expect(screen.getByText('2日超過')).toBeInTheDocument();
  });

  it('when a book is returned from its card, it should move out of the borrowing list', async () => {
    // Verifies the return action updates both the list and storage

    // Arrange
    const user = userEvent.setup();
    seed(makeBook({ id: '1', title: 'ぐりとぐら', dueDate: addDays(today(), 5) }));
    render(<MainApp />);

    // Act
    await user.click(screen.getByRole('button', { name: '返却' }));

    // Assert
    expect(screen.getByText('✓ 返却済みに変更しました')).toBeInTheDocument();
    expect(stored()[0].returned).toBe(true);
  });
});

describe('MainApp — bulk due date change', () => {
  it('when a group is rescheduled, it should move every book in it', async () => {
    // Verifies the whole group is re-dated in one action

    // Arrange
    const user = userEvent.setup();
    const due = addDays(today(), 10);
    seed(
      makeBook({ id: '1', title: 'ぐりとぐら', dueDate: due }),
      makeBook({ id: '2', title: 'ノンタン', dueDate: due }),
      makeBook({ id: '3', title: 'はらぺこ', dueDate: addDays(today(), 20) })
    );
    render(<MainApp />);

    // Act
    await user.click(screen.getAllByRole('button', { name: '期限変更' })[0]);
    await user.click(screen.getByRole('button', { name: '-1日' }));
    await user.click(screen.getByRole('button', { name: /変更する/ }));

    // Assert
    const byId = Object.fromEntries(stored().map((b) => [b.id, b.dueDate]));
    expect(byId['1']).toBe(addDays(due, -1));
    expect(byId['2']).toBe(addDays(due, -1));
    expect(byId['3']).toBe(addDays(today(), 20));
    expect(
      screen.getByText(`📅 2冊の返却期限を${formatDate(addDays(due, -1))}に変更しました`)
    ).toBeInTheDocument();
  });

  it('when the reschedule sheet is cancelled, it should leave the due dates alone', async () => {
    // Verifies dismissing the sheet is not destructive

    // Arrange
    const user = userEvent.setup();
    const due = addDays(today(), 10);
    seed(makeBook({ id: '1', dueDate: due }));
    render(<MainApp />);

    // Act
    await user.click(screen.getByRole('button', { name: '期限変更' }));
    await user.click(screen.getByRole('button', { name: '-1日' }));
    await user.keyboard('{Escape}');
    const sheet = document.querySelector('[class*="backdrop"]') as HTMLElement;
    await user.click(sheet);

    // Assert
    expect(stored()[0].dueDate).toBe(due);
  });
});

describe('MainApp — calendar export', () => {
  it('when Google Calendar is chosen, it should open a calendar url', async () => {
    // Verifies the export opens a new tab rather than navigating away

    // Arrange
    const user = userEvent.setup();
    seed(makeBook({ dueDate: addDays(today(), 5) }));
    render(<MainApp />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Googleカレンダー' }));

    // Assert
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('calendar.google.com'),
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('when .ics is chosen, it should download and confirm', async () => {
    // Verifies the file export gives feedback

    // Arrange
    const user = userEvent.setup();
    seed(makeBook({ dueDate: addDays(today(), 5) }));
    render(<MainApp />);

    // Act
    await user.click(screen.getByRole('button', { name: '.ics' }));

    // Assert
    expect(downloadIcs).toHaveBeenCalled();
    expect(screen.getByText('.icsファイルをダウンロードしました')).toBeInTheDocument();
  });
});

describe('MainApp — tabs', () => {
  it('when the history tab is empty, it should explain what will appear there', async () => {
    // Verifies the empty state of the history tab

    // Arrange
    const user = userEvent.setup();
    render(<MainApp />);

    // Act
    await user.click(screen.getByRole('button', { name: /読了/ }));

    // Assert
    expect(screen.getByText('返却した本がここに表示されます')).toBeInTheDocument();
  });

  it('when there are returned books, the history tab should list them', async () => {
    // Verifies returned books are shown separately from borrowed ones

    // Arrange
    const user = userEvent.setup();
    seed(
      makeBook({ id: '1', title: '借り中の本', returned: false }),
      makeBook({ id: '2', title: '読了の本', returned: true })
    );
    render(<MainApp />);

    // Act
    await user.click(screen.getByRole('button', { name: /読了 \(1\)/ }));

    // Assert
    expect(screen.getByText('読了の本')).toBeInTheDocument();
    expect(screen.queryByText('借り中の本')).not.toBeInTheDocument();
  });

  it('when a search matches a title, it should show that book', async () => {
    // Verifies search covers the title field

    // Arrange
    const user = userEvent.setup();
    seed(makeBook({ id: '1', title: 'ぐりとぐら' }), makeBook({ id: '2', title: 'ノンタン' }));
    render(<MainApp />);

    // Act
    await user.click(screen.getByRole('button', { name: '🔍 検索' }));
    await user.type(screen.getByPlaceholderText('タイトル・著者・メモで検索…'), 'ぐり');

    // Assert
    expect(screen.getByText('ぐりとぐら')).toBeInTheDocument();
    expect(screen.queryByText('ノンタン')).not.toBeInTheDocument();
  });

  it('when a search matches a memo, it should show that book', async () => {
    // Verifies search also covers the memo field

    // Arrange
    const user = userEvent.setup();
    seed(makeBook({ id: '1', title: 'ぐりとぐら', memo: 'よろこんでいた' }));
    render(<MainApp />);

    // Act
    await user.click(screen.getByRole('button', { name: '🔍 検索' }));
    await user.type(screen.getByPlaceholderText('タイトル・著者・メモで検索…'), 'よろこ');

    // Assert
    expect(screen.getByText('ぐりとぐら')).toBeInTheDocument();
  });

  it('when a search matches nothing, it should say so with the query', async () => {
    // Verifies the no-results message quotes what was searched for

    // Arrange
    const user = userEvent.setup();
    seed(makeBook({ title: 'ぐりとぐら' }));
    render(<MainApp />);

    // Act
    await user.click(screen.getByRole('button', { name: '🔍 検索' }));
    await user.type(screen.getByPlaceholderText('タイトル・著者・メモで検索…'), 'ざっし');

    // Assert
    expect(screen.getByText('「ざっし」は見つかりませんでした')).toBeInTheDocument();
  });
});

describe('MainApp — registering a book', () => {
  it('when a scanned book is found, it should open the sheet and register it', async () => {
    // Verifies the scan-to-register happy path

    // Arrange
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      isbn: '9784001140309',
      title: 'ぐりとぐら',
      authors: '中川李枝子',
      thumbnail: null,
      publisher: '福音館書店',
      description: '',
    });
    render(<MainApp />);

    // Act
    await user.click(screen.getByRole('button', { name: '📷 スキャン' }));
    await user.type(
      await screen.findByPlaceholderText('978xxxxxxxxxx / 4xxxxxxxxx'),
      '9784001140309'
    );
    await user.click(screen.getByRole('button', { name: '検索する' }));
    await user.click(await screen.findByRole('button', { name: '保存する' }));

    // Assert
    expect(screen.getByText('📚 登録しました！')).toBeInTheDocument();
    expect(stored()).toHaveLength(1);
    expect(stored()[0].dueDate).toBe(addDays(today(), 14));
  });

  it('when the scanned book is unknown, it should say the lookup found nothing', async () => {
    // Verifies the not-found branch of the lookup

    // Arrange
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(null);
    render(<MainApp />);

    // Act
    await user.click(screen.getByRole('button', { name: '📷 スキャン' }));
    await user.type(
      await screen.findByPlaceholderText('978xxxxxxxxxx / 4xxxxxxxxx'),
      '9784001140309'
    );
    await user.click(screen.getByRole('button', { name: '検索する' }));

    // Assert
    expect(await screen.findByText('この本の情報は見つかりませんでした')).toBeInTheDocument();
  });

  it('when the lookup is rate limited, it should say the limit was reached', async () => {
    // Verifies the 429 branch is distinguished from a generic failure

    // Arrange
    const user = userEvent.setup();
    fetchMock.mockRejectedValue(new Error('Google Books API error: 429'));
    render(<MainApp />);

    // Act
    await user.click(screen.getByRole('button', { name: '📷 スキャン' }));
    await user.type(
      await screen.findByPlaceholderText('978xxxxxxxxxx / 4xxxxxxxxx'),
      '9784001140309'
    );
    await user.click(screen.getByRole('button', { name: '検索する' }));

    // Assert
    expect(
      await screen.findByText('検索の上限に達しました。しばらくしてからお試しください')
    ).toBeInTheDocument();
  });

  it('when the lookup fails for another reason, it should suggest checking the connection', async () => {
    // Verifies the generic failure branch, including a non-Error rejection

    // Arrange
    const user = userEvent.setup();
    fetchMock.mockRejectedValue('boom');
    render(<MainApp />);

    // Act
    await user.click(screen.getByRole('button', { name: '📷 スキャン' }));
    await user.type(
      await screen.findByPlaceholderText('978xxxxxxxxxx / 4xxxxxxxxx'),
      '9784001140309'
    );
    await user.click(screen.getByRole('button', { name: '検索する' }));

    // Assert
    expect(
      await screen.findByText('検索中にエラーが発生しました。通信状況をご確認ください')
    ).toBeInTheDocument();
  });

  it('when an existing book is edited and saved, it should update rather than add', async () => {
    // Verifies the update branch of the save handler

    // Arrange
    const user = userEvent.setup();
    seed(makeBook({ id: '1', title: 'ぐりとぐら', memo: '', dueDate: addDays(today(), 5) }));
    render(<MainApp />);

    // Act
    await user.click(screen.getByRole('button', { name: '編集' }));
    await user.type(screen.getByPlaceholderText('子どもの反応や好きなシーンなど…'), 'たのしい');
    await user.click(screen.getByRole('button', { name: '保存する' }));

    // Assert
    expect(screen.getByText('✏️ 更新しました')).toBeInTheDocument();
    expect(stored()).toHaveLength(1);
    expect(stored()[0].memo).toBe('たのしい');
  });

  it('when the scanner is cancelled, it should return to the list', async () => {
    // Verifies the scanner can be dismissed without registering

    // Arrange
    const user = userEvent.setup();
    render(<MainApp />);

    // Act
    await user.click(screen.getByRole('button', { name: '📷 スキャン' }));
    await user.click(await screen.findByRole('button', { name: 'キャンセル' }));

    // Assert
    expect(screen.getByText('借り中の本はありません')).toBeInTheDocument();
  });
});

describe('MainApp — magazine search', () => {
  it('when the magazine view is opened and cancelled, it should return to the list', async () => {
    // Verifies the magazine entry point is wired and dismissable

    // Arrange
    const user = userEvent.setup();
    render(<MainApp />);

    // Act
    await user.click(screen.getByRole('button', { name: '📖 雑誌' }));
    expect(await screen.findByText('📖 雑誌を検索')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'キャンセル' }));

    // Assert
    expect(screen.queryByText('📖 雑誌を検索')).not.toBeInTheDocument();
  });
});

describe('MainApp — stats', () => {
  it('when books exist in both states, it should count them separately', () => {
    // Verifies the header counters

    // Arrange
    seed(
      makeBook({ id: '1', returned: false }),
      makeBook({ id: '2', returned: false }),
      makeBook({ id: '3', returned: true })
    );

    // Act
    render(<MainApp />);

    // Assert
    const stats = screen.getByText('借り中').parentElement?.parentElement as HTMLElement;
    expect(within(stats).getByText('借り中').previousSibling).toHaveTextContent('2');
    expect(within(stats).getByText('読了').previousSibling).toHaveTextContent('1');
    expect(within(stats).getByText('合計').previousSibling).toHaveTextContent('3');
  });
});
