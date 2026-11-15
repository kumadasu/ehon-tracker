import type { Book } from '../types';
import { isValidDate } from '../utils/dateUtils';

const APP_ID = 'ehon-tracker';
const FORMAT_VERSION = 1;

export const serializeBackup = (books: Book[], exportedAt: string): string =>
  JSON.stringify({ app: APP_ID, version: FORMAT_VERSION, exportedAt, books }, null, 2);

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

const requiredStr = (raw: Record<string, unknown>, key: string, index: number): string => {
  const v = raw[key];
  if (typeof v !== 'string' || v === '') throw new Error(`books[${index}].${key} is missing`);
  return v;
};

const requiredDate = (raw: Record<string, unknown>, key: string, index: number): string => {
  const v = raw[key];
  if (!isValidDate(v)) throw new Error(`books[${index}].${key} is not a YYYY-MM-DD date`);
  return v;
};

const toBook = (raw: unknown, index: number): Book => {
  if (!isRecord(raw)) throw new Error(`books[${index}] is not an object`);
  const book: Book = {
    id: requiredStr(raw, 'id', index),
    isbn: str(raw.isbn),
    title: requiredStr(raw, 'title', index),
    authors: str(raw.authors),
    thumbnail: typeof raw.thumbnail === 'string' ? raw.thumbnail : null,
    publisher: str(raw.publisher),
    description: str(raw.description),
    borrowedAt: requiredDate(raw, 'borrowedAt', index),
    dueDate: requiredDate(raw, 'dueDate', index),
    returned: raw.returned === true,
    rating: typeof raw.rating === 'number' ? Math.min(5, Math.max(0, raw.rating)) : 0,
    memo: str(raw.memo),
  };
  if (typeof raw.volume === 'string') book.volume = raw.volume;
  return book;
};

const bookList = (data: unknown): unknown[] => {
  // A bare array is what the localStorage value itself looks like, so a
  // hand-copied dump can be restored too
  if (Array.isArray(data)) return data;
  if (!isRecord(data) || data.app !== APP_ID || !Array.isArray(data.books)) {
    throw new Error('not an ehon-tracker backup');
  }
  // A file from another format version may carry fields this build would
  // silently drop or default, then overwrite good local records with
  if (data.version !== FORMAT_VERSION) {
    throw new Error(`unsupported backup version ${String(data.version)}`);
  }
  return data.books;
};

/** Parses a backup file, throwing if it or any record in it is malformed. */
export const parseBackup = (text: string): Book[] => bookList(JSON.parse(text)).map(toBook);

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
