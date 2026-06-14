import { describe, it, expect } from 'vitest';
import { normalizeIsbn, toIsbn13 } from './isbn';

describe('normalizeIsbn', () => {
  it('when input has "ISBN4-" prefix with hyphens, it should strip them and return digits only', () => {
    // Arrange / Act
    const result = normalizeIsbn('ISBN4-251-03035-4');
    // Assert
    expect(result).toBe('4251030354');
  });

  it('when input has "isbn:" prefix, it should strip it', () => {
    // Arrange / Act
    const result = normalizeIsbn('isbn:9784001140309');
    // Assert
    expect(result).toBe('9784001140309');
  });

  it('when input has "ISBN-13: " prefix with hyphens, it should return digits only', () => {
    // Arrange / Act
    const result = normalizeIsbn('ISBN-13: 978-4-00-114030-9');
    // Assert
    expect(result).toBe('9784001140309');
  });

  it('when input has hyphens but no prefix, it should strip the hyphens', () => {
    // Arrange / Act
    const result = normalizeIsbn('978-4-00-114030-9');
    // Assert
    expect(result).toBe('9784001140309');
  });

  it('when input has leading and trailing whitespace, it should trim them', () => {
    // Arrange / Act
    const result = normalizeIsbn('  9784001140309  ');
    // Assert
    expect(result).toBe('9784001140309');
  });
});

describe('toIsbn13', () => {
  it('when input is a valid ISBN-13, it should return it as-is', () => {
    // Arrange / Act
    const result = toIsbn13('9784001140309');
    // Assert
    expect(result).toBe('9784001140309');
  });

  it('when input is an ISBN-13 with hyphens, it should return the normalized ISBN-13', () => {
    // Arrange / Act
    const result = toIsbn13('978-4-00-114030-9');
    // Assert
    expect(result).toBe('9784001140309');
  });

  it('when input is "ISBN4-251-03035-4", it should convert to ISBN-13 "9784251030351"', () => {
    // Arrange / Act
    const result = toIsbn13('ISBN4-251-03035-4');
    // Assert
    expect(result).toBe('9784251030351');
  });

  it('when input is a bare ISBN-10 without prefix, it should convert to ISBN-13', () => {
    // Arrange / Act
    const result = toIsbn13('4251030354');
    // Assert
    expect(result).toBe('9784251030351');
  });

  it('when input is an ISBN-10 with hyphens but no prefix, it should convert to ISBN-13', () => {
    // Arrange / Act
    const result = toIsbn13('4-251-03035-4');
    // Assert
    expect(result).toBe('9784251030351');
  });

  it('when input is too short to be an ISBN, it should return null', () => {
    // Arrange / Act
    const result = toIsbn13('12345');
    // Assert
    expect(result).toBeNull();
  });

  it('when input contains non-numeric characters in invalid positions, it should return null', () => {
    // Arrange / Act
    const result = toIsbn13('invalid-isbn');
    // Assert
    expect(result).toBeNull();
  });
});
