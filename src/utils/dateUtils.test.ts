import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { today, addDays, formatDate, daysLeft } from './dateUtils';

// All tests run with TZ=Asia/Tokyo (set in vite.config.ts).
// Base anchor: 2024-01-15T12:00:00.000Z = 2024-01-15T21:00:00+09:00 (JST)
const BASE_TIME = new Date('2024-01-15T12:00:00.000Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(BASE_TIME);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('today', () => {
  it('when called at JST 21:00 on 2024-01-15, it should return "2024-01-15"', () => {
    // Arrange — BASE_TIME is 2024-01-15T21:00 JST

    // Act
    const result = today();

    // Assert
    expect(result).toBe('2024-01-15');
  });

  it('when called at 23:00 UTC (08:00 next day in JST), it should return the JST date', () => {
    // Arrange — UTC 23:00 on Jan 15 = JST 08:00 on Jan 16
    vi.setSystemTime(new Date('2024-01-15T23:00:00.000Z'));

    // Act
    const result = today();

    // Assert — should return JST local date (Jan 16), not UTC date (Jan 15)
    expect(result).toBe('2024-01-16');
  });
});

describe('addDays', () => {
  it('when n is positive, it should return a date n days later', () => {
    // Act
    const result = addDays('2024-01-15', 14);

    // Assert
    expect(result).toBe('2024-01-29');
  });

  it('when n is zero, it should return the same date', () => {
    // Act
    const result = addDays('2024-01-15', 0);

    // Assert
    expect(result).toBe('2024-01-15');
  });

  it('when n crosses a month boundary, it should carry over correctly', () => {
    // Act
    const result = addDays('2024-01-28', 7);

    // Assert
    expect(result).toBe('2024-02-04');
  });

  it('when n is negative, it should return a date n days earlier', () => {
    // Act
    const result = addDays('2024-01-15', -3);

    // Assert
    expect(result).toBe('2024-01-12');
  });
});

describe('formatDate', () => {
  it('when given a valid date string, it should return a Japanese locale formatted string', () => {
    // Act
    const result = formatDate('2024-01-15');

    // Assert
    expect(result).toBe('1月15日');
  });

  it('when given a year-end date, it should format December correctly', () => {
    // Act
    const result = formatDate('2024-12-31');

    // Assert
    expect(result).toBe('12月31日');
  });
});

describe('daysLeft', () => {
  it('when dueDate is today (local midnight), it should return 0', () => {
    // BASE_TIME is JST 2024-01-15 21:00; local today midnight = Jan 15 JST midnight
    // due (Jan 15 JST midnight) - todayMidnight (Jan 15 JST midnight) = 0

    // Act
    const result = daysLeft('2024-01-15');

    // Assert
    expect(result).toBe(0);
  });

  it('when dueDate is tomorrow, it should return 1', () => {
    // Act
    const result = daysLeft('2024-01-16');

    // Assert
    expect(result).toBe(1);
  });

  it('when dueDate is 3 days from now, it should return 3', () => {
    // Act
    const result = daysLeft('2024-01-18');

    // Assert
    expect(result).toBe(3);
  });

  it('when dueDate is in the past, it should return a negative number', () => {
    // due (Jan 10 JST midnight) - todayMidnight (Jan 15 JST midnight) = -5 days

    // Act
    const result = daysLeft('2024-01-10');

    // Assert
    expect(result).toBe(-5);
  });

  it('when called at UTC 23:00 (JST 08:00 next day) and dueDate is the JST next day, it should return 0', () => {
    // Arrange — UTC 23:00 on Jan 15 = JST 08:00 on Jan 16; local today = Jan 16
    vi.setSystemTime(new Date('2024-01-15T23:00:00.000Z'));

    // Act
    const result = daysLeft('2024-01-16');

    // Assert — dueDate matches JST today, so 0 days left (not 1 as UTC-based code would return)
    expect(result).toBe(0);
  });
});
