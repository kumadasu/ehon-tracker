import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { addReturnEvent } from './googleCalendar';
import type { Book } from '../types';

beforeEach(() => {
  // Mock fetch because Google Calendar API is an external HTTP dependency
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

describe('addReturnEvent', () => {
  it('when the API succeeds, it should return { success: true, eventId }', async () => {
    // Arrange
    mockFetch({ id: 'event-abc' });

    // Act
    const result = await addReturnEvent(makeBook(), 'access-token-xyz');

    // Assert
    expect(result).toEqual({ success: true, eventId: 'event-abc' });
  });

  it('when called, it should send a POST request with an Authorization header', async () => {
    // Arrange
    mockFetch({ id: 'event-abc' });

    // Act
    await addReturnEvent(makeBook(), 'my-access-token');

    // Assert
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init as RequestInit).method).toBe('POST');
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer my-access-token',
    });
  });

  it('when called, the request body should contain the book title', async () => {
    // Arrange
    mockFetch({ id: 'event-abc' });

    // Act
    await addReturnEvent(makeBook({ title: 'ノンタン' }), 'access-token-xyz');

    // Assert
    const [, init] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.summary).toContain('ノンタン');
  });

  it('when called, the event start and end should both equal book.dueDate', async () => {
    // Arrange
    mockFetch({ id: 'event-abc' });

    // Act
    await addReturnEvent(makeBook({ dueDate: '2024-02-01' }), 'access-token-xyz');

    // Assert
    const [, init] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.start).toEqual({ date: '2024-02-01' });
    expect(body.end).toEqual({ date: '2024-02-01' });
  });

  it('when the API returns an error response with error.message, it should return { success: false, error: message }', async () => {
    // Arrange
    mockFetch({ error: { message: 'insufficient permissions' } }, 403);

    // Act
    const result = await addReturnEvent(makeBook(), 'access-token-xyz');

    // Assert
    expect(result).toEqual({ success: false, error: 'insufficient permissions' });
  });

  it('when the API error response cannot be parsed as JSON, it should return { success: false, error: "Calendar API error" }', async () => {
    // Arrange — json() rejects to simulate a non-JSON error body
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    } as unknown as Response);

    // Act
    const result = await addReturnEvent(makeBook(), 'access-token-xyz');

    // Assert
    expect(result).toEqual({ success: false, error: 'Calendar API error' });
  });
});
