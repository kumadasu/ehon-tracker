export interface Book {
  id: string;
  isbn: string;
  title: string;
  authors: string;
  thumbnail: string | null;
  publisher: string;
  description: string;
  borrowedAt: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  returned: boolean;
  rating: number; // 0–5
  memo: string;
  volume?: string; // magazine issue info e.g. "18巻1号(通号204) 2025年1月"
}

export type BookDraft = Omit<Book, 'id' | 'borrowedAt' | 'returned'> & {
  id?: string;
  borrowedAt?: string;
  returned?: boolean;
};

export interface GoogleBooksVolume {
  title: string;
  authors?: string[];
  publisher?: string;
  description?: string;
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
  };
}
