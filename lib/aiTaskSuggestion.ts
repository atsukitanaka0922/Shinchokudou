/**
 * AIタスク提案モジュール
 * 
 * ユーザーの習慣や天気情報に基づいてパーソナライズされたタスクを提案する機能
 * 過去のタスク履歴、時間帯、天気条件などを考慮します
 */

import { fetchWeather } from '@/lib/weatherService';
import { PriorityLevel } from './aiPriorityAssignment';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

/**
 * 提案されるタスクの型定義
 */
export interface SuggestedTask {
  text: string;             // タスクの内容
  reason: string;           // 提案理由
  priority: PriorityLevel;  // 優先度
  category: string;         // カテゴリ
  estimatedTime: number;    // 推定所要時間（分）
  weatherRelevant: boolean; // 天気関連かどうか
}

/**
 * タスクカテゴリの定義
 */
const taskCategories = [
  '仕事', '勉強', '健康', '家事', '趣味', '買い物', '自己啓発'
];
/**
 * 天気ごとのタスク提案
 */
const weatherBasedTasks: { [key: string]: SuggestedTask[] } = {
  sunny: [
    {
      text: '公園でウォーキングをする',
      reason: '天気が良いので、外での運動に最適です',
      priority: 'medium',
      category: '健康',
      estimatedTime: 30,
      weatherRelevant: true
    },
    {
      text: '洗濯物を干す',
      reason: '日差しが強いので、洗濯物が早く乾きます',
      priority: 'high',
      category: '家事',
      estimatedTime: 15,
      weatherRelevant: true
    }
  ],
  cloudy: [
    {
      text: '図書館で読書する',
      reason: '曇りの日は集中力が高まる傾向があります',
      priority: 'low',
      category: '自己啓発',
      estimatedTime: 60,
      weatherRelevant: true
    },
    {
      text: '写真撮影に出かける',
      reason: '曇りの日は光が柔らかく、写真撮影に適しています',
      priority: 'low',
      category: '趣味',
      estimatedTime: 90,
      weatherRelevant: true
    }
  ],
  rainy: [
    {
      text: '室内の掃除をする',
      reason: '雨の日は外出が難しいので、屋内作業に最適です',
      priority: 'medium',
      category: '家事',
      estimatedTime: 45,
      weatherRelevant: true
    },
    {
      text: 'オンライン学習を進める',
      reason: '雨の日は室内で集中できる勉強の時間に最適です',
      priority: 'medium',
      category: '自己啓発',
      estimatedTime: 60,
      weatherRelevant: true
    }
  ],
  snowy: [
    {
      text: '防寒対策を確認する',
      reason: '雪の日は足元が滑りやすいので安全確認が重要です',
      priority: 'high',
      category: '健康',
      estimatedTime: 15,
      weatherRelevant: true
    },
    {
      text: '温かい料理を作る',
      reason: '寒い日は体を温める料理で体調管理をしましょう',
      priority: 'medium',
      category: '家事',
      estimatedTime: 45,
      weatherRelevant: true
    }
  ],
  stormy: [
    {
      text: '家での作業を整理する',
      reason: '荒天時は安全のため室内で過ごしましょう',
      priority: 'medium',
      category: '家事',
      estimatedTime: 30,
      weatherRelevant: true
    },
    {
      text: '緊急時の備えを確認する',
      reason: '備蓄品や避難経路を確認しておくと安心です',
      priority: 'high',
      category: '家事',
      estimatedTime: 20,
      weatherRelevant: true
    }
  ],
  foggy: [
    {
      text: '室内でのリラックスタイムを取る',
      reason: '霧の日は視界が悪いので、室内でゆっくり過ごしましょう',
      priority: 'low',
      category: '健康',
      estimatedTime: 45,
      weatherRelevant: true
    }
  ],
  unknown: [
    {
      text: '今日のスケジュールを確認する',
      reason: '一日の計画を立てて効率的に過ごしましょう',
      priority: 'medium',
      category: '仕事',
      estimatedTime: 15,
      weatherRelevant: false
    }
  ]
};
/**
 * 基本的なタスク提案
 */
const generalTasks: SuggestedTask[] = [
  {
    text: 'メールの受信トレイを整理する',
    reason: '定期的な整理でメール管理が効率化されます',
    priority: 'medium',
    category: '仕事',
    estimatedTime: 20,
    weatherRelevant: false
  },
  {
    text: '水分補給の習慣をつける',
    reason: '適切な水分摂取は健康維持に重要です',
    priority: 'high',
    category: '健康',
    estimatedTime: 5,
    weatherRelevant: false
  },
  {
    text: '10分間の瞑想を行う',
    reason: 'マインドフルネスはストレス軽減に効果的です',
    priority: 'low',
    category: '自己啓発',
    estimatedTime: 10,
    weatherRelevant: false
  },
  {
    text: '今週のスケジュールを確認する',
    reason: '先の予定を把握して計画的に行動しましょう',
    priority: 'high',
    category: '仕事',
    estimatedTime: 15,
    weatherRelevant: false
  }
];

/**
 * 時間帯に応じたタスク提案
 */
