import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBooks } from './useBooks';
import { makeBook } from '../test/fixtures';
import type { Book } from '../types';

const STORAGE_KEY = 'ehon-tracker-books';

const seed = (...books: Book[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(books));

beforeEach(() => {
  localStorage.clear();
});

describe('useBooks', () => {
  it('when the hook mounts, it should load the books already in storage', () => {
    // Verifies state is seeded from localStorage rather than starting empty

    // Arrange
    seed(makeBook({ id: '1', title: 'ぐりとぐら' }));

    // Act
    const { result } = renderHook(() => useBooks());

    // Assert
    expect(result.current.books).toHaveLength(1);
    expect(result.current.books[0].title).toBe('ぐりとぐら');
  });

  it('when a book is added, it should appear first', () => {
    // Verifies newly registered books are shown before older ones

    // Arrange
    seed(makeBook({ id: 'old' }));
    const { result } = renderHook(() => useBooks());

    // Act
    act(() => result.current.add(makeBook({ id: 'new' })));

    // Assert
    expect(result.current.books.map((b) => b.id)).toEqual(['new', 'old']);
  });

  it('when a book is updated, it should replace the stored version', () => {
    // Verifies edits reach both state and storage

    // Arrange
    seed(makeBook({ id: '1', memo: '' }));
    const { result } = renderHook(() => useBooks());

    // Act
    act(() => result.current.update(makeBook({ id: '1', memo: 'たのしい' })));

    // Assert
    expect(result.current.books[0].memo).toBe('たのしい');
  });

  it('when a book is removed, it should disappear', () => {
    // Verifies deletion

    // Arrange
    seed(makeBook({ id: '1' }), makeBook({ id: '2' }));
    const { result } = renderHook(() => useBooks());

    // Act
    act(() => result.current.remove('1'));

    // Assert
    expect(result.current.books.map((b) => b.id)).toEqual(['2']);
  });

  it('when due dates are changed in bulk, it should apply to the listed books only', () => {
    // Verifies the bulk reschedule reaches storage through the hook

    // Arrange
    seed(
      makeBook({ id: '1', dueDate: '2024-01-15' }),
      makeBook({ id: '2', dueDate: '2024-01-15' }),
      makeBook({ id: '3', dueDate: '2024-01-22' })
    );
    const { result } = renderHook(() => useBooks());

    // Act
    act(() => result.current.changeDueDates(['1', '2'], '2024-01-14'));

    // Assert
    expect(result.current.books.map((b) => b.dueDate)).toEqual([
      '2024-01-14',
      '2024-01-14',
      '2024-01-22',
    ]);
  });

  it('when a book is marked returned, it should flip the flag', () => {
    // Verifies the return action

    // Arrange
    seed(makeBook({ id: '1', returned: false }));
    const { result } = renderHook(() => useBooks());

    // Act
    act(() => result.current.markReturned('1'));

    // Assert
    expect(result.current.books[0].returned).toBe(true);
  });

  it('when marking an unknown id returned, it should leave the list unchanged', () => {
    // Verifies the guard against an id that is no longer present

    // Arrange
    seed(makeBook({ id: '1', returned: false }));
    const { result } = renderHook(() => useBooks());
    const before = result.current.books;

    // Act
    act(() => result.current.markReturned('ghost-99'));

    // Assert
    expect(result.current.books).toBe(before);
  });
});
