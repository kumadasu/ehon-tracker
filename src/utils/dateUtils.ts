export const today = (): string => new Date().toISOString().split('T')[0];

export const addDays = (date: string, n: number): string => {
  const dt = new Date(date);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().split('T')[0];
};

export const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });

export const daysLeft = (dueDate: string): number =>
  Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
