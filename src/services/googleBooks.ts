import type { GoogleBooksVolume } from '../types';

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
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&langRestrict=ja`;
  const res = await fetch(url);
  const data: GoogleBooksResponse = await res.json();

  if (!data.items || data.items.length === 0) return null;

  const info = data.items[0].volumeInfo;
  return {
    isbn,
    title: info.title || '不明',
    authors: (info.authors ?? ['著者不明']).join(', '),
    thumbnail: info.imageLinks?.thumbnail?.replace('http://', 'https://') ?? null,
    publisher: info.publisher ?? '',
    description: info.description ?? '',
  };
};
