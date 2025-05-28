/**
 * AI習慣提案モジュール
 * 
 * ユーザーの既存習慣、タスク履歴、時間帯などを分析して
 * パーソナライズされた習慣を提案する機能
 * v1.6.1: 習慣タスク機能の実装
 */

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { HabitSuggestion, HabitFrequency } from '@/lib/habitInterfaces';
import { fetchWeather } from '@/lib/weatherService';

/**
 * 基本的な習慣テンプレート
 */
const BASE_HABIT_TEMPLATES: HabitSuggestion[] = [
  // 健康・運動系
  {
    title: '毎朝10分間のストレッチ',
    description: '体を柔軟にし、一日を活動的に始めましょう',
    frequency: 'daily',
    reminderTime: '07:00',
    reason: '朝のストレッチは血行を促進し、エネルギーレベルを向上させます',
    category: '健康・運動',
    priority: 'high'
  },
  {
    title: '毎日30分のウォーキング',
    description: '有酸素運動で心身の健康を維持',
    frequency: 'daily',
    reminderTime: '18:00',
    reason: '定期的な有酸素運動は心血管系の健康に重要です',
    category: '健康・運動',
    priority: 'high'
  },
  {
    title: '週3回の筋力トレーニング',
    description: '筋肉量維持と基礎代謝向上のために',
    frequency: 'weekly',
    targetDays: [1, 3, 5], // 月、水、金
    reminderTime: '19:00',
    reason: '筋力トレーニングは骨密度と筋肉量の維持に効果的です',
    category: '健康・運動',
    priority: 'medium'
  },

  // 学習・自己啓発系
  {
    title: '毎日20分間の読書',
    description: '知識の蓄積と集中力の向上',
    frequency: 'daily',
    reminderTime: '21:00',
    reason: '読書は認知機能の向上と語彙力の増加に効果的です',
    category: '学習・自己啓発',
    priority: 'high'
  },
  {
    title: '語学学習（15分）',
    description: '新しい言語スキルの習得',
    frequency: 'daily',
    reminderTime: '20:00',
    reason: '短時間でも継続的な学習が言語習得の鍵です',
    category: '学習・自己啓発',
    priority: 'medium'
  },
  {
    title: '週1回のスキルアップ学習',
    description: '仕事や趣味に関する新しいスキルを学習',
    frequency: 'weekly',
    targetDays: [0], // 日曜日
    reminderTime: '14:00',
    reason: 'まとまった時間での学習は深い理解につながります',
    category: '学習・自己啓発',
    priority: 'medium'
  },

  // メンタルヘルス系
  {
    title: '毎日5分間の瞑想',
    description: 'マインドフルネスでストレス軽減',
    frequency: 'daily',
    reminderTime: '22:00',
    reason: '瞑想は不安軽減と集中力向上に効果的です',
    category: 'メンタルヘルス',
    priority: 'high'
  },
  {
    title: '感謝日記を書く',
    description: '1日3つの感謝できることを記録',
    frequency: 'daily',
    reminderTime: '22:30',
    reason: '感謝の習慣は幸福感と人生満足度を向上させます',
    category: 'メンタルヘルス',
    priority: 'medium'
  },
  {
    title: '週1回の自己振り返り',
    description: '1週間の成果と改善点を振り返る',
    frequency: 'weekly',
    targetDays: [0], // 日曜日
    reminderTime: '19:00',
    reason: '定期的な振り返りは自己認識と成長を促進します',
    category: 'メンタルヘルス',
    priority: 'medium'
  },

  // 生活習慣系
  {
    title: '毎日2リットルの水分摂取',
    description: '適切な水分補給で健康維持',
    frequency: 'daily',
    reminderTime: '10:00',
    reason: '十分な水分摂取は体調管理の基本です',
    category: '生活習慣',
    priority: 'high'
  },
  {
    title: '毎日のデスク整理',
    description: '作業環境を整えて生産性向上',
    frequency: 'daily',
    reminderTime: '17:30',
    reason: '整理された環境は集中力と効率性を向上させます',
    category: '生活習慣',
    priority: 'medium'
  },
  {
    title: '週2回の部屋の掃除',
    description: '清潔な生活環境の維持',
    frequency: 'weekly',
    targetDays: [3, 6], // 水、土
    reminderTime: '16:00',
    reason: '清潔な環境は精神的な安定とリラックスに効果的です',
    category: '生活習慣',
    priority: 'low'
  },

  // 人間関係系
  {
    title: '家族・友人への連絡',
    description: '大切な人との関係を維持',
    frequency: 'weekly',
    targetDays: [0], // 日曜日
    reminderTime: '15:00',
    reason: '定期的なコミュニケーションは人間関係の質を向上させます',
    category: '人間関係',
    priority: 'medium'
  },
  {
    title: '月1回のスキルシェア',
    description: '知識や経験を他者と共有',
    frequency: 'monthly',
    targetDays: [15],
    reminderTime: '19:00',
    reason: '知識の共有は自己成長と他者貢献の両方を実現します',
    category: '人間関係',
    priority: 'low'
  }
];

