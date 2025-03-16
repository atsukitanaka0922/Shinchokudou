import { useEffect, useState } from "react";
import { fetchWeather } from "@/lib/weather";
import Image from 'next/image';

export default function Weather() {
  const [weather, setWeather] = useState<{ temperature: number; description: string; humidity: number; icon: string } | null>(null);

  useEffect(() => {
    fetchWeather().then(setWeather);
  }, []);

  if (!weather) return <p className="text-gray-600">天気情報を取得中...</p>;

  return (
    <div className="p-4 rounded-lg shadow-md bg-blue-100 flex items-center">
      {/* 画像パスの問題を回避するために画像の表示方法を変更 */}
      <div className="relative w-12 h-12 mr-2">
        <Image 
          src={weather.icon} 
          alt="天気アイコン"
          width={48}
          height={48}
          className="object-contain"
        />
      </div>
      <div>
        <p className="text-lg font-bold">{weather.description} （京都府京都市）</p>
        <p className="text-md">🌡️ 気温: {weather.temperature}°C</p>
        <p className="text-md">💧 湿度: {weather.humidity}%</p>
      </div>
    </div>
  );
}