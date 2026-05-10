import type { Book } from '../types';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const FILE_NAME = 'ehon-books.json';

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

// Search for an existing file by name (only files this app created via drive.file scope)
const findFile = async (token: string): Promise<string | null> => {
  const query = encodeURIComponent(`name='${FILE_NAME}' and trashed=false`);
  const res = await fetch(`${DRIVE_API}/files?q=${query}&fields=files(id)`, {
    headers: authHeader(token),
  });
  const data = (await res.json()) as { files: Array<{ id: string }> };
  return data.files[0]?.id ?? null;
};

// Create a new empty JSON file in the user's Drive
const createFile = async (token: string): Promise<string> => {
  const metadata = { name: FILE_NAME, mimeType: 'application/json' };
  const content = JSON.stringify([]);

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([content], { type: 'application/json' }));

  const res = await fetch(`${UPLOAD_API}/files?uploadType=multipart&fields=id`, {
    method: 'POST',
    headers: authHeader(token),
    body: form,
  });
  const data = (await res.json()) as { id: string };
  return data.id;
};

// Find existing file or create a new one, return its Drive file ID
export const findOrCreateFile = async (token: string): Promise<string> => {
  const existing = await findFile(token);
  return existing ?? createFile(token);
};

// Read the books array from the Drive JSON file
export const readDriveBooks = async (token: string, fileId: string): Promise<Book[]> => {
  const res = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
    headers: authHeader(token),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as Book[];
  return Array.isArray(data) ? data : [];
};

// Overwrite the Drive JSON file with the current books array
export const writeDriveBooks = async (
  token: string,
  fileId: string,
  books: Book[]
): Promise<void> => {
  await fetch(`${UPLOAD_API}/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      ...authHeader(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(books),
  });
};
