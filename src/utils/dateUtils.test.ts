import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { today, addDays, formatDate, daysLeft } from './dateUtils';

// Base anchor: 2024-01-15T12:00:00.000Z (UTC noon, safely within Jan 15 in any timezone)
const BASE_TIME = new Date('2024-01-15T12:00:00.000Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(BASE_TIME);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('today', () => {
  it('when called at UTC noon on 2024-01-15, it should return "2024-01-15"', () => {
    // Verifies that today() returns the UTC date portion from toISOString()

    // Act
    const result = today();

    // Assert
    expect(result).toBe('2024-01-15');
  });

  it('when called at 23:00 UTC (next day in JST), it should return the UTC date not the JST date', () => {
    // Known limitation: today() uses toISOString() (UTC), so JST users after 15:00 UTC
    // (midnight JST) will see yesterday's date. This test documents the current behavior.

    // Arrange
    vi.setSystemTime(new Date('2024-01-15T23:00:00.000Z')); // JST = 2024-01-16T08:00

    // Act
    const result = today();

    // Assert — returns UTC date, not JST date
    expect(result).toBe('2024-01-15');
  });
});

describe('addDays', () => {
  it('when n is positive, it should return a date n days later', () => {
    // Verifies basic day addition

    // Act
    const result = addDays('2024-01-15', 14);

    // Assert
    expect(result).toBe('2024-01-29');
  });

  it('when n is zero, it should return the same date', () => {
    // Verifies identity case

    // Act
    const result = addDays('2024-01-15', 0);

    // Assert
    expect(result).toBe('2024-01-15');
  });

  it('when n crosses a month boundary, it should carry over correctly', () => {
    // Verifies JavaScript setDate() handles month overflow automatically

    // Act
    const result = addDays('2024-01-28', 7);

    // Assert
    expect(result).toBe('2024-02-04');
  });

  it('when n is negative, it should return a date n days earlier', () => {
    // Verifies that negative values subtract days (implicit but relied on by callers)

    // Act
    const result = addDays('2024-01-15', -3);

    // Assert
    expect(result).toBe('2024-01-12');
  });
});

describe('formatDate', () => {
  it('when given a valid date string, it should return a Japanese locale formatted string', () => {
    // Verifies ja-JP locale formatting with month (long) and day (numeric)
    // Expected output depends on Node ICU data; "1月15日" on full-ICU builds

    // Act
    const result = formatDate('2024-01-15');

    // Assert
    expect(result).toBe('1月15日');
  });

  it('when given a year-end date, it should format December correctly', () => {
    // Guards against month-boundary issues in locale formatting

    // Act
    const result = formatDate('2024-12-31');

    // Assert
    expect(result).toBe('12月31日');
  });
});

describe('daysLeft', () => {
  it('when dueDate is today (UTC midnight), it should return 0', () => {
    // Math.ceil((Jan-15 00:00 UTC - Jan-15 12:00 UTC) / 86400000) = Math.ceil(-0.5) = -0
    // JavaScript's Math.ceil(-0.5) returns -0 (negative zero); === treats it as 0

    // Act
    const result = daysLeft('2024-01-15');

    // Assert — use === to treat -0 and +0 as equal
    expect(result === 0).toBe(true);
  });

  it('when dueDate is tomorrow, it should return 1', () => {
    // Edge case relevant to the "urgent" threshold in BookCard

    // Act
    const result = daysLeft('2024-01-16');

    // Assert
    expect(result).toBe(1);
  });

  it('when dueDate is 3 days from now, it should return 3', () => {
    // Verifies the boundary for the urgent-flag threshold (left <= 3)

    // Act
    const result = daysLeft('2024-01-18');

    // Assert
    expect(result).toBe(3);
  });

  it('when dueDate is in the past, it should return a negative number', () => {
    // Math.ceil((Jan-10 00:00 UTC - Jan-15 12:00 UTC) / 86400000) = Math.ceil(-5.5) = -5

    // Act
    const result = daysLeft('2024-01-10');

    // Assert
    expect(result).toBe(-5);
  });
});
