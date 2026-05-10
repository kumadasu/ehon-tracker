import { useState, useCallback } from 'react';
import type { Book } from '../types';
import { loadBooks, addBook, updateBook, removeBook } from '../services/storage';

export const useBooks = () => {
  const [books, setBooks] = useState<Book[]>(() => loadBooks());

  const add = useCallback((book: Book) => {
    setBooks((prev) => addBook(prev, book));
  }, []);

  const update = useCallback((book: Book) => {
    setBooks((prev) => updateBook(prev, book));
  }, []);

  const remove = useCallback((id: string) => {
    setBooks((prev) => removeBook(prev, id));
  }, []);

  const markReturned = useCallback((id: string) => {
    setBooks((prev) => updateBook(prev, { ...prev.find((b) => b.id === id)!, returned: true }));
  }, []);

  return { books, add, update, remove, markReturned };
};