const getTimeBasedTasks = (): SuggestedTask[] => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 9) {
    // 朝のタスク
    return [
      {
        text: 'ストレッチをする',
        reason: '朝の軽い運動で一日を活動的に始めましょう',
        priority: 'medium',
        category: '健康',
        estimatedTime: 10,
        weatherRelevant: false
      },
      {
        text: '今日のToDoリストを作成する',
        reason: '朝に計画を立てることで一日の生産性が向上します',
        priority: 'high',
        category: '仕事',
        estimatedTime: 15,
        weatherRelevant: false
      }
    ];
  } else if (hour >= 9 && hour < 12) {
    // 午前中のタスク
    return [
      {
        text: '最も重要な仕事タスクに取り組む',
        reason: '午前中は集中力が高いので難しいタスクに最適です',
        priority: 'high',
        category: '仕事',
        estimatedTime: 90,
        weatherRelevant: false
      }
    ];
  } else if (hour >= 12 && hour < 14) {
    // 昼休み
    return [
      {
        text: '短い散歩に出る',
        reason: '昼食後の軽い運動は消化を助けます',
        priority: 'low',
        category: '健康',
        estimatedTime: 15,
        weatherRelevant: false
      }
    ];
  } else if (hour >= 14 && hour < 17) {
    // 午後
    return [
      {
        text: 'チームメンバーと進捗確認',
        reason: '午後は連携タスクに適しています',
        priority: 'medium',
        category: '仕事',
        estimatedTime: 30,
        weatherRelevant: false
      }
    ];
  } else if (hour >= 17 && hour < 20) {
    // 夕方
    return [
      {
        text: '今日の振り返りをする',
        reason: '一日の終わりに振り返ることで改善点が見つかります',
        priority: 'medium',
        category: '自己啓発',
        estimatedTime: 15,
        weatherRelevant: false
      }
    ];
  } else {
    // 夜
    return [
      {
        text: '明日の準備をする',
        reason: '就寝前の準備で朝をスムーズに始められます',
        priority: 'medium',
        category: '家事',
        estimatedTime: 15,
        weatherRelevant: false
      }
    ];
  }
};
/**
 * 過去のタスク履歴からユーザーの習慣を分析
 * @param userId ユーザーID
 * @returns ユーザーの習慣に基づくタスク提案
 */
const analyzeUserHabits = async (userId: string): Promise<SuggestedTask[]> => {
  try {
    // 過去の完了済みタスクを取得
    const completedTasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', userId),
      where('completed', '==', true),
      orderBy('completedAt', 'desc'),
      limit(20)
    );
    
    const snapshot = await getDocs(completedTasksQuery);
    
    // タスクがなければ早期リターン
    if (snapshot.empty) {
      return [];
    }
    
    // カテゴリごとの出現頻度を集計
    const categoryFrequency: {[key: string]: number} = {};
    const textAnalysis: string[] = [];
    
    snapshot.forEach(doc => {
      const task = doc.data();
      textAnalysis.push(task.text);
      
      // 簡易的なカテゴリ判別（実際はもっと高度な分析が必要）
      for (const category of taskCategories) {
        if (task.text.toLowerCase().includes(category.toLowerCase())) {
          categoryFrequency[category] = (categoryFrequency[category] || 0) + 1;
        }
      }
    });
    
    // 最も頻度の高いカテゴリを特定
    let favoriteCategory = '';
    let maxFrequency = 0;
    
    for (const [category, frequency] of Object.entries(categoryFrequency)) {
      if (frequency > maxFrequency) {
        maxFrequency = frequency;
        favoriteCategory = category;
      }
    }
    
    // ユーザーの習慣に基づいたタスク提案
    const habitBasedTasks: SuggestedTask[] = [];
    
    if (favoriteCategory) {
      habitBasedTasks.push({
        text: `${favoriteCategory}に関連するタスクを計画する`,
        reason: `あなたは${favoriteCategory}のタスクをよく実行しています`,
        priority: 'medium',
        category: favoriteCategory,
        estimatedTime: 20,
        weatherRelevant: false
      });
    }
    
    // テキスト分析からよく出てくるキーワードを抽出
    const keywords = textAnalysis.join(' ').split(' ')
      .filter(word => word.length > 2)
      .reduce<{[key: string]: number}>((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {});
    
    // 上位のキーワードを抽出
    const topKeywords = Object.entries(keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);
    
    if (topKeywords.length > 0) {
      habitBasedTasks.push({
        text: `「${topKeywords[0]}」に関するタスクを進める`,
        reason: 'あなたの過去のタスクに基づいた提案です',
        priority: 'medium',
        category: favoriteCategory || '仕事',
        estimatedTime: 30,
        weatherRelevant: false
      });
    }
    
    return habitBasedTasks;
  } catch (error) {
    console.error('ユーザー習慣の分析エラー:', error);
    return [];
  }
};
/**
 * ユーザーに合わせたタスク提案を生成
 * @param userId ユーザーID
 * @returns 提案タスクのリスト
 */
export async function suggestTasks(userId: string): Promise<SuggestedTask[]> {
  try {
    // 過去の習慣からタスクを提案
    const habitTasks = await analyzeUserHabits(userId);
    
    // 現在の天気を取得
    const weather = await fetchWeather();
    const weatherCondition = weather.condition;
    
    // 天気に基づくタスク提案
    const weatherTasks = weatherBasedTasks[weatherCondition] || [];
    
    // 時間帯に基づくタスク提案
    const timeTasks = getTimeBasedTasks();
    
    // すべての提案を結合
    const allSuggestions = [
      ...habitTasks,
      ...weatherTasks,
      ...timeTasks,
      ...generalTasks
    ];
    
    // 重複を避けるためにシャッフルして一部を選択
    const shuffled = allSuggestions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  } catch (error) {
    console.error('タスク提案エラー:', error);
    return generalTasks.slice(0, 3); // エラー時はデフォルトタスクを返す
  }
}