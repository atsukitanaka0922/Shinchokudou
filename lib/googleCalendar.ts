export const fetchCalendarEvents = async () => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY;
  const calendarId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID;

  const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  return data.items || [];
};
