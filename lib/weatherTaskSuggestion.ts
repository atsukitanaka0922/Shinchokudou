import { WeatherData } from './weatherService';
import { SuggestedTask } from './aiTaskSuggestion';

// 天気に基づくタスク提案を生成する関数
export function generateWeatherBasedTasks(weatherData: WeatherData): SuggestedTask[] {
  const suggestions: SuggestedTask[] = [];
  
  // 雨の日の提案
  if (weatherData.isRainy) {
    suggestions.push({
      text: '室内の整理整頓をする',
      reason: `${weatherData.description}の日は室内作業に最適です`,
      category: '家事',
      estimatedTime: 45,
      priority: 'medium'
    });
    
    suggestions.push({
      text: '読書をする',
      reason: `${weatherData.description}の日に読書で過ごしませんか`,
      category: '趣味',
      estimatedTime: 60,
      priority: 'low'
    });
  }
  
  // 晴れの日の提案
  if (weatherData.weather === 'sunny' && weatherData.isOutdoorOK) {
    suggestions.push({
      text: '30分のウォーキング',
      reason: `${weatherData.description}の日は外での活動に最適です`,
      category: '運動',
      estimatedTime: 30,
      priority: 'medium'
    });
  }
  
  // 暑い日の提案
  if (weatherData.isHot) {
    suggestions.push({
      text: '水分補給の記録',
      reason: `気温${weatherData.temperature}℃と暑いので、水分補給を忘れずに`,
      category: '健康',
      estimatedTime: 5,
      priority: 'high'
    });
    
    suggestions.push({
      text: '涼しい場所での作業',
      reason: `暑さ対策として、冷房の効いた場所での作業がおすすめです`,
      category: '生産性',
      estimatedTime: 120,
      priority: 'medium'
    });
  }
  
  // 寒い日の提案
  if (weatherData.isCold) {
    suggestions.push({
      text: '温かい飲み物を準備する',
      reason: `気温${weatherData.temperature}℃と寒いので、温かい飲み物で体を温めましょう`,
      category: '健康',
      estimatedTime: 10,
      priority: 'medium'
    });
  }
  
  // 湿度が高い日の提案
  if (weatherData.isHumid) {
    suggestions.push({
      text: '室内の換気をする',
      reason: `湿度${weatherData.humidity}%と高いので、カビ予防のために換気が重要です`,
      category: '家事',
      estimatedTime: 15,
      priority: 'medium'
    });
    
    suggestions.push({
      text: '洗濯物の管理',
      reason: `湿度が高いので、洗濯物の乾燥に注意が必要です`,
      category: '家事',
      estimatedTime: 20,
      priority: weatherData.isRainy ? 'high' : 'medium'
    });
  }
  
  // 湿度が低い日の提案
  if (weatherData.isDry) {
    suggestions.push({
      text: '加湿器の確認/使用',
      reason: `湿度${weatherData.humidity}%と低いので、乾燥対策が重要です`,
      category: '健康',
      estimatedTime: 5,
      priority: 'low'
    });
    
    suggestions.push({
      text: '水分を多めに摂る',
      reason: `乾燥している日は意識的に水分補給を`,
      category: '健康',
      estimatedTime: 5,
      priority: 'medium'
    });
  }
  
  // 良い天気の日の外出提案
  if (weatherData.isOutdoorOK && !weatherData.isRainy && !weatherData.isHot && !weatherData.isCold) {
    suggestions.push({
      text: '公園でのピクニック',
      reason: `最高の天気です！外での活動を楽しみましょう`,
      category: '趣味',
      estimatedTime: 120,
      priority: 'low'
    });
  }
  
  // 天気に関わらない一般的な提案
  suggestions.push({
    text: '今日の天気を確認する',
    reason: `${weatherData.description}、${weatherData.temperature}℃、湿度${weatherData.humidity}%です`,
    category: '計画',
    estimatedTime: 5,
    priority: 'low'
  });
  
  return suggestions;
}