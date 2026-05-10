import type { Book } from '../types';

const STORAGE_KEY = 'ehon-tracker-books';

export const loadBooks = (): Book[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Book[]) : [];
  } catch {
    return [];
  }
};

export const saveBooks = (books: Book[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
};

export const addBook = (books: Book[], book: Book): Book[] => {
  const updated = [book, ...books];
  saveBooks(updated);
  return updated;
};

export const updateBook = (books: Book[], updated: Book): Book[] => {
  const next = books.map((b) => (b.id === updated.id ? updated : b));
  saveBooks(next);
  return next;
};

export const removeBook = (books: Book[], id: string): Book[] => {
  const next = books.filter((b) => b.id !== id);
  saveBooks(next);
  return next;
};
