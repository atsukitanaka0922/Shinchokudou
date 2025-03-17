/**
 * 天気サービスモジュール
 * 
 * このモジュールは天気データの取得と生成のための機能を提供します。
 * 開発環境では詳細なモックデータを生成し、本番環境では外部APIに接続します。
 */

/**
 * 天気データのインターフェース
 * アプリケーションで使用される詳細な天気情報の定義
 */
export interface WeatherData {
  temperature: number;   // 気温（摂氏）
  humidity: number;      // 湿度（%）
  weather: string;       // 天気の種類 ('sunny', 'cloudy', 'rainy', 'snowy' など)
  description: string;   // 天気の詳細説明
  icon: string;          // 天気アイコンのURL
  city: string;          // 都市名
  isHot: boolean;        // 暑いかどうか (26度以上)
  isCold: boolean;       // 寒いかどうか (10度以下)
  isHumid: boolean;      // 湿度が高いかどうか (70%以上)
  isDry: boolean;        // 湿度が低いかどうか (40%以下)
  isRainy: boolean;      // 雨かどうか
  isOutdoorOK: boolean;  // 外での活動に適しているか
}

/**
 * 日付をシードとした季節に応じたモックの天気データを生成
 * 開発・テスト環境で使用
 */
export const getMockWeatherData = (): WeatherData => {
  // 今日の日付から疑似的なランダム値を生成（同じ日なら同じ値）
  const today = new Date();
  const dateKey = today.toISOString().split('T')[0]; // YYYY-MM-DD形式
  
  // 日付文字列からシードを計算
  const seed = dateKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // 擬似乱数を生成（シードベース）
  const rand = (min: number, max: number) => {
    const x = Math.sin(seed + today.getHours()) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };
  
  // 季節に基づいた温度生成
  const month = today.getMonth(); // 0-11
  let baseTemp, tempVariation;
  
  // 季節ごとの基準温度とバリエーション
  if (month >= 11 || month <= 1) {
    // 冬 (12-2月)
    baseTemp = 5;
    tempVariation = 10;
  } else if (month >= 2 && month <= 4) {
    // 春 (3-5月)
    baseTemp = 15;
    tempVariation = 10;
  } else if (month >= 5 && month <= 8) {
    // 夏 (6-9月)
    baseTemp = 28;
    tempVariation = 8;
  } else {
    // 秋 (10-11月)
    baseTemp = 18;
    tempVariation = 12;
  }
  
  // 温度を生成（季節の基準温度±バリエーション）
  const temperature = baseTemp + rand(-tempVariation, tempVariation);
  
  // 湿度を生成
  let humidity = rand(30, 90);
  
  // 天気を決定（温度と湿度に基づく）
  let weather, description, icon, isRainy, isOutdoorOK;
  
  if (humidity > 75) {
    if (temperature < 2) {
      weather = 'snowy';
      description = '雪';
      icon = 'https://openweathermap.org/img/wn/13d@2x.png';
      isRainy = true;
      isOutdoorOK = false;
    } else {
      weather = 'rainy';
      description = '雨';
      icon = 'https://openweathermap.org/img/wn/09d@2x.png';
      isRainy = true;
      isOutdoorOK = false;
    }
  } else if (humidity > 60) {
    weather = 'cloudy';
    description = '曇り';
    icon = 'https://openweathermap.org/img/wn/03d@2x.png';
    isRainy = false;
    isOutdoorOK = true;
  } else {
    weather = 'sunny';
    description = '晴れ';
    icon = 'https://openweathermap.org/img/wn/01d@2x.png';
    isRainy = false;
    isOutdoorOK = true;
  }
  
  // 天気データを返す
  return {
    temperature,
    humidity,
    weather,
    description,
    icon,
    city: '京都市',
    isHot: temperature >= 26,
    isCold: temperature <= 10,
    isHumid: humidity >= 70,
    isDry: humidity <= 40,
    isRainy,
    isOutdoorOK
  };
};

/**
 * 天気データを取得する関数
 * 将来的には実際の天気APIを呼び出す機能を実装予定
 */
export const getWeatherData = async (): Promise<WeatherData> => {
  try {
    // TODO: 将来的にはここで実際のAPIを呼び出す
    // const API_KEY = process.env.WEATHER_API_KEY;
    // const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Kyoto&appid=${API_KEY}&units=metric&lang=ja`);
    // const data = await response.json();
    // return {
    //   temperature: Math.round(data.main.temp),
    //   ...その他のデータマッピング
    // };
    
    // 開発用モックデータを返す
    return getMockWeatherData();
  } catch (error) {
    console.error('天気データの取得に失敗:', error);
    
    // エラー時のフォールバック
    return {
      temperature: 22,
      humidity: 50,
      weather: 'cloudy',
      description: '曇り (デフォルト)',
      icon: 'https://openweathermap.org/img/wn/03d@2x.png',
      city: '京都市',
      isHot: false,
      isCold: false,
      isHumid: false,
      isDry: false,
      isRainy: false,
      isOutdoorOK: true
    };
  }
};
