import type { Book } from '../types';

export const makeBook = (overrides: Partial<Book> = {}): Book => ({
  id: 'book-1',
  isbn: '9784001140309',
  title: 'ぐりとぐら',
  authors: '中川李枝子',
  thumbnail: null,
  publisher: '福音館書店',
  description: '',
  borrowedAt: '2024-01-01',
  dueDate: '2024-01-15',
  returned: false,
  rating: 0,
  memo: '',
  ...overrides,
});
