export const fetchWeather = async () => {
  const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
  const location = process.env.NEXT_PUBLIC_WEATHER_LOCATION;

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();

  return {
    temp: data.main.temp,
    weather: data.weather[0].description,
  };
};
