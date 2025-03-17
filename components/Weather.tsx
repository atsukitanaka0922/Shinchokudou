/**
 * 天気表示コンポーネント
 * 
 * 現在の天気情報を取得して表示するためのコンポーネント
 * 天気アイコン、温度、湿度などの情報を視覚的に表示します
 */

import { useEffect, useState } from "react";
import { fetchWeather } from "@/lib/weather";
import Image from 'next/image';

/**
 * 天気表示コンポーネント
 * 天気情報をカードスタイルで表示します
 */
export default function Weather() {
  // 天気情報の状態
  const [weather, setWeather] = useState<{ 
    temperature: number; 
    description: string; 
    humidity: number; 
    icon: string 
  } | null>(null);

  // コンポーネントマウント時に天気情報を取得
  useEffect(() => {
    fetchWeather().then(setWeather);
  }, []);

  // データ読み込み中の表示
  if (!weather) return <p className="text-gray-600">天気情報を取得中...</p>;

  return (
    <div className="p-4 rounded-lg shadow-md bg-blue-100 flex items-center">
      {/* 天気アイコン */}
      <div className="relative w-12 h-12 mr-2">
        <Image 
          src={weather.icon} 
          alt="天気アイコン"
          width={48}
          height={48}
          className="object-contain"
        />
      </div>
      
      {/* 天気情報テキスト */}
      <div>
        <p className="text-lg font-bold">{weather.description} （京都府京都市）</p>
        <p className="text-md">🌡️ 気温: {weather.temperature}°C</p>
        <p className="text-md">💧 湿度: {weather.humidity}%</p>
      </div>
    </div>
  );
}