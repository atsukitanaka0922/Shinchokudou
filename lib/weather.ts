const API_KEY = "ca476d863f09a22aa9bdcefdf2ba12e9"; // 🔥 自分の API キーに変更
const API_URL = "https://api.openweathermap.org/data/2.5/weather";

type WeatherData = {
  temperature: number;
  description: string;
  humidity: number;
  icon: string;
};

export async function fetchWeather(city: string = "Tokyo", lang: string = "ja"): Promise<WeatherData | null> {
  try {
    const response = await fetch(`${API_URL}?q=${city}&appid=${API_KEY}&units=metric&lang=${lang}`);
    if (!response.ok) throw new Error("天気情報の取得に失敗しました");

    const data = await response.json();
    return {
      temperature: Math.round(data.main.temp), // 🔥 `°C` に変換
      description: data.weather[0].description, // 🔥 日本語の天気説明
      humidity: data.main.humidity, // 🔥 湿度を取得
      icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`, // 🔥 天気アイコン
    };
  } catch (error) {
    console.error("天気 API エラー:", error);
    return null;
  }
}

