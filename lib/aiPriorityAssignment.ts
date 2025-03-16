import { db } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

// タスク優先度の自動割り当て機能

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface PriorityResult {
  priority: PriorityLevel;
  confidence: number; // 0-1の範囲で予測の信頼度
  factors: string[]; // 優先度判定の要因
}

// キーワードと優先度のマッピング
const keywordPriorityMap: Record<string, PriorityLevel> = {
  '緊急': 'urgent',
  '重要': 'high',
  '至急': 'urgent',
  '今すぐ': 'urgent',
  '締切': 'high',
  '期限': 'high',
  '明日': 'high',
  '今週': 'medium',
  '来週': 'medium',
  'あとで': 'low',
  'いつか': 'low',
  '暇なとき': 'low'
};

// AIによる優先度自動判定
export async function predictTaskPriority(
  taskText: string,
  deadline?: string,
  userId?: string
): Promise<PriorityResult> {
  try {
    // 判定要因の配列
    const factors: string[] = [];
    let priorityScore = 0;
    let totalFactors = 0;
    
    // 1. キーワードベースの優先度評価
    const keywordScore = evaluateKeywords(taskText, factors);
    priorityScore += keywordScore;
    totalFactors++;
    
    // 2. 締め切りベースの優先度評価
    if (deadline) {
      const deadlineScore = evaluateDeadline(deadline, factors);
      priorityScore += deadlineScore;
      totalFactors++;
    }
    
    // 3. 過去のタスク完了パターンによる優先度評価（ユーザーIDがある場合）
    if (userId) {
      try {
        const historyScore = await evaluateTaskHistory(userId, taskText, factors);
        priorityScore += historyScore;
        totalFactors++;
      } catch (error) {
        console.error("タスク履歴評価エラー:", error);
        // エラーが発生しても処理を継続
      }
    }
    
    // 4. カテゴリベースの優先度評価
    const categoryScore = evaluateCategory(taskText, factors);
    priorityScore += categoryScore;
    totalFactors++;
    
    // 最終スコアを計算（0-1の範囲に正規化）
    const normalizedScore = priorityScore / totalFactors;
    
    // スコアから優先度レベルを決定
    let priority: PriorityLevel;
    if (normalizedScore >= 0.75) {
      priority = 'urgent';
    } else if (normalizedScore >= 0.5) {
      priority = 'high';
    } else if (normalizedScore >= 0.25) {
      priority = 'medium';
    } else {
      priority = 'low';
    }
    
    return {
      priority,
      confidence: normalizedScore,
      factors
    };
  } catch (error) {
    console.error("優先度予測エラー:", error);
    // デフォルトの優先度を返す
    return {
      priority: 'medium',
      confidence: 0.5,
      factors: ['デフォルト優先度を適用しました']
    };
  }
}

// キーワードによる優先度評価
function evaluateKeywords(text: string, factors: string[]): number {
  const lowerText = text.toLowerCase();
  let highestPriorityScore = 0;
  let matchedKeyword = '';
  
  for (const [keyword, priority] of Object.entries(keywordPriorityMap)) {
    if (lowerText.includes(keyword.toLowerCase())) {
      let score = 0;
      
      switch (priority) {
        case 'urgent':
          score = 1.0;
          break;
        case 'high':
          score = 0.75;
          break;
        case 'medium':
          score = 0.5;
          break;
        case 'low':
          score = 0.25;
          break;
      }
      
      if (score > highestPriorityScore) {
        highestPriorityScore = score;
        matchedKeyword = keyword;
      }
    }
  }
  
  if (matchedKeyword) {
    factors.push(`「${matchedKeyword}」というキーワードが含まれています`);
  } else {
    factors.push('優先度を示す特定のキーワードはありません');
  }
  
  return highestPriorityScore;
}

