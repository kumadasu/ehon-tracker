import { useState, useCallback } from 'react';
import type { Book } from '../types';
import { loadBooks, saveBooks, addBook, updateBook, removeBook } from '../services/storage';

export const useBooks = () => {
  const [books, setBooks] = useState<Book[]>(() => loadBooks());

  const persist = useCallback((updated: Book[]) => {
    saveBooks(updated);
  }, []);

  const add = useCallback(
    (book: Book) => {
      setBooks((prev) => {
        const next = addBook(prev, book);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const update = useCallback(
    (book: Book) => {
      setBooks((prev) => {
        const next = updateBook(prev, book);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const remove = useCallback(
    (id: string) => {
      setBooks((prev) => {
        const next = removeBook(prev, id);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const markReturned = useCallback(
    (id: string) => {
      setBooks((prev) => {
        const book = prev.find((b) => b.id === id);
        if (!book) return prev;
        const next = updateBook(prev, { ...book, returned: true });
        persist(next);
        return next;
      });
    },
    [persist]
  );

  return { books, add, update, remove, markReturned };
};
