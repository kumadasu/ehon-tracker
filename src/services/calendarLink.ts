import type { Book } from '../types';

export const buildGoogleCalendarUrl = (books: Book[]): string => {
  const date = books[0].dueDate.replace(/-/g, '');
  const text = books.length === 1 ? `返却期限：${books[0].title}` : `返却期限（${books.length}冊）`;
  const details = `図書館の絵本の返却期限です。\n` + books.map((b) => `・${b.title}`).join('\n');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text,
    dates: `${date}/${date}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const buildIcsContent = (books: Book[]): string => {
  const date = books[0].dueDate.replace(/-/g, '');
  const next = new Date(`${books[0].dueDate}T00:00:00`);
  next.setDate(next.getDate() + 1);
  const endDate = next.toISOString().slice(0, 10).replace(/-/g, '');
  const summary =
    books.length === 1 ? `返却期限：${books[0].title}` : `返却期限（${books.length}冊）`;
  const description =
    `図書館の絵本の返却期限です。\\n` + books.map((b) => `・${b.title}`).join('\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ehon-tracker//EN',
    'BEGIN:VEVENT',
    `DTSTART;VALUE=DATE:${date}`,
    `DTEND;VALUE=DATE:${endDate}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
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
