import { describe, it, expect } from 'vitest';
import { buildGoogleCalendarUrl, buildIcsContent } from './calendarLink';
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

describe('buildGoogleCalendarUrl', () => {
  it('when called, it should return a Google Calendar render URL', () => {
    // Arrange
    const book = makeBook();

    // Act
    const url = buildGoogleCalendarUrl(book);

    // Assert
    expect(url).toMatch(/^https:\/\/calendar\.google\.com\/calendar\/render/);
  });

  it('when called, it should include action=TEMPLATE', () => {
    // Arrange / Act
    const url = buildGoogleCalendarUrl(makeBook());

    // Assert
    expect(url).toContain('action=TEMPLATE');
  });

  it('when called, the dates param should use the due date in YYYYMMDD format', () => {
    // Arrange
    const book = makeBook({ dueDate: '2024-02-01' });

    // Act
    const url = buildGoogleCalendarUrl(book);

    // Assert
    expect(url).toContain('dates=20240201%2F20240201');
  });

  it('when called, the text param should include the book title', () => {
    // Arrange
    const book = makeBook({ title: 'ノンタン' });

    // Act
    const url = buildGoogleCalendarUrl(book);

    // Assert
    expect(decodeURIComponent(url)).toContain('ノンタン');
  });
});

describe('buildIcsContent', () => {
  it('when called, it should return a string beginning with BEGIN:VCALENDAR', () => {
    // Arrange / Act
    const ics = buildIcsContent(makeBook());

    // Assert
    expect(ics).toMatch(/^BEGIN:VCALENDAR/);
  });

  it('when called, DTSTART should equal the due date in YYYYMMDD format', () => {
    // Arrange
    const book = makeBook({ dueDate: '2024-02-01' });

    // Act
    const ics = buildIcsContent(book);

    // Assert
    expect(ics).toContain('DTSTART;VALUE=DATE:20240201');
  });

  it('when called, DTEND should be the day after the due date', () => {
    // Arrange
    const book = makeBook({ dueDate: '2024-02-01' });

    // Act
    const ics = buildIcsContent(book);

    // Assert
    expect(ics).toContain('DTEND;VALUE=DATE:20240202');
  });

  it('when called, SUMMARY should include the book title', () => {
    // Arrange
    const book = makeBook({ title: 'ノンタン' });

    // Act
    const ics = buildIcsContent(book);

    // Assert
    expect(ics).toContain('ノンタン');
  });

  it('when the due date is the last day of a month, DTEND should roll over to the next month', () => {
    // Arrange
    const book = makeBook({ dueDate: '2024-01-31' });

    // Act
    const ics = buildIcsContent(book);

    // Assert
    expect(ics).toContain('DTEND;VALUE=DATE:20240201');
  });
});
