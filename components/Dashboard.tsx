import { useEffect, useState } from "react";
import { fetchCalendarEvents } from "@/lib/googleCalendar";
import { fetchWeather } from "@/lib/weather";

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [weather, setWeather] = useState({ temp: 0, weather: "" });

  useEffect(() => {
    fetchCalendarEvents().then(setEvents);
    fetchWeather().then(setWeather);
  }, []);

  return (
    <div className="p-4 bg-blue-100 rounded-lg shadow-md">
      <h2>📅 今日の予定</h2>
      <ul>{events.map((event) => <li key={event.id}>{event.summary}</li>)}</ul>
      <h2>🌤 今日の天気</h2>
      <p>{weather.temp}°C - {weather.weather}</p>
    </div>
  );
}
