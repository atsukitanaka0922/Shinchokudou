import { useEffect, useState } from "react";
import { fetchCalendarEvents } from "@/lib/googleCalendar";

type Event = {
  id: string;
  summary: string;
};

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [weather, setWeather] = useState({ temp: 0, weather: "" });

  useEffect(() => {
    fetchCalendarEvents().then((data: Event[]) => {
      if (!Array.isArray(data)) {
        console.error("Unexpected response format:", data);
        setEvents([]);
        return;
      }
      setEvents(data);
    });
  }, []);

  return (
    <div className="p-4 bg-blue-100 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold">📅 今日の予定</h2>
      {events.length === 0 ? (
        <p className="text-gray-500">予定はありません</p>
      ) : (
        <ul>
          {events.map((event) => (
            <li key={event.id}>{event.summary}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