// 締め切りに基づく優先度評価
function evaluateDeadline(deadline: string, factors: string[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  if (diffDays < 0) {
    factors.push('締切が過ぎています');
    return 1.0; // 期限切れ
  } else if (diffDays === 0) {
    factors.push('締切が今日です');
    return 0.9; // 今日が締切
  } else if (diffDays <= 1) {
    factors.push('締切まで1日です');
    return 0.8; // 明日が締切
  } else if (diffDays <= 3) {
    factors.push('締切まで3日以内です');
    return 0.7; // 3日以内
  } else if (diffDays <= 7) {
    factors.push('締切まで1週間以内です');
    return 0.6; // 1週間以内
  } else if (diffDays <= 14) {
    factors.push('締切まで2週間以内です');
    return 0.4; // 2週間以内
  } else {
    factors.push(`締切まで${Math.floor(diffDays)}日あります`);
    return 0.2; // 2週間以上先
  }
}

// 過去のタスク履歴に基づく優先度評価
async function evaluateTaskHistory(
  userId: string,
  taskText: string,
  factors: string[]
): Promise<number> {
  // 類似タスクの完了パターンを分析
  const tasksQuery = query(
    collection(db, "tasks"),
    where("userId", "==", userId),
    where("completed", "==", true)
  );
  
  const snapshot = await getDocs(tasksQuery);
  const completedTasks = snapshot.docs.map(doc => doc.data());
  
  if (completedTasks.length === 0) {
    factors.push('過去のタスク履歴がありません');
    return 0.5; // 中程度の優先度をデフォルトとする
  }
  
  // タスクのカテゴリを推定
  const taskCategory = estimateTaskCategory(taskText);
  
  // 同じカテゴリのタスクを分析
  const categorizedTasks = completedTasks.filter(task => 
    estimateTaskCategory(task.text) === taskCategory
  );
  
  if (categorizedTasks.length === 0) {
    factors.push('同カテゴリの過去タスクがありません');
    return 0.5;
  }
  
  // タスクの完了時間の分析
  const completionTimes = categorizedTasks
    .filter(task => task.createdAt && task.completedAt)
    .map(task => {
      const createdAt = new Date(task.createdAt).getTime();
      const completedAt = new Date(task.completedAt).getTime();
      return (completedAt - createdAt) / (1000 * 60 * 60); // 時間単位
    });
  
  if (completionTimes.length === 0) {
    factors.push('過去タスクの完了時間データがありません');
    return 0.5;
  }
  
  // 平均完了時間を計算
  const avgCompletionTime = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
  
  // 平均完了時間に基づいて優先度を割り当て
  if (avgCompletionTime < 1) {
    factors.push('同様のタスクは通常1時間以内に完了しています');
    return 0.3; // 低い優先度（短時間で終わるタスク）
  } else if (avgCompletionTime < 4) {
    factors.push('同様のタスクは通常4時間以内に完了しています');
    return 0.5; // 中程度の優先度
  } else if (avgCompletionTime < 24) {
    factors.push('同様のタスクは通常1日以内に完了しています');
    return 0.7; // 高い優先度
  } else {
    factors.push('同様のタスクは完了に1日以上かかることがあります');
    return 0.8; // 非常に高い優先度（時間のかかるタスク）
  }
}

// タスクカテゴリの推定
function estimateTaskCategory(text: string): string {
  const categories = [
    { name: '仕事', keywords: ['会議', 'レポート', 'プレゼン', 'メール', '電話', '資料'] },
    { name: '学習', keywords: ['勉強', '読書', '課題', 'テスト', '学習', '復習'] },
    { name: '家事', keywords: ['掃除', '洗濯', '料理', '買い物', '片付け', '整理'] },
    { name: '健康', keywords: ['運動', 'ジム', 'トレーニング', '散歩', '瞑想', 'ヨガ'] },
    { name: '趣味', keywords: ['映画', '音楽', 'ゲーム', '旅行', '読書', '絵画'] }
  ];
  
  for (const category of categories) {
    if (category.keywords.some(keyword => text.includes(keyword))) {
      return category.name;
    }
  }
  
  return '一般';
}

// カテゴリベースの優先度評価
function evaluateCategory(text: string, factors: string[]): number {
  const category = estimateTaskCategory(text);
  
  // カテゴリによる重み付け（カスタマイズ可能）
  const categoryPriorities: Record<string, number> = {
    '仕事': 0.8,
    '学習': 0.7,
    '健康': 0.6,
    '家事': 0.5,
    '趣味': 0.3,
    '一般': 0.5
  };
  
  const priorityScore = categoryPriorities[category] || 0.5;
  factors.push(`「${category}」カテゴリのタスクと推定されます`);
  
  return priorityScore;
}