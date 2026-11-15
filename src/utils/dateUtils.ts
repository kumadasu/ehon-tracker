const pad = (n: number) => String(n).padStart(2, '0');

const toLocalDateString = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** True for a `YYYY-MM-DD` string naming a real calendar day (rejects 2024-02-30). */
export const isValidDate = (v: unknown): v is string => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

export const today = (): string => toLocalDateString(new Date());

export const addDays = (date: string, n: number): string => {
  const [y, m, d] = date.split('-').map(Number);
  return toLocalDateString(new Date(y, m - 1, d + n));
};

export const formatDate = (date: string): string => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });
};

export const daysLeft = (dueDate: string): number => {
  const [y, m, d] = dueDate.split('-').map(Number);
  const due = new Date(y, m - 1, d).getTime();
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.ceil((due - todayMidnight) / 86400000);
};
