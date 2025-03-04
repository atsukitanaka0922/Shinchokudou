import { useEffect, useState } from "react";
import { fetchCalendarEvents } from "@/lib/googleCalendar";
import { fetchWeather } from "@/lib/weather";

type Event = {
  id: string;
  summary: string;
};

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [weather, setWeather] = useState({ temp: 0, weather: "" });

  useEffect(() => {
    fetchCalendarEvents().then((data) => {
      setEvents(
        data.map((event: any) => ({
          id: event.id || Math.random().toString(), // ID がない場合は仮の値を設定
          summary: event.summary || "予定なし",
        }))
      );
    });

    fetchWeather().then(setWeather);
  }, []);

  return (
    <div className="p-4 bg-blue-100 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold">📅 今日の予定</h2>
      <ul>
        {events.map((event) => (
          <li key={event.id}>{event.summary}</li>
        ))}
      </ul>

      <h2 className="text-lg font-semibold mt-4">🌤 今日の天気</h2>
      <p>{weather.temp}°C - {weather.weather}</p>
    </div>
  );
}