/**
 * 時間帯に基づく習慣提案
 */
const getTimeBasedSuggestions = (): HabitSuggestion[] => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 9) {
    // 朝の習慣
    return [
      {
        title: '朝の日光浴（5分）',
        description: '体内時計をリセットし、セロトニン分泌を促進',
        frequency: 'daily',
        reminderTime: '07:30',
        reason: '朝の日光は睡眠の質向上とうつ症状軽減に効果的です',
        category: '健康・運動',
        priority: 'high'
      },
      {
        title: 'モーニングページ',
        description: '朝に思考を整理するため3ページの自由記述',
        frequency: 'daily',
        reminderTime: '06:30',
        reason: '朝の記述は創造性と自己認識を向上させます',
        category: 'メンタルヘルス',
        priority: 'medium'
      }
    ];
  } else if (hour >= 12 && hour < 14) {
    // 昼の習慣
    return [
      {
        title: '昼休みの短時間散歩',
        description: 'リフレッシュと血行促進のため',
        frequency: 'daily',
        reminderTime: '12:30',
        reason: '昼の散歩は午後の集中力を向上させます',
        category: '健康・運動',
        priority: 'medium'
      }
    ];
  } else if (hour >= 18 && hour < 22) {
    // 夜の習慣
    return [
      {
        title: '夜の振り返り（5分）',
        description: '今日の良かったことと改善点を記録',
        frequency: 'daily',
        reminderTime: '21:30',
        reason: '日々の振り返りは自己成長を促進します',
        category: 'メンタルヘルス',
        priority: 'medium'
      },
      {
        title: 'デジタルデトックス時間',
        description: '就寝前1時間のスマホ・PC使用禁止',
        frequency: 'daily',
        reminderTime: '22:00',
        reason: 'ブルーライトの制限は睡眠の質を改善します',
        category: '生活習慣',
        priority: 'high'
      }
    ];
  }
  
  return [];
};

/**
 * 天気に基づく習慣提案
 */
const getWeatherBasedSuggestions = async (): Promise<HabitSuggestion[]> => {
  try {
    const weather = await fetchWeather();
    const suggestions: HabitSuggestion[] = [];
    
    if (weather.condition === 'sunny' && weather.temperature > 15 && weather.temperature < 30) {
      suggestions.push({
        title: '屋外での運動習慣',
        description: '良い天気を活用した外での活動',
        frequency: 'daily',
        reminderTime: '17:00',
        reason: '晴天時の屋外活動はビタミンD合成と気分向上に効果的です',
        category: '健康・運動',
        priority: 'high'
      });
    }
    
    if (weather.condition === 'rainy') {
      suggestions.push({
        title: '室内での創作活動',
        description: '雨の日を活用した集中できる活動',
        frequency: 'daily',
        reminderTime: '14:00',
        reason: '雨の日は集中力が高まりやすく、創作活動に適しています',
        category: '学習・自己啓発',
        priority: 'medium'
      });
    }
    
    return suggestions;
  } catch (error) {
    console.error('天気情報の取得に失敗:', error);
    return [];
  }
};

/**
 * ユーザーの既存習慣を分析
 */
