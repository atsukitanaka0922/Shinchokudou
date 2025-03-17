export const fetchCalendarEvents = async (): Promise<{ id: string; summary: string }[]> => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY;
  const calendarId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID;

  const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.items || !Array.isArray(data.items)) {
      console.error("Invalid API response:", data);
      return [];
    }

    return data.items.map((event: any) => ({
      id: event.id || Math.random().toString(),
      summary: event.summary || "予定なし",
    }));
  } catch (error) {
    console.error("Failed to fetch calendar events:", error);
    return [];
  }
};
