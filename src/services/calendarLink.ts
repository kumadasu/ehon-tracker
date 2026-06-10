import type { Book } from '../types';

export const escapeIcsText = (s: string): string =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

const summary = (books: Book[]): string =>
  books.length === 1 ? `返却期限：${books[0].title}` : `返却期限（${books.length}冊）`;

const descriptionLines = (books: Book[]): string =>
  `図書館の絵本の返却期限です。\n${books.map((b) => `・${b.title}`).join('\n')}`;

const icsUid = (books: Book[]): string => {
  const raw = books.map((b) => b.id).join(',') + books[0].dueDate;
  let hash = 0;
  for (const ch of raw) {
    hash = (Math.imul(31, hash) + ch.charCodeAt(0)) | 0;
  }
  return `${Math.abs(hash).toString(16)}-${books[0].dueDate.replace(/-/g, '')}@ehon-tracker`;
};

const icsDtstamp = (): string => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`
  );
};

export const buildGoogleCalendarUrl = (books: Book[]): string => {
  const date = books[0].dueDate.replace(/-/g, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: summary(books),
    dates: `${date}T090000/${date}T120000`,
    details: descriptionLines(books),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const buildIcsContent = (books: Book[]): string => {
  const date = books[0].dueDate.replace(/-/g, '');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ehon-tracker//EN',
    'BEGIN:VEVENT',
    `DTSTAMP:${icsDtstamp()}`,
    `UID:${icsUid(books)}`,
    `DTSTART:${date}T090000`,
    `DTEND:${date}T120000`,
    `SUMMARY:${escapeIcsText(summary(books))}`,
    `DESCRIPTION:${escapeIcsText(descriptionLines(books))}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT9H',
    'ACTION:DISPLAY',
    'DESCRIPTION:返却期限のリマインダー',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
};

export const downloadIcs = (books: Book[]): void => {
  const content = buildIcsContent(books);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `返却期限_${books[0].dueDate}.ics`;
  a.click();
  URL.revokeObjectURL(url);
};
