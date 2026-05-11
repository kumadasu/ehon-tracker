import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { findOrCreateFile, readDriveBooks, writeDriveBooks } from './driveStorage';
import type { Book } from '../types';

beforeEach(() => {
  // Mock fetch because Drive REST API is an external HTTP dependency
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const mockFetch = (body: unknown, status = 200) =>
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);

const makeBook = (overrides: Partial<Book> = {}): Book => ({
  id: 'book-1',
  isbn: '9784001140309',
  title: 'ぐりとぐら',
  authors: '中川李枝子',
  thumbnail: null,
  publisher: '福音館書店',
  description: '',
  borrowedAt: '2024-01-01',
  dueDate: '2024-02-01',
  returned: false,
  rating: 0,
  memo: '',
  ...overrides,
});

describe('findOrCreateFile', () => {
  it('when a file already exists in Drive, it should return the existing file ID with one fetch', async () => {
    // Arrange — single fetch returns a file list with one entry
    mockFetch({ files: [{ id: 'existing-file-id' }] });

    // Act
    const result = await findOrCreateFile('access-token');

    // Assert
    expect(result).toBe('existing-file-id');
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it('when no file exists, it should create one and return the new file ID', async () => {
    // Arrange — first fetch: empty file list; second fetch: creation response
    mockFetch({ files: [] });
    mockFetch({ id: 'new-file-id' });

    // Act
    const result = await findOrCreateFile('access-token');

    // Assert
    expect(result).toBe('new-file-id');
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
  });

  it('when no file exists, the creation request URL should contain "uploadType=multipart"', async () => {
    // Arrange
    mockFetch({ files: [] });
    mockFetch({ id: 'new-file-id' });

    // Act
    await findOrCreateFile('access-token');

    // Assert
    const createUrl = vi.mocked(fetch).mock.calls[1][0] as string;
    expect(createUrl).toContain('uploadType=multipart');
  });
});

describe('readDriveBooks', () => {
  it('when the response contains a valid books array, it should return the parsed array', async () => {
    // Arrange
    const books = [makeBook()];
    mockFetch(books);

    // Act
    const result = await readDriveBooks('access-token', 'file-id');

    // Assert
    expect(result).toEqual(books);
  });

  it('when the API returns a non-ok status, it should return an empty array', async () => {
    // Arrange
    mockFetch({}, 404);

    // Act
    const result = await readDriveBooks('access-token', 'file-id');

    // Assert
    expect(result).toEqual([]);
  });

  it('when the response body is not an array, it should return an empty array', async () => {
    // Arrange — Drive may return an object instead of an array on schema mismatch
    mockFetch({ unexpected: true });

    // Act
    const result = await readDriveBooks('access-token', 'file-id');

    // Assert
    expect(result).toEqual([]);
  });
});

describe('writeDriveBooks', () => {
  it('when called, it should send a PATCH request to the correct Drive upload URL', async () => {
    // Arrange
    mockFetch({});

    // Act
    await writeDriveBooks('access-token', 'file-id-123', []);

    // Assert
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url as string).toContain('/files/file-id-123');
    expect(url as string).toContain('uploadType=media');
    expect((init as RequestInit).method).toBe('PATCH');
  });

  it('when called, the request body should be the JSON-serialized books array', async () => {
    // Arrange
    const books = [makeBook()];
    mockFetch({});

    // Act
    await writeDriveBooks('access-token', 'file-id-123', books);

    // Assert
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse((init as RequestInit).body as string)).toEqual(books);
  });

  it('when the API returns an error, it should not throw (current behavior: silent failure)', async () => {
    // Documents that writeDriveBooks does not check res.ok — errors are silently ignored.
    // See plan note: consider adding error throwing in a follow-up refactor.
    mockFetch({}, 500);

    // Act & Assert — should resolve without throwing
    await expect(writeDriveBooks('access-token', 'file-id-123', [])).resolves.toBeUndefined();
  });
});
