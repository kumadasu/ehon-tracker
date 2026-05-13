import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetchBookInfo } from './googleBooks';

beforeEach(() => {
  // Mock fetch because Google Books API is an external HTTP dependency
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

const makeVolumeInfo = (overrides: Record<string, unknown> = {}) => ({
  title: 'ぐりとぐら',
  authors: ['中川李枝子'],
  publisher: '福音館書店',
  description: 'おいしいカステラを作るお話',
  imageLinks: { thumbnail: 'https://example.com/cover.jpg' },
  ...overrides,
});

describe('fetchBookInfo', () => {
  it('when the API returns a valid response, it should return a BookInfo with isbn from the argument', async () => {
    // Arrange
    mockFetch({ items: [{ volumeInfo: makeVolumeInfo() }] });

    // Act
    const result = await fetchBookInfo('9784001140309');

    // Assert
    expect(result).not.toBeNull();
    expect(result!.isbn).toBe('9784001140309');
    expect(result!.title).toBe('ぐりとぐら');
    expect(result!.authors).toBe('中川李枝子');
  });

  it('when thumbnail URL starts with http://, it should convert it to https://', async () => {
    // Arrange
    mockFetch({
      items: [
        {
          volumeInfo: makeVolumeInfo({
            imageLinks: { thumbnail: 'http://example.com/cover.jpg' },
          }),
        },
      ],
    });

    // Act
    const result = await fetchBookInfo('9784001140309');

    // Assert
    expect(result!.thumbnail).toBe('https://example.com/cover.jpg');
  });

  it('when authors is undefined, it should return "著者不明"', async () => {
    // Arrange
    mockFetch({
      items: [{ volumeInfo: makeVolumeInfo({ authors: undefined }) }],
    });

    // Act
    const result = await fetchBookInfo('9784001140309');

    // Assert
    expect(result!.authors).toBe('著者不明');
  });

  it('when items is an empty array, it should return null', async () => {
    // Arrange
    mockFetch({ items: [] });

    // Act
    const result = await fetchBookInfo('9784001140309');

    // Assert
    expect(result).toBeNull();
  });

  it('when the response has no items field, it should return null', async () => {
    // Arrange
    mockFetch({});

    // Act
    const result = await fetchBookInfo('9784001140309');

    // Assert
    expect(result).toBeNull();
  });

  it('when the API returns a non-ok status, it should throw an error containing the status code', async () => {
    // Arrange
    mockFetch({}, 500);

    // Act & Assert
    await expect(fetchBookInfo('9784001140309')).rejects.toThrow('500');
  });

  // VITE_* env vars are inlined by Vite at transform time; vi.stubEnv cannot override them.
  // Use it.skipIf to run whichever case matches the current environment.
  const CONFIGURED_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY as string | undefined;

  it.skipIf(!!CONFIGURED_KEY)(
    'when no API key is configured, the request URL should not contain "key="',
    async () => {
      // Arrange
      mockFetch({ items: [{ volumeInfo: makeVolumeInfo() }] });

      // Act
      await fetchBookInfo('9784001140309');

      // Assert
      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(calledUrl).not.toContain('key=');
    }
  );

  it.skipIf(!CONFIGURED_KEY)(
    'when an API key is configured, the request URL should contain "key=<value>"',
    async () => {
      // Arrange
      mockFetch({ items: [{ volumeInfo: makeVolumeInfo() }] });

      // Act
      await fetchBookInfo('9784001140309');

      // Assert
      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain(`key=${CONFIGURED_KEY}`);
    }
  );

  it('when title is absent, it should return "不明"', async () => {
    // Arrange
    mockFetch({ items: [{ volumeInfo: makeVolumeInfo({ title: '' }) }] });

    // Act
    const result = await fetchBookInfo('9784001140309');

    // Assert
    expect(result!.title).toBe('不明');
  });

  it('when imageLinks is absent, thumbnail should be null', async () => {
    // Arrange
    mockFetch({ items: [{ volumeInfo: makeVolumeInfo({ imageLinks: undefined }) }] });

    // Act
    const result = await fetchBookInfo('9784001140309');

    // Assert
    expect(result!.thumbnail).toBeNull();
  });

  it('when publisher and description are absent, they should default to empty strings', async () => {
    // Arrange
    mockFetch({
      items: [{ volumeInfo: makeVolumeInfo({ publisher: undefined, description: undefined }) }],
    });

    // Act
    const result = await fetchBookInfo('9784001140309');

    // Assert
    expect(result!.publisher).toBe('');
    expect(result!.description).toBe('');
  });
});
