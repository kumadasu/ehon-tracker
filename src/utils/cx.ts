/** Joins CSS Modules class names, dropping the falsy ones from `condition && styles.x`. */
export const cx = (...names: (string | false | undefined)[]): string =>
  names.filter(Boolean).join(' ');
