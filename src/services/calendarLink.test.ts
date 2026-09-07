import { describe, it, expect } from 'vitest';
import { buildGoogleCalendarUrl } from './calendarLink';
import type { Book } from '../types';

const makeBook = (overrides: Partial<Book> = {}): Book => ({
  id: 'book-1',
  isbn: '9784001140309',
  title: 'ぐりとぐら',
  authors: '中川李枝子',
  thumbnail: null,
  publisher: '福音館書店',
  description: '',
  borrowedAt: '2024-01-01',
  dueDate: '2024-02-01',
  returned: false,
  rating: 0,
  memo: '',
  ...overrides,
});

const makeBooks = (count: number, overrides: Partial<Book> = {}): Book[] =>
  Array.from({ length: count }, (_, i) =>
    makeBook({ id: `book-${i + 1}`, title: `テスト絵本${i + 1}`, ...overrides })
  );

describe('buildGoogleCalendarUrl', () => {
  it('when called, it should return a Google Calendar render URL', () => {
    // Arrange
    const books = [makeBook()];

    // Act
    const url = buildGoogleCalendarUrl(books);

    // Assert
    expect(url).toMatch(/^https:\/\/calendar\.google\.com\/calendar\/render/);
  });

  it('when called, it should include action=TEMPLATE', () => {
    // Arrange / Act
    const url = buildGoogleCalendarUrl([makeBook()]);

    // Assert
    expect(url).toContain('action=TEMPLATE');
  });

  it('when called, the dates param should use the due date as a 09:00–12:00 timed event', () => {
    // Arrange
    const books = [makeBook({ dueDate: '2024-02-01' })];

    // Act
    const url = buildGoogleCalendarUrl(books);

    // Assert
    expect(url).toContain('dates=20240201T090000%2F20240201T120000');
  });

  it('when called with one book, the text param should include the book title', () => {
    // Arrange
    const books = [makeBook({ title: 'ノンタン' })];

    // Act
    const url = buildGoogleCalendarUrl(books);

    // Assert
    expect(decodeURIComponent(url)).toContain('ノンタン');
  });

  it('when called with multiple books, the text param should contain the book count', () => {
    // Arrange
    const books = makeBooks(3, { dueDate: '2024-02-01' });

    // Act
    const url = buildGoogleCalendarUrl(books);

    // Assert
    expect(decodeURIComponent(url)).toContain('3冊');
  });

  it('when called with multiple books, the details param should list all titles', () => {
    // Arrange
    const books = makeBooks(3, { dueDate: '2024-02-01' });

    // Act
    const url = buildGoogleCalendarUrl(books);
    const decoded = decodeURIComponent(url);

    // Assert
    expect(decoded).toContain('テスト絵本1');
    expect(decoded).toContain('テスト絵本2');
    expect(decoded).toContain('テスト絵本3');
  });
});