const analyzeExistingHabits = async (userId: string): Promise<string[]> => {
  try {
    const habitsQuery = query(
      collection(db, 'habits'),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(habitsQuery);
    const existingCategories: string[] = [];
    
    snapshot.forEach(doc => {
      const habit = doc.data();
      // 簡易的なカテゴリ判定
      const title = habit.title.toLowerCase();
      
      if (title.includes('運動') || title.includes('ウォーキング') || title.includes('ストレッチ')) {
        existingCategories.push('健康・運動');
      } else if (title.includes('読書') || title.includes('勉強') || title.includes('学習')) {
        existingCategories.push('学習・自己啓発');
      } else if (title.includes('瞑想') || title.includes('日記') || title.includes('振り返り')) {
        existingCategories.push('メンタルヘルス');
      } else if (title.includes('掃除') || title.includes('整理') || title.includes('水分')) {
        existingCategories.push('生活習慣');
      } else if (title.includes('連絡') || title.includes('家族') || title.includes('友人')) {
        existingCategories.push('人間関係');
      }
    });
    
    return [...new Set(existingCategories)]; // 重複を除去
  } catch (error) {
    console.error('既存習慣の分析に失敗:', error);
    return [];
  }
};

/**
 * ユーザーのタスク履歴を分析
 */
const analyzeTaskHistory = async (userId: string): Promise<string[]> => {
  try {
    const tasksQuery = query(
      collection(db, 'enhancedTasks'),
      where('userId', '==', userId),
      where('completed', '==', true),
      orderBy('completedAt', 'desc'),
      limit(20)
    );
    
    const snapshot = await getDocs(tasksQuery);
    const taskPatterns: string[] = [];
    
    snapshot.forEach(doc => {
      const task = doc.data();
      const text = task.text.toLowerCase();
      
      // タスクから習慣になりそうなパターンを抽出
      if (text.includes('運動') || text.includes('ジョギング') || text.includes('ジム')) {
        taskPatterns.push('運動系');
      }
      if (text.includes('本') || text.includes('読書') || text.includes('勉強')) {
        taskPatterns.push('学習系');
      }
      if (text.includes('整理') || text.includes('掃除') || text.includes('片付け')) {
        taskPatterns.push('整理整頓系');
      }
      if (text.includes('計画') || text.includes('目標') || text.includes('振り返り')) {
        taskPatterns.push('自己管理系');
      }
    });
    
    return [...new Set(taskPatterns)];
  } catch (error) {
    console.error('タスク履歴の分析に失敗:', error);
    return [];
  }
};

/**
 * ユーザーに最適化された習慣を提案
 */
export async function suggestHabits(userId: string): Promise<HabitSuggestion[]> {
  try {
    console.log('AI習慣提案を生成中...', userId);
    
    // 並行して各種分析を実行
    const [existingCategories, taskPatterns, timeBasedSuggestions, weatherSuggestions] = await Promise.all([
      analyzeExistingHabits(userId),
      analyzeTaskHistory(userId),
      Promise.resolve(getTimeBasedSuggestions()),
      getWeatherBasedSuggestions()
    ]);
    
    console.log('分析結果:', {
      existingCategories,
      taskPatterns,
      timeBasedCount: timeBasedSuggestions.length,
      weatherCount: weatherSuggestions.length
    });
    
    // 提案を収集
    let suggestions: HabitSuggestion[] = [];
    
    // 1. 時間帯に基づく提案を追加
    suggestions.push(...timeBasedSuggestions);
    
    // 2. 天気に基づく提案を追加
    suggestions.push(...weatherSuggestions);
    
    // 3. ベース習慣テンプレートから不足しているカテゴリを提案
    const availableTemplates = BASE_HABIT_TEMPLATES.filter(template => {
      // 既に同じカテゴリの習慣がある場合は提案しない
      return !existingCategories.includes(template.category);
    });
    
    // 4. タスク履歴に基づく提案を優先
    const prioritizedTemplates = availableTemplates.sort((a, b) => {
      const aMatch = taskPatterns.some(pattern => 
        a.title.toLowerCase().includes(pattern.replace('系', '')) ||
        a.category.includes(pattern.replace('系', ''))
      );
      const bMatch = taskPatterns.some(pattern => 
        b.title.toLowerCase().includes(pattern.replace('系', '')) ||
        b.category.includes(pattern.replace('系', ''))
      );
      
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      
      // 優先度でソート
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    // 5. 上位の提案を追加（最大3つまで）
    suggestions.push(...prioritizedTemplates.slice(0, 3));
    
    // 6. 重複除去と最終調整
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
      index === self.findIndex(s => s.title === suggestion.title)
    );
    
    // 最大5つまでに制限
    const finalSuggestions = uniqueSuggestions.slice(0, 5);
    
    console.log('AI習慣提案完了:', finalSuggestions.length, '件');
    return finalSuggestions;
    
  } catch (error) {
    console.error('習慣提案エラー:', error);
    
    // エラー時はデフォルトの基本提案を返す
    return BASE_HABIT_TEMPLATES
      .filter(template => template.priority === 'high')
      .slice(0, 3);
  }
}