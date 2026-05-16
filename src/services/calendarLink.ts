import type { Book } from '../types';

export const buildGoogleCalendarUrl = (book: Book): string => {
  const date = book.dueDate.replace(/-/g, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `📚 返却期限：${book.title}`,
    dates: `${date}/${date}`,
    details: `図書館の絵本の返却期限です。\nISBN: ${book.isbn}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const buildIcsContent = (book: Book): string => {
  const date = book.dueDate.replace(/-/g, '');
  const next = new Date(`${book.dueDate}T00:00:00`);
  next.setDate(next.getDate() + 1);
  const endDate = next.toISOString().slice(0, 10).replace(/-/g, '');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ehon-tracker//EN',
    'BEGIN:VEVENT',
    `DTSTART;VALUE=DATE:${date}`,
    `DTEND;VALUE=DATE:${endDate}`,
    `SUMMARY:📚 返却期限：${book.title}`,
    `DESCRIPTION:図書館の絵本の返却期限です。\\nISBN: ${book.isbn}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT9H',
    'ACTION:DISPLAY',
    'DESCRIPTION:返却期限のリマインダー',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
};

export const downloadIcs = (book: Book): void => {
  const content = buildIcsContent(book);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `返却期限_${book.title}.ics`;
  a.click();
  URL.revokeObjectURL(url);
};
