import { db } from "./firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { useMoodStore } from "@/store/moodStore";
import { fetchWeather, suggestWeatherBasedActivities, WeatherData } from "./weather";

// AIによるタスク提案機能の実装
export interface SuggestedTask {
  text: string;
  reason: string;
  category: string;
  estimatedTime: number; // 分単位
  priority: 'low' | 'medium' | 'high';
  weatherRelevant?: boolean; // 天気関連のタスクかどうか
}

// ユーザーの過去の行動と天気に基づいたタスク提案を行う
export async function suggestTasks(userId: string): Promise<SuggestedTask[]> {
  try {
    // 現在の天気情報を取得
    const weatherData = await fetchWeather();
    
    // ユーザーの過去のタスクデータを取得
    const userTasksQuery = query(
      collection(db, "tasks"),
      where("userId", "==", userId),
      where("completed", "==", true),
      orderBy("completedAt", "desc"),
      limit(20)
    );
    
    const userTasksSnapshot = await getDocs(userTasksQuery);
    const pastTasks = userTasksSnapshot.docs.map(doc => doc.data());
    
    // 現在の気分状態を取得
    const mood = useMoodStore.getState().mood;
    
    // カテゴリ別の頻度を分析
    const categoryFrequency: Record<string, number> = {};
    pastTasks.forEach(task => {
      const category = extractCategory(task.text);
      categoryFrequency[category] = (categoryFrequency[category] || 0) + 1;
    });
    
    // 最頻出カテゴリを取得
    const topCategories = Object.entries(categoryFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);
    
    // 曜日と時間による推奨タスク
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hourOfDay = now.getHours();
    
    // 天気データに基づく活動提案を取得
    const weatherActivities = suggestWeatherBasedActivities(weatherData);
    
    // 気分、時間帯、天気に応じたタスク提案
    const standardSuggestions = generateStandardSuggestions(
      mood, 
      dayOfWeek, 
      hourOfDay, 
      topCategories
    );
    
    // 天気に基づくタスク提案を生成
    const weatherSuggestions = generateWeatherBasedSuggestions(
      weatherData,
      weatherActivities,
      mood
    );
    
    // 標準タスクと天気関連タスクを組み合わせる（重複を避ける）
    const allSuggestions = [...standardSuggestions, ...weatherSuggestions];
    const uniqueSuggestions = removeDuplicates(allSuggestions);
    
    // 最大7つのタスクを返す（少なくとも1つは天気関連タスク）
    const finalSuggestions = ensureWeatherTaskIncluded(uniqueSuggestions).slice(0, 7);
    
    return finalSuggestions;
  } catch (error) {
    console.error("タスク提案の生成に失敗:", error);
    return getDefaultSuggestions();
  }
}

// テキストからカテゴリを抽出する簡易関数
function extractCategory(text: string): string {
  const categories = [
    { keywords: ['勉強', '学習', '読書', '本', 'レポート', 'テスト'], category: '学習' },
    { keywords: ['会議', 'ミーティング', '電話', 'メール', '連絡', '打ち合わせ'], category: '仕事' },
    { keywords: ['掃除', '洗濯', '買い物', '料理', '食事', '片付け'], category: '家事' },
    { keywords: ['運動', 'トレーニング', 'ジム', 'ランニング', 'ウォーキング'], category: '運動' },
    { keywords: ['映画', 'ゲーム', '音楽', '旅行', 'カフェ', 'レストラン'], category: '趣味' }
  ];
  
  for (const item of categories) {
    if (item.keywords.some(keyword => text.includes(keyword))) {
      return item.category;
    }
  }
  
  return '一般';
}

