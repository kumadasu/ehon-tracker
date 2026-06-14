const ISBN10_REGEX = /^\d{9}[\dX]$/i;
const ISBN13_REGEX = /^97[89]\d{10}$/;

export const normalizeIsbn = (input: string): string =>
  input
    .trim()
    .replace(/^isbn(-1[03])?[-:\s]*/i, '')
    .replace(/[\s-]/g, '');

const isbn10To13 = (isbn10: string): string => {
  const base = '978' + isbn10.slice(0, 9);
  let sum = 0;
  for (let i = 0; i < base.length; i++) {
    sum += (base.charCodeAt(i) - 48) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return base + checkDigit;
};

// Returns the ISBN-13 string if input is a valid ISBN-10 or ISBN-13 (with optional
// prefix/hyphens), or null if the input cannot be recognized as either format.
export const toIsbn13 = (input: string): string | null => {
  const normalized = normalizeIsbn(input);
  if (ISBN13_REGEX.test(normalized)) return normalized;
  if (ISBN10_REGEX.test(normalized)) return isbn10To13(normalized);
  return null;
};
