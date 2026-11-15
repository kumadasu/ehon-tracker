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

/** True for a `YYYY-MM-DD` string naming a real calendar day (rejects 2024-02-30). */
const isCalendarDate = (v: unknown): v is string => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

const toBook = (raw: unknown, index: number): Book => {
  if (!isRecord(raw)) throw new InvalidBackupError(`books[${index}] is not an object`);
  for (const key of ['id', 'title'] as const) {
    if (typeof raw[key] !== 'string' || raw[key] === '') {
      throw new InvalidBackupError(`books[${index}].${key} is missing`);
    }
  }
  for (const key of ['borrowedAt', 'dueDate'] as const) {
    if (!isCalendarDate(raw[key])) {
      throw new InvalidBackupError(`books[${index}].${key} is not a YYYY-MM-DD date`);
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
    // A file from another format version may carry fields this build would
    // silently drop or default, then overwrite good local records with
    if (data.version !== FORMAT_VERSION) {
      throw new InvalidBackupError(`unsupported backup version ${String(data.version)}`);
    }
    list = data.books;
  } else {
    throw new InvalidBackupError('not an ehon-tracker backup');
  }
  return (list as unknown[]).map(toBook);
};

/**
 * Merges imported books into the current list, matching on id. Each registration
 * gets its own id, so borrowing the same title twice yields two records and both
 * survive. Only the same record (same id) is replaced in place by the imported
 * copy; new records are prepended in file order.
 */
export const mergeBooks = (current: Book[], imported: Book[]): Book[] => {
  const byId = new Map(imported.map((b) => [b.id, b]));
  const merged = current.map((b) => byId.get(b.id) ?? b);
  const existing = new Set(current.map((b) => b.id));
  const added = imported.filter((b) => !existing.has(b.id));
  return [...added, ...merged];
};
