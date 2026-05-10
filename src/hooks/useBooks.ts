import { useState, useEffect, useCallback, useRef } from 'react';
import type { Book } from '../types';
import { loadBooks, saveBooks, addBook, updateBook, removeBook } from '../services/storage';
import { readDriveBooks, writeDriveBooks } from '../services/driveStorage';

interface DriveContext {
  accessToken: string;
  driveFileId: string;
}

// Write debounce: wait 800ms after the last change before writing to Drive
const WRITE_DEBOUNCE_MS = 800;

export const useBooks = (drive: DriveContext | null) => {
  const [books, setBooks] = useState<Book[]>(() => loadBooks());
  const pendingWrite = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When drive context becomes available, load from Drive and migrate local data
  useEffect(() => {
    if (!drive) return;

    const { accessToken, driveFileId } = drive;

    readDriveBooks(accessToken, driveFileId).then((driveBooks) => {
      const localBooks = loadBooks();

      if (driveBooks.length === 0 && localBooks.length > 0) {
        // Migrate localStorage data to Drive on first sign-in
        writeDriveBooks(accessToken, driveFileId, localBooks).then(() => {
          saveBooks([]); // clear localStorage after migration
        });
        setBooks(localBooks);
      } else {
        setBooks(driveBooks);
      }
    });
  }, [drive?.driveFileId]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback(
    (updated: Book[]) => {
      if (drive) {
        // Debounce Drive writes to avoid hammering the API on rapid changes
        if (pendingWrite.current) clearTimeout(pendingWrite.current);
        pendingWrite.current = setTimeout(() => {
          writeDriveBooks(drive.accessToken, drive.driveFileId, updated);
        }, WRITE_DEBOUNCE_MS);
      } else {
        saveBooks(updated);
      }
    },
    [drive]
  );

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
