import { describe, it, expect, beforeEach } from 'vitest';
import { loadBooks, saveBooks, addBook, updateBook, removeBook } from './storage';
import type { Book } from '../types';

const STORAGE_KEY = 'ehon-tracker-books';

const makeBook = (overrides: Partial<Book> = {}): Book => ({
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

beforeEach(() => {
  localStorage.clear();
});

describe('loadBooks', () => {
  it('when storage is empty, it should return an empty array', () => {
    // Act
    const result = loadBooks();

    // Assert
    expect(result).toEqual([]);
  });

  it('when storage contains valid JSON, it should return the parsed array', () => {
    // Arrange
    const books = [makeBook()];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));

    // Act
    const result = loadBooks();

    // Assert
    expect(result).toEqual(books);
  });

  it('when storage contains malformed JSON, it should return an empty array without throwing', () => {
    // Arrange
    localStorage.setItem(STORAGE_KEY, 'not-valid-json{{{');

    // Act
    const result = loadBooks();

    // Assert
    expect(result).toEqual([]);
  });
});

describe('saveBooks + loadBooks', () => {
  it('when books are saved and reloaded, it should return the same data', () => {
    // Arrange
    const books = [makeBook({ id: 'book-1' }), makeBook({ id: 'book-2', title: 'ノンタン' })];

    // Act
    saveBooks(books);
    const result = loadBooks();

    // Assert
    expect(result).toEqual(books);
  });
});

describe('addBook', () => {
  it('when adding to an empty array, it should return an array with one book', () => {
    // Act
    const result = addBook([], makeBook());

    // Assert
    expect(result).toHaveLength(1);
  });

  it('when adding to a non-empty array, it should prepend the new book', () => {
    // Arrange
    const existing = makeBook({ id: 'book-1', title: '既存' });
    const newBook = makeBook({ id: 'book-2', title: '新規' });

    // Act
    const result = addBook([existing], newBook);

    // Assert
    expect(result[0].id).toBe('book-2');
    expect(result[1].id).toBe('book-1');
  });

  it('when a book is added, it should be persisted to localStorage', () => {
    // Act
    addBook([], makeBook());

    // Assert
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(1);
  });
});

describe('updateBook', () => {
  it('when the id matches, it should replace the book in the array', () => {
    // Arrange
    const original = makeBook({ id: 'book-1', title: '旧タイトル' });
    const updated = makeBook({ id: 'book-1', title: '新タイトル' });

    // Act
    const result = updateBook([original], updated);

    // Assert
    expect(result[0].title).toBe('新タイトル');
  });

  it('when the book is updated, it should be persisted to localStorage', () => {
    // Arrange
    const original = makeBook({ id: 'book-1', title: '旧タイトル' });
    const updated = makeBook({ id: 'book-1', title: '新タイトル' });

    // Act
    updateBook([original], updated);

    // Assert
    const stored: Book[] = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored[0].title).toBe('新タイトル');
  });

  it('when the id does not exist, it should return the array unchanged', () => {
    // Arrange
    const book = makeBook({ id: 'book-1' });
    const ghost = makeBook({ id: 'ghost-99' });

    // Act
    const result = updateBook([book], ghost);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('book-1');
  });
});

describe('removeBook', () => {
  it('when the id matches, it should exclude the book from the array', () => {
    // Arrange
    const book = makeBook({ id: 'book-1' });

    // Act
    const result = removeBook([book], 'book-1');

    // Assert
    expect(result).toHaveLength(0);
  });

  it('when a book is removed, the updated array should be persisted to localStorage', () => {
    // Arrange
    const book = makeBook({ id: 'book-1' });

    // Act
    removeBook([book], 'book-1');

    // Assert
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(0);
  });

  it('when the id does not exist, it should return the array unchanged', () => {
    // Arrange
    const book = makeBook({ id: 'book-1' });

    // Act
    const result = removeBook([book], 'ghost-99');

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('book-1');
  });
});