// 気分や時間帯に応じた標準タスク提案を生成
function generateStandardSuggestions(
  mood: string, 
  dayOfWeek: number, 
  hourOfDay: number,
  frequentCategories: string[]
): SuggestedTask[] {
  const suggestions: SuggestedTask[] = [];
  
  // 気分別のタスク提案
  if (mood === '元気') {
    suggestions.push({
      text: '30分間の高強度インターバルトレーニング',
      reason: '今日は元気なので、効率的な運動がおすすめです',
      category: '運動',
      estimatedTime: 30,
      priority: 'medium'
    });
    suggestions.push({
      text: '難しいタスクに挑戦する',
      reason: '集中力が高い今がチャンスです',
      category: '仕事',
      estimatedTime: 60,
      priority: 'high'
    });
  } else if (mood === '普通') {
    suggestions.push({
      text: '1時間の集中作業',
      reason: '今日はバランスのとれた1日です',
      category: '仕事',
      estimatedTime: 60,
      priority: 'medium'
    });
    suggestions.push({
      text: '15分間のストレッチ',
      reason: '適度な休憩で効率アップ',
      category: '健康',
      estimatedTime: 15,
      priority: 'low'
    });
  } else if (mood === '疲れた') {
    suggestions.push({
      text: '15分間の瞑想',
      reason: '心身をリラックスさせましょう',
      category: '健康',
      estimatedTime: 15,
      priority: 'medium'
    });
    suggestions.push({
      text: '軽い読書',
      reason: '無理なく気分転換できます',
      category: '趣味',
      estimatedTime: 30,
      priority: 'low'
    });
  }
  
  // 時間帯によるタスク提案
  if (hourOfDay >= 5 && hourOfDay < 10) {
    // 朝
    suggestions.push({
      text: '今日の計画を立てる',
      reason: '朝は計画を立てるのに最適な時間です',
      category: '計画',
      estimatedTime: 15,
      priority: 'high'
    });
  } else if (hourOfDay >= 10 && hourOfDay < 15) {
    // 昼
    suggestions.push({
      text: '重要な作業に取り組む',
      reason: '昼間は集中力が高まる時間帯です',
      category: '仕事',
      estimatedTime: 90,
      priority: 'high'
    });
  } else if (hourOfDay >= 15 && hourOfDay < 19) {
    // 夕方
    suggestions.push({
      text: '今日の振り返りをする',
      reason: '一日の成果を確認しましょう',
      category: '振り返り',
      estimatedTime: 15,
      priority: 'medium'
    });
  } else {
    // 夜
    suggestions.push({
      text: '明日の準備をする',
      reason: '明日の朝をスムーズにスタートするための準備',
      category: '準備',
      estimatedTime: 20,
      priority: 'medium'
    });
  }
  
  // 頻出カテゴリに基づいた提案
  if (frequentCategories.includes('学習')) {
    suggestions.push({
      text: '30分間の新しいスキル学習',
      reason: '継続的な学習習慣を維持しましょう',
      category: '学習',
      estimatedTime: 30,
      priority: 'medium'
    });
  }
  
  if (frequentCategories.includes('仕事')) {
    suggestions.push({
      text: 'メールの整理と返信',
      reason: '溜まったメールを整理しましょう',
      category: '仕事',
      estimatedTime: 20,
      priority: 'high'
    });
  }
  
  return suggestions;
}

