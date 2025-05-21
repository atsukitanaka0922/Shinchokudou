/**
 * 統合天気サービスモジュール
 * 
 * アプリケーション全体で一貫した天気情報を提供するための中央サービス
 * 天気データのキャッシュと単一情報源としての役割を果たします
 */

import { create } from 'zustand';

/**
 * 天気データのインターフェース
 * アプリケーションで使用される統一された天気情報の定義
 */
export interface WeatherData {
  temperature: number;   // 気温（摂氏）
  humidity: number;      // 湿度（%）
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'foggy' | 'unknown'; // 天気状態
  description: string;   // 天気の詳細説明
  icon: string;          // 天気アイコンのURL
  isHot: boolean;        // 暑いかどうか (26度以上)
  isCold: boolean;       // 寒いかどうか (10度以下)
  isHumid: boolean;      // 湿度が高いかどうか (70%以上)
  isDry: boolean;        // 湿度が低いかどうか (40%以下)
  isRainy: boolean;      // 雨かどうか
  isOutdoorOK: boolean;  // 外での活動に適しているか
}

/**
 * 天気ストアの状態とアクション定義
 */
interface WeatherState {
  data: WeatherData | null;    // 現在の天気データ
  loading: boolean;            // データ読み込み中フラグ
  lastFetched: number | null;  // 最後にデータを取得した時刻
  fetchWeather: () => Promise<WeatherData>; // 天気データを取得する関数
}

/**
 * 日付をシードとした季節に応じたモックの天気データを生成
 * 開発・テスト環境で使用
 */
const getMockWeatherData = (): WeatherData => {
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
  const humidity = rand(30, 90);
  
  // 天気を決定（温度と湿度に基づく）
  let condition: WeatherData['condition'];
  let description: string;
  let icon: string;
  let isRainy: boolean;
  let isOutdoorOK: boolean;
  
  if (humidity > 75) {
    if (temperature < 2) {
      condition = 'snowy';
      description = '雪';
      icon = '/icons/snowy.png';
      isRainy = true;
      isOutdoorOK = false;
    } else {
      condition = 'rainy';
      description = '雨';
      icon = '/icons/rainy.png';
      isRainy = true;
      isOutdoorOK = false;
    }
  } else if (humidity > 60) {
    condition = 'cloudy';
    description = '曇り';
    icon = '/icons/cloudy.png';
    isRainy = false;
    isOutdoorOK = true;
  } else {
    condition = 'sunny';
    description = '晴れ';
    icon = '/icons/sunny.png';
    isRainy = false;
    isOutdoorOK = true;
  }
  
  // 天気データを返す
  return {
    temperature,
    humidity,
    condition,
    description,
    icon,
    isHot: temperature >= 26,
    isCold: temperature <= 10,
    isHumid: humidity >= 70,
    isDry: humidity <= 40,
    isRainy,
    isOutdoorOK
  };
};

/**
 * 天気管理Zustandストア
 * アプリケーション全体で一貫した天気データを提供
 */
export const useWeatherStore = create<WeatherState>((set, get) => ({
  data: null,
  loading: false,
  lastFetched: null,
  
  /**
   * 天気データを取得（キャッシュ付き）
   * 最後の取得から30分以内のリクエストはキャッシュを使用
   */
  fetchWeather: async () => {
    const { data, lastFetched, loading } = get();
    const now = Date.now();
    
    // 30分（1800000ミリ秒）以内に取得済みで、データがある場合はキャッシュを返す
    if (data && lastFetched && now - lastFetched < 1800000 && !loading) {
      return data;
    }
    
    // 取得中ならフラグを立てる
    set({ loading: true });
    
    try {
      // TODO: 将来的にはここで実際のAPIを呼び出す
      // const API_KEY = process.env.WEATHER_API_KEY;
      // const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Kyoto&appid=${API_KEY}&units=metric&lang=ja`);
      // const apiData = await response.json();
      // const weatherData = {
      //   temperature: Math.round(apiData.main.temp),
      //   ...その他のデータマッピング
      // };
      
      // 開発用モックデータを生成
      const weatherData = getMockWeatherData();
      
      // ストアを更新してキャッシュする
      set({ data: weatherData, lastFetched: now, loading: false });
      return weatherData;
      
    } catch (error) {
      console.error('天気データの取得に失敗:', error);
      
      // エラー時はデフォルトデータを返す
      const defaultData: WeatherData = {
        temperature: 22,
        humidity: 50,
        condition: 'sunny',
        description: '晴れ (デフォルト)',
        icon: '/icons/sunny.png',
        isHot: false,
        isCold: false,
        isHumid: false,
        isDry: false,
        isRainy: false,
        isOutdoorOK: true
      };
      
      set({ data: defaultData, lastFetched: now, loading: false });
      return defaultData;
    }
  }
}));

/**
 * ライブラリに互換性のあるインターフェースを提供するラッパー関数
 * 既存の fetchWeather 関数の使用コードに影響を与えずに統合を可能にする
 */
export async function fetchWeather() {
  return useWeatherStore.getState().fetchWeather();
}

/**
 * 天気と気温に基づいたアクティビティを提案する
 * @param weather 天気データ
 * @returns 推奨・非推奨アクティビティのリスト
 */
export function suggestWeatherBasedActivities(weather: WeatherData): {
  recommended: string[];
  notRecommended: string[];
} {
  const recommended: string[] = [];
  const notRecommended: string[] = [];
  
  // 天気条件に基づく提案
  switch (weather.condition) {
    case 'sunny':
      recommended.push('屋外でのウォーキング', '公園での読書', 'ピクニック');
      if (weather.temperature > 28) {
        recommended.push('水分補給を頻繁に行う', '日焼け止めを塗る');
        notRecommended.push('長時間の屋外活動', '激しい運動');
      }
      break;
      
    case 'cloudy':
      recommended.push('屋外でのジョギング', '自転車での移動', '写真撮影');
      break;
      
    case 'rainy':
      recommended.push('室内での読書', '映画鑑賞', '部屋の掃除', 'オンライン学習');
      notRecommended.push('洗濯物を外に干す', '屋外でのイベント');
      break;
      
    case 'snowy':
      recommended.push('温かい飲み物を飲む', '室内でのエクササイズ', 'プログラミング学習');
      notRecommended.push('車での長距離移動', '薄着での外出');
      break;
      
    case 'stormy':
      recommended.push('家での作業', '料理', '備蓄品の確認');
      notRecommended.push('外出', '電子機器の使用（雷の場合）');
      break;
      
    case 'foggy':
      recommended.push('短距離の散歩', '瞑想', '読書');
      notRecommended.push('車の運転', '自転車');
      break;
      
    default:
      recommended.push('通常の活動');
  }
  
  // 気温に基づく提案
  if (weather.temperature < 10) {
    recommended.push('暖かい服装を心がける', '温かい食事を摂る');
    notRecommended.push('冷たい飲み物の過剰摂取');
  } else if (weather.temperature > 30) {
    recommended.push('こまめな水分補給', '涼しい場所での活動');
    notRecommended.push('長時間の直射日光下での活動', '激しい運動');
  }
  
  // 湿度に基づく提案
  if (weather.humidity > 80) {
    recommended.push('こまめな服の着替え', '除湿機の使用', '軽装での活動');
    notRecommended.push('激しい運動', '長時間の屋外活動');
  } else if (weather.humidity < 40) {
    recommended.push('こまめな水分補給', '保湿ケア');
  }
  
  return { recommended, notRecommended };
}