/**
 * AI優先度判定モジュール
 * 
 * タスクの内容に基づいて優先度を判定するAI機能
 * テキスト解析によってタスクの重要度を推測します
 */

// 優先度レベルの型定義
export type PriorityLevel = 'high' | 'medium' | 'low';

/**
 * タスクテキストから優先度を推測する
 * テキスト解析によってタスクの優先度を判定します
 * 
 * @param taskText タスクのテキスト内容
 * @returns 推測された優先度レベル
 */
export async function suggestPriority(taskText: string): Promise<PriorityLevel> {
  // 実際のAI APIを呼び出す代わりにテキスト解析で簡易判定
  // 本番環境では自然言語処理APIに置き換え可能
  
  const text = taskText.toLowerCase();

  // 高優先度を示す単語や表現を検索
  const highPriorityKeywords = [
    '急ぎ', '重要', '至急', '緊急', '今すぐ', '期限切れ', 'すぐに',
    'urgent', 'important', 'critical', 'asap', 'immediately', 'deadline'
  ];

  // 低優先度を示す単語や表現を検索
  const lowPriorityKeywords = [
    'いつか', '余裕があれば', '時間があれば', '後で', 'そのうち',
    'sometime', 'when possible', 'eventually', 'later', 'if time permits'
  ];

  // 高優先度キーワードの検出
  for (const keyword of highPriorityKeywords) {
    if (text.includes(keyword)) {
      return 'high';
    }
  }

  // 低優先度キーワードの検出
  for (const keyword of lowPriorityKeywords) {
    if (text.includes(keyword)) {
      return 'low';
    }
  }

  // デフォルトは中優先度
  return 'medium';
}

/**
 * タスクの優先度を計算する詳細なアルゴリズム
 * 複数の要素（締め切り、重要性など）を考慮した優先度スコアを算出
 * 
 * @param taskText タスクのテキスト
 * @param deadline 締め切り（オプション）
 * @returns 優先度レベル
 */
export function calculateDetailedPriority(
  taskText: string,
  deadline?: string
): PriorityLevel {
  let score = 50; // デフォルトスコア（0-100）
  const text = taskText.toLowerCase();
  
  // テキスト内容に基づく加点
  if (text.includes('会議') || text.includes('ミーティング')) score += 10;
  if (text.includes('プレゼン') || text.includes('発表')) score += 15;
  if (text.includes('提出') || text.includes('納品')) score += 12;
  if (text.includes('クライアント') || text.includes('顧客')) score += 20;
  if (text.includes('上司') || text.includes('社長')) score += 15;

  // テキスト内容に基づく減点
  if (text.includes('自己啓発') || text.includes('趣味')) score -= 15;
  if (text.includes('いつか') || text.includes('暇なとき')) score -= 20;
  
  // 締め切りに基づく加点
  if (deadline) {
    const today = new Date();
    const dueDate = new Date(deadline);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) score += 30; // 期限切れ
    else if (daysUntilDue === 0) score += 25; // 今日が期限
    else if (daysUntilDue === 1) score += 20; // 明日が期限
    else if (daysUntilDue <= 3) score += 15; // 3日以内が期限
    else if (daysUntilDue <= 7) score += 10; // 1週間以内が期限
  }
  
  // スコアを優先度レベルに変換
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}