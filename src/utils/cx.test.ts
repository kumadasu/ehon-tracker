import { describe, it, expect } from 'vitest';
import { cx } from './cx';

describe('cx', () => {
  it('when given several names, it should join them with a space', () => {
    // Verifies the common case of combining a base class with a modifier

    // Act
    const result = cx('card', 'urgent');

    // Assert
    expect(result).toBe('card urgent');
  });

  it('when a name is false, it should drop it', () => {
    // Verifies `condition && styles.x` produces no stray "false" in the class list

    // Act
    const result = cx('card', false, 'truncate');

    // Assert
    expect(result).toBe('card truncate');
  });

  it('when a name is undefined, it should drop it', () => {
    // Verifies a missing CSS Modules class does not become "undefined"

    // Act
    const result = cx('card', undefined);

    // Assert
    expect(result).toBe('card');
  });

  it('when every name is falsy, it should return an empty string', () => {
    // Verifies the result is still a valid className value

    // Act
    const result = cx(false, undefined);

    // Assert
    expect(result).toBe('');
  });
});
