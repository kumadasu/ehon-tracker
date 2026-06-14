import type { GoogleBooksVolume } from '../types';
import { toIsbn13 } from '../utils/isbn';

interface BookInfo {
  isbn: string;
  title: string;
  authors: string;
  thumbnail: string | null;
  publisher: string;
  description: string;
}

interface GoogleBooksResponse {
  items?: Array<{ volumeInfo: GoogleBooksVolume }>;
}

export const fetchBookInfo = async (isbn: string): Promise<BookInfo | null> => {
  const normalizedIsbn = toIsbn13(isbn) ?? isbn;
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
  const keyParam = apiKey ? `&key=${apiKey}` : '';
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${normalizedIsbn}${keyParam}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Books API ${res.status}`);
  }
  const data: GoogleBooksResponse = await res.json();

  if (!data.items || data.items.length === 0) return null;

  const info = data.items[0].volumeInfo;
  return {
    isbn: normalizedIsbn,
    title: info.title || '不明',
    authors: (info.authors ?? ['著者不明']).join(', '),
    thumbnail: info.imageLinks?.thumbnail?.replace('http://', 'https://') ?? null,
    publisher: info.publisher ?? '',
    description: info.description ?? '',
  };
};
