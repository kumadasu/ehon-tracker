import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import type { Book } from '../types';
import { loadBooks, saveBooks, addBook, updateBook, removeBook } from '../services/storage';
import { db } from '../services/firebase';

const booksCol = (uid: string) => collection(db!, 'users', uid, 'books');

// Migrate any books stored locally to Firestore on first sign-in
const migrateLocalToFirestore = async (uid: string) => {
  const local = loadBooks();
  if (local.length === 0) return;
  const batch = writeBatch(db!);
  local.forEach((book) => {
    batch.set(doc(booksCol(uid), book.id), book);
  });
  await batch.commit();
  saveBooks([]); // clear localStorage after migration
};

export const useBooks = (uid: string | null) => {
  const [books, setBooks] = useState<Book[]>(() => loadBooks());

  useEffect(() => {
    if (!uid || !db) return;

    // Migrate localStorage data to Firestore, then listen for real-time updates
    migrateLocalToFirestore(uid).catch(console.error);

    const unsub = onSnapshot(booksCol(uid), (snap) => {
      const firestoreBooks = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Book);
      setBooks(firestoreBooks);
    });

    return unsub;
  }, [uid]);

  const add = useCallback(
    async (book: Book) => {
      if (uid && db) {
        await setDoc(doc(booksCol(uid), book.id), book);
      } else {
        setBooks((prev) => addBook(prev, book));
      }
    },
    [uid]
  );

  const update = useCallback(
    async (book: Book) => {
      if (uid && db) {
        await updateDoc(doc(booksCol(uid), book.id), { ...book });
      } else {
        setBooks((prev) => updateBook(prev, book));
      }
    },
    [uid]
  );

  const remove = useCallback(
    async (id: string) => {
      if (uid && db) {
        await deleteDoc(doc(booksCol(uid), id));
      } else {
        setBooks((prev) => removeBook(prev, id));
      }
    },
    [uid]
  );

  const markReturned = useCallback(
    async (id: string) => {
      const book = books.find((b) => b.id === id);
      if (!book) return;
      await update({ ...book, returned: true });
    },
    [books, update]
  );

  return { books, add, update, remove, markReturned };
};
