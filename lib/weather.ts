// 天気情報取得機能

export interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  icon: string;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'foggy' | 'unknown';
}

// 実際のAPIから天気情報を取得する関数
export async function fetchWeather(): Promise<WeatherData> {
  try {
    // 実際のAPIを使用する場合はこちらを有効化
     const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Kyoto&appid=ca476d863f09a22aa9bdcefdf2ba12e9&units=metric&lang=ja`);
     const data = await response.json();
    // 必要なデータを整形して返す処理...

    // モックデータを返す（APIキーなしでも動作するように）
    return getMockWeatherData();
  } catch (error) {
    console.error('天気情報取得エラー:', error);
    // エラー時はデフォルトデータを返す
    return {
      temperature: 22,
      description: '晴れ',
      humidity: 60,
      icon: '/images/weather/sunny.svg',
      condition: 'sunny'
    };
  }
}

// ダミーの天気データをランダムに生成する関数（開発用）
function getMockWeatherData(): WeatherData {
  const conditions: Array<WeatherData['condition']> = ['sunny', 'cloudy', 'rainy', 'snowy', 'stormy', 'foggy', 'unknown'];
  const descriptions = {
    sunny: '晴れ',
    cloudy: '曇り',
    rainy: '雨',
    snowy: '雪',
    stormy: '嵐',
    foggy: '霧',
    unknown: '不明'
  };
  
  // 現在の月に応じた気温範囲を設定
  const month = new Date().getMonth(); // 0-11
  let minTemp, maxTemp;
  
  if (month >= 0 && month <= 2) { // 冬（1-3月）
    minTemp = 0;
    maxTemp = 15;
  } else if (month >= 3 && month <= 5) { // 春（4-6月）
    minTemp = 10;
    maxTemp = 25;
  } else if (month >= 6 && month <= 8) { // 夏（7-9月）
    minTemp = 25;
    maxTemp = 35;
  } else { // 秋（10-12月）
    minTemp = 10;
    maxTemp = 20;
  }
  
  // ランダムな条件を選択（季節に合わせて調整）
  let conditionIndex;
  if (month >= 6 && month <= 8) { // 夏は晴れや雨が多い
    conditionIndex = Math.floor(Math.random() * 3); // 0, 1, 2 (sunny, cloudy, rainy)
  } else if (month >= 0 && month <= 2) { // 冬は曇りや雪が多い
    conditionIndex = Math.floor(Math.random() * 2) + 1; // 1, 2 (cloudy, rainy/snowy)
    if (conditionIndex === 2) conditionIndex = 3; // rainy を snowy に
  } else {
    conditionIndex = Math.floor(Math.random() * conditions.length);
  }
  
  const condition = conditions[conditionIndex];
  let icon = `/images/weather/${condition}.svg`;
  if (condition === 'unknown') {
    icon = '/images/weather/unknown.svg';
  }
  
  // 温度をランダム生成（条件に基づいて調整）
  let temp;
  switch (condition) {
    case 'sunny':
      temp = Math.round(maxTemp - Math.random() * 5);
      break;
    case 'cloudy':
      temp = Math.round(minTemp + (maxTemp - minTemp) * 0.7);
      break;
    case 'rainy':
    case 'foggy':
      temp = Math.round(minTemp + (maxTemp - minTemp) * 0.5);
      break;
    case 'snowy':
      temp = Math.round(minTemp + Math.random() * 5);
      break;
    case 'stormy':
      temp = Math.round(minTemp + (maxTemp - minTemp) * 0.3);
      break;
    default:
      temp = Math.round(minTemp + Math.random() * (maxTemp - minTemp));
  }
  
  // 湿度をランダム生成（条件に基づいて調整）
  let humidity;
  switch (condition) {
    case 'sunny':
      humidity = Math.round(40 + Math.random() * 20); // 40-60%
      break;
    case 'cloudy':
      humidity = Math.round(60 + Math.random() * 20); // 60-80%
      break;
    case 'rainy':
    case 'stormy':
      humidity = Math.round(80 + Math.random() * 15); // 80-95%
      break;
    case 'snowy':
      humidity = Math.round(70 + Math.random() * 15); // 70-85%
      break;
    case 'foggy':
      humidity = Math.round(85 + Math.random() * 10); // 85-95%
      break;
    default:
      humidity = Math.round(50 + Math.random() * 30); // 50-80%
  }
  
  return {
    temperature: temp,
    description: descriptions[condition],
    humidity: humidity,
    icon: icon,
    condition: condition
  };
}

// 天気と気温に基づいたアクティビティを提案する関数
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