// 天気データに基づくタスク提案を生成
function generateWeatherBasedSuggestions(
  weather: WeatherData,
  activities: { recommended: string[]; notRecommended: string[] },
  mood: string
): SuggestedTask[] {
  const suggestions: SuggestedTask[] = [];
  const { condition, temperature, humidity } = weather;
  
  // 天気条件に基づくタスク
  switch (condition) {
    case 'sunny':
      if (temperature > 20) {
        suggestions.push({
          text: '屋外でのウォーキング (30分)',
          reason: `晴れた日は外での活動に最適です (気温: ${temperature}°C)`,
          category: '運動',
          estimatedTime: 30,
          priority: 'medium',
          weatherRelevant: true
        });
      }
      
      if (temperature > 25) {
        suggestions.push({
          text: '日焼け止めを塗る',
          reason: `気温が高いため、UV対策が必要です (気温: ${temperature}°C)`,
          category: '健康',
          estimatedTime: 5,
          priority: 'high',
          weatherRelevant: true
        });
        
        suggestions.push({
          text: '十分な水分補給',
          reason: `暑い日は脱水症状に注意しましょう (気温: ${temperature}°C)`,
          category: '健康',
          estimatedTime: 5,
          priority: 'high',
          weatherRelevant: true
        });
      }
      
      if (mood !== '疲れた') {
        suggestions.push({
          text: '洗濯物を干す',
          reason: '晴れの日は洗濯物が乾きやすいです',
          category: '家事',
          estimatedTime: 15,
          priority: 'medium',
          weatherRelevant: true
        });
      }
      break;
      
    case 'cloudy':
      suggestions.push({
        text: '屋外での軽い運動',
        reason: '曇りの日は日差しが強くないので外での活動に適しています',
        category: '運動',
        estimatedTime: 30,
        priority: 'medium',
        weatherRelevant: true
      });
      
      if (temperature < 20) {
        suggestions.push({
          text: '温かい飲み物を飲む',
          reason: `肌寒い曇り空の日には、温かい飲み物がおすすめです (気温: ${temperature}°C)`,
          category: '健康',
          estimatedTime: 10,
          priority: 'low',
          weatherRelevant: true
        });
      }
      break;
      
    case 'rainy':
      suggestions.push({
        text: '室内での読書タイム',
        reason: '雨の日は室内で過ごすのに最適です',
        category: '趣味',
        estimatedTime: 30,
        priority: 'low',
        weatherRelevant: true
      });
      
      suggestions.push({
        text: '傘を持ち歩く',
        reason: '今日は雨なので、外出時には傘をお忘れなく',
        category: '準備',
        estimatedTime: 2,
        priority: 'high',
        weatherRelevant: true
      });
      
      if (humidity > 80) {
        suggestions.push({
          text: '部屋の換気と除湿',
          reason: `湿度が高いため (${humidity}%)、カビ対策として換気をしましょう`,
          category: '家事',
          estimatedTime: 10,
          priority: 'medium',
          weatherRelevant: true
        });
      }
      break;
      
    case 'snowy':
      suggestions.push({
        text: '暖かい服装で過ごす',
        reason: `雪の日は体温管理が重要です (気温: ${temperature}°C)`,
        category: '健康',
        estimatedTime: 5,
        priority: 'high',
        weatherRelevant: true
      });
      
      suggestions.push({
        text: '室内での創作活動',
        reason: '雪の日は家でクリエイティブな時間を過ごしましょう',
        category: '趣味',
        estimatedTime: 60,
        priority: 'medium',
        weatherRelevant: true
      });
      break;
      
    case 'stormy':
      suggestions.push({
        text: '防災グッズの確認',
        reason: '嵐の日は安全対策として防災準備を確認しましょう',
        category: '安全',
        estimatedTime: 15,
        priority: 'high',
        weatherRelevant: true
      });
      
      suggestions.push({
        text: '非常食・飲料水のチェック',
        reason: '悪天候時は備蓄品を確認しておくと安心です',
        category: '安全',
        estimatedTime: 10,
        priority: 'medium',
        weatherRelevant: true
      });
      
      suggestions.push({
        text: '屋内での作業を進める',
        reason: '嵐の日は外出を避け、家での作業に集中しましょう',
        category: '仕事',
        estimatedTime: 120,
        priority: 'high',
        weatherRelevant: true
      });
      break;
      
    case 'foggy':
      suggestions.push({
        text: '運転を控える',
        reason: '霧の日は視界が悪いため、可能であれば運転は避けましょう',
        category: '安全',
        estimatedTime: 0,
        priority: 'high',
        weatherRelevant: true
      });
      
      suggestions.push({
        text: '静かな瞑想時間',
        reason: '霧の静けさは瞑想や内省に最適です',
        category: '健康',
        estimatedTime: 20,
        priority: 'low',
        weatherRelevant: true
      });
      break;
  }
  
  // 気温に基づく共通タスク
  if (temperature < 10) {
    suggestions.push({
      text: '暖房の設定確認',
      reason: `気温が低いため (${temperature}°C)、室内を快適に保ちましょう`,
      category: '家事',
      estimatedTime: 5,
      priority: 'medium',
      weatherRelevant: true
    });
    
    suggestions.push({
      text: '温かい飲み物を準備',
      reason: `寒い日は温かい飲み物で体を温めましょう (気温: ${temperature}°C)`,
      category: '健康',
      estimatedTime: 10,
      priority: 'medium',
      weatherRelevant: true
    });
  } else if (temperature > 28) {
    suggestions.push({
      text: '冷房の設定確認',
      reason: `気温が高いため (${temperature}°C)、室内を快適に保ちましょう`,
      category: '家事',
      estimatedTime: 5,
      priority: 'medium',
      weatherRelevant: true
    });
    
    suggestions.push({
      text: '冷たい飲み物を準備',
      reason: `暑い日は冷たい飲み物で体を冷やしましょう (気温: ${temperature}°C)`,
      category: '健康',
      estimatedTime: 10,
      priority: 'medium',
      weatherRelevant: true
    });
  }
  
  // 湿度に基づく共通タスク
  if (humidity > 75) {
    suggestions.push({
      text: '除湿機の使用',
      reason: `湿度が高いため (${humidity}%)、室内の湿度管理をしましょう`,
      category: '家事',
      estimatedTime: 5,
      priority: 'medium',
      weatherRelevant: true
    });
    
    if (mood !== '疲れた') {
      suggestions.push({
        text: '部屋の換気',
        reason: `湿度が高いため (${humidity}%)、カビ予防に換気が重要です`,
        category: '家事',
        estimatedTime: 10,
        priority: 'medium',
        weatherRelevant: true
      });
    }
  } else if (humidity < 40) {
    suggestions.push({
      text: '加湿器の使用',
      reason: `湿度が低いため (${humidity}%)、乾燥対策をしましょう`,
      category: '家事',
      estimatedTime: 5,
      priority: 'medium',
      weatherRelevant: true
    });
    
    suggestions.push({
      text: '水分補給の増加',
      reason: `乾燥しているため (湿度: ${humidity}%)、意識的に水分を摂りましょう`,
      category: '健康',
      estimatedTime: 5,
      priority: 'medium',
      weatherRelevant: true
    });
  }
  
  // 天気に基づく活動提案からタスクを生成
  activities.recommended.forEach((activity, index) => {
    if (index < 2) { // 最大2つまで追加
      suggestions.push({
        text: activity,
        reason: `今日の天気 (${weather.description}, ${temperature}°C) に最適な活動です`,
        category: determineCategory(activity),
        estimatedTime: 30, // デフォルト値
        priority: 'medium',
        weatherRelevant: true
      });
    }
  });
  
  // 避けるべき活動も忠告として追加
  if (activities.notRecommended.length > 0) {
    const activity = activities.notRecommended[0];
    suggestions.push({
      text: `${activity}を避ける`,
      reason: `今日の天気 (${weather.description}, ${temperature}°C) では注意が必要です`,
      category: '安全',
      estimatedTime: 0,
      priority: 'high',
      weatherRelevant: true
    });
  }
  
  return suggestions;
}

