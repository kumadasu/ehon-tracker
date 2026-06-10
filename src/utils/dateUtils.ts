const pad = (n: number) => String(n).padStart(2, '0');

const toLocalDateString = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

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
