import type { Book } from '../types';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

export interface CalendarResult {
  success: boolean;
  eventId?: string;
  error?: string;
}

// Create a return-due event on the user's primary Google Calendar
export const addReturnEvent = async (book: Book, accessToken: string): Promise<CalendarResult> => {
  const event = {
    summary: `📚 返却期限：${book.title}`,
    description: `図書館の絵本の返却期限です。\nISBN: ${book.isbn}`,
    start: { date: book.dueDate },
    end: { date: book.dueDate },
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: 60 * 9 }], // 9 AM reminder
    },
  };

  const res = await fetch(CALENDAR_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return {
      success: false,
      error: (err as { error?: { message?: string } }).error?.message ?? 'Calendar API error',
    };
  }

  const data = (await res.json()) as { id: string };
  return { success: true, eventId: data.id };
};
