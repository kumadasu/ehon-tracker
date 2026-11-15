import { describe, it, expect } from 'vitest';
import { serializeBackup, parseBackup, mergeBooks, InvalidBackupError } from './backup';
import { makeBook } from '../test/fixtures';

describe('serializeBackup / parseBackup', () => {
  it('when a backup is serialized and parsed back, it should return the same books', () => {
    // Verifies the export format round-trips without losing fields

    // Arrange
    const books = [
      makeBook({ id: '1', rating: 4, memo: 'たのしい', returned: true }),
      makeBook({ id: '2', volume: '18巻1号', thumbnail: 'https://example.com/a.jpg' }),
    ];

    // Act
    const result = parseBackup(serializeBackup(books, '2026-11-15'));

    // Assert
    expect(result).toEqual(books);
  });

  it('when a backup is serialized, it should carry the app id, version and date', () => {
    // Verifies the wrapper that lets the importer recognise its own files

    // Act
    const data = JSON.parse(serializeBackup([], '2026-11-15'));

    // Assert
    expect(data).toEqual({ app: 'ehon-tracker', version: 1, exportedAt: '2026-11-15', books: [] });
  });
});

describe('parseBackup', () => {
  it('when given a bare array of books, it should accept it', () => {
    // Verifies a raw localStorage dump can be restored too

    // Arrange
    const text = JSON.stringify([makeBook({ id: 'x' })]);

    // Act
    const result = parseBackup(text);

    // Assert
    expect(result.map((b) => b.id)).toEqual(['x']);
  });

  it('when optional fields are missing or mistyped, it should fill safe defaults', () => {
    // Verifies older or hand-edited files still produce valid books

    // Arrange
    const text = JSON.stringify([
      { id: '1', title: 'ぐりとぐら', borrowedAt: '2024-01-01', dueDate: '2024-01-15', rating: 9 },
      { id: '2', title: 'ノンタン', borrowedAt: '2024-01-01', dueDate: '2024-01-15', rating: -1 },
      { id: '3', title: 'はらぺこ', borrowedAt: '2024-01-01', dueDate: '2024-01-15', isbn: 1 },
    ]);

    // Act
    const [a, b, c] = parseBackup(text);

    // Assert
    expect(a).toEqual({
      id: '1',
      isbn: '',
      title: 'ぐりとぐら',
      authors: '',
      thumbnail: null,
      publisher: '',
      description: '',
      borrowedAt: '2024-01-01',
      dueDate: '2024-01-15',
      returned: false,
      rating: 5,
      memo: '',
    });
    expect(b.rating).toBe(0);
    expect(c.rating).toBe(0);
    expect(c.isbn).toBe('');
    expect(a).not.toHaveProperty('volume');
  });

  it.each([
    ['not JSON', 'not-json{{'],
    ['another app', JSON.stringify({ app: 'other', books: [] })],
    ['a wrapper without books', JSON.stringify({ app: 'ehon-tracker' })],
    ['a primitive', '42'],
    ['a non-object entry', JSON.stringify(['book'])],
    ['an entry without an id', JSON.stringify([{ title: 'a', borrowedAt: 'x', dueDate: 'y' }])],
    ['an entry with an empty title', JSON.stringify([makeBook({ title: '' })])],
    ['a malformed due date', JSON.stringify([makeBook({ dueDate: 'abc' })])],
    ['an impossible borrow date', JSON.stringify([makeBook({ borrowedAt: '2024-02-30' })])],
    ['a non-string due date', JSON.stringify([makeBook({ dueDate: 20240115 as never })])],
    [
      'a newer format version',
      JSON.stringify({ app: 'ehon-tracker', version: 2, exportedAt: '2026-11-15', books: [] }),
    ],
    ['a wrapper without a version', JSON.stringify({ app: 'ehon-tracker', books: [] })],
  ])('when given %s, it should throw InvalidBackupError', (_, text) => {
    // Verifies anything other than a well-formed backup is rejected as a whole

    // Act & Assert
    expect(() => parseBackup(text)).toThrow(InvalidBackupError);
  });
});

describe('mergeBooks', () => {
  it('when the same title was borrowed twice, it should keep both records', () => {
    // Verifies records are matched by id, not by ISBN, so separate loans survive

    // Arrange
    const current = [makeBook({ id: 'april', borrowedAt: '2026-04-01' })];
    const imported = [makeBook({ id: 'october', borrowedAt: '2026-10-01' })];

    // Act
    const result = mergeBooks(current, imported);

    // Assert
    expect(result.map((b) => b.id)).toEqual(['october', 'april']);
  });

  it('when ids overlap, it should replace in place and prepend new books', () => {
    // Verifies import neither duplicates nor drops books already on the device

    // Arrange
    const current = [makeBook({ id: 'a', memo: '' }), makeBook({ id: 'b' })];
    const imported = [makeBook({ id: 'c' }), makeBook({ id: 'a', memo: '更新' })];

    // Act
    const result = mergeBooks(current, imported);

    // Assert
    expect(result.map((b) => b.id)).toEqual(['c', 'a', 'b']);
    expect(result[1].memo).toBe('更新');
  });
});
