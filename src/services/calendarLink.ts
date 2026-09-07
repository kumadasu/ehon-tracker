import type { Book } from '../types';

const summary = (books: Book[]): string =>
  books.length === 1 ? `返却期限：${books[0].title}` : `返却期限（${books.length}冊）`;

const descriptionLines = (books: Book[]): string =>
  `図書館の絵本の返却期限です。\n${books.map((b) => `・${b.title}`).join('\n')}`;

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
