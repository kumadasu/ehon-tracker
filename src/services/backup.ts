import type { Book } from '../types';

const APP_ID = 'ehon-tracker';
const FORMAT_VERSION = 1;

interface BackupFile {
  app: typeof APP_ID;
  version: number;
  exportedAt: string;
  books: Book[];
}

/** Thrown when a file does not look like an ehon-tracker backup. */
export class InvalidBackupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidBackupError';
  }
}

export const serializeBackup = (books: Book[], exportedAt: string): string => {
  const file: BackupFile = { app: APP_ID, version: FORMAT_VERSION, exportedAt, books };
  return JSON.stringify(file, null, 2);
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

const toBook = (raw: unknown, index: number): Book => {
  if (!isRecord(raw)) throw new InvalidBackupError(`books[${index}] is not an object`);
  for (const key of ['id', 'title', 'borrowedAt', 'dueDate'] as const) {
    if (typeof raw[key] !== 'string' || raw[key] === '') {
      throw new InvalidBackupError(`books[${index}].${key} is missing`);
    }
  }
  const rating = typeof raw.rating === 'number' ? Math.min(5, Math.max(0, raw.rating)) : 0;
  const book: Book = {
    id: raw.id as string,
    isbn: str(raw.isbn),
    title: raw.title as string,
    authors: str(raw.authors),
    thumbnail: typeof raw.thumbnail === 'string' ? raw.thumbnail : null,
    publisher: str(raw.publisher),
    description: str(raw.description),
    borrowedAt: raw.borrowedAt as string,
    dueDate: raw.dueDate as string,
    returned: raw.returned === true,
    rating,
    memo: str(raw.memo),
  };
  if (typeof raw.volume === 'string') book.volume = raw.volume;
  return book;
};

/**
 * Parses a backup file. Also accepts a bare array of books, which is what the
 * localStorage value itself looks like, so a hand-copied dump can be restored.
 */
export const parseBackup = (text: string): Book[] => {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new InvalidBackupError('not JSON');
  }
  let list: unknown;
  if (Array.isArray(data)) {
    list = data;
  } else if (isRecord(data) && data.app === APP_ID && Array.isArray(data.books)) {
    list = data.books;
  } else {
    throw new InvalidBackupError('not an ehon-tracker backup');
  }
  return (list as unknown[]).map(toBook);
};

/**
 * Merges imported books into the current list. A book whose id already exists is
 * replaced in place by the imported copy; new books are prepended in file order.
 */
export const mergeBooks = (current: Book[], imported: Book[]): Book[] => {
  const byId = new Map(imported.map((b) => [b.id, b]));
  const merged = current.map((b) => byId.get(b.id) ?? b);
  const existing = new Set(current.map((b) => b.id));
  const added = imported.filter((b) => !existing.has(b.id));
  return [...added, ...merged];
};