// 活動の内容からカテゴリを判定する補助関数
function determineCategory(activity: string): string {
  const categoryKeywords = [
    { keywords: ['読書', '勉強', '学習'], category: '学習' },
    { keywords: ['会議', 'メール', '仕事', '作業'], category: '仕事' },
    { keywords: ['掃除', '洗濯', '料理', '片付け', '整理'], category: '家事' },
    { keywords: ['運動', 'ジョギング', 'ウォーキング', '散歩'], category: '運動' },
    { keywords: ['瞑想', '休憩', 'リラックス', '睡眠'], category: '健康' },
    { keywords: ['映画', '音楽', 'ゲーム', '趣味'], category: '趣味' },
    { keywords: ['確認', '準備', '計画'], category: '準備' }
  ];
  
  for (const item of categoryKeywords) {
    if (item.keywords.some(keyword => activity.includes(keyword))) {
      return item.category;
    }
  }
  
  return '一般';
}

// 重複するタスク提案を除去する関数
function removeDuplicates(tasks: SuggestedTask[]): SuggestedTask[] {
  const uniqueTasks: SuggestedTask[] = [];
  const textSet = new Set<string>();
  
  for (const task of tasks) {
    // 簡易的な重複チェック（タスクテキストが似ている場合）
    const simplifiedText = task.text.toLowerCase().replace(/\s+/g, ' ').trim();
    
    if (!textSet.has(simplifiedText)) {
      textSet.add(simplifiedText);
      uniqueTasks.push(task);
    }
  }
  
  return uniqueTasks;
}

// 天気関連タスクが少なくとも1つ含まれるようにする関数
function ensureWeatherTaskIncluded(tasks: SuggestedTask[]): SuggestedTask[] {
  const weatherTasks = tasks.filter(task => task.weatherRelevant);
  const otherTasks = tasks.filter(task => !task.weatherRelevant);
  
  // 天気関連タスクがない場合、デフォルトの天気タスクを追加
  if (weatherTasks.length === 0) {
    return [...otherTasks, {
      text: '天気予報を確認する',
      reason: '今日の天気に合わせた計画を立てましょう',
      category: '準備',
      estimatedTime: 5,
      priority: 'medium',
      weatherRelevant: true
    }];
  }
  
  // 天気関連タスクを優先的に表示（優先度の高いものから最大3つ）
  const sortedWeatherTasks = [...weatherTasks].sort((a, b) => {
    const priorityValues = { 'high': 3, 'medium': 2, 'low': 1 };
    return priorityValues[b.priority] - priorityValues[a.priority];
  }).slice(0, 3);
  
  // 他のタスクと組み合わせて返す
  return [...sortedWeatherTasks, ...otherTasks];
}

// デフォルトの提案（APIやデータ取得に失敗した場合のフォールバック）
function getDefaultSuggestions(): SuggestedTask[] {
  return [
    {
      text: '今日のタスクの優先順位を決める',
      reason: '計画を立てることで効率的に作業できます',
      category: '計画',
      estimatedTime: 15,
      priority: 'high'
    },
    {
      text: '15分間の休憩を取る',
      reason: '適度な休憩は生産性を向上させます',
      category: '健康',
      estimatedTime: 15,
      priority: 'medium'
    },
    {
      text: '水分補給をする',
      reason: '水分補給は集中力維持に重要です',
      category: '健康',
      estimatedTime: 5,
      priority: 'low'
    }
  ];
}