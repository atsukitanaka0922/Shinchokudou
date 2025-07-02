/**
 * 習慣管理機能のインターフェース定義
 * 
 * 習慣タスクの型定義と関連ユーティリティ
 * v1.7.0: 効果音システム追加、習慣タスク機能の実装
 */

/**
 * 習慣の頻度
 */
export type HabitFrequency = 'daily' | 'weekly' | 'monthly';

/**
 * 習慣の完了履歴
 */
export interface HabitCompletion {
  date: string;           // YYYY-MM-DD形式
  completed: boolean;     // 完了したかどうか
  completedAt?: number;   // 完了時刻のタイムスタンプ
}

/**
 * 習慣の基本情報
 */
export interface Habit {
  id: string;                         // 習慣のユニークID
  userId: string;                     // 所有ユーザーID
  title: string;                      // 習慣名
  description?: string;               // 説明（任意）
  frequency: HabitFrequency;          // 実行頻度
  targetDays?: number[];              // 対象日（週の場合は曜日、月の場合は日付）
  reminderTime?: string;              // リマインダー時間（HH:MM形式）
  isActive: boolean;                  // アクティブかどうか
  createdAt: number;                  // 作成日時のタイムスタンプ
  updatedAt?: number;                 // 更新日時のタイムスタンプ
  completionHistory: HabitCompletion[]; // 完了履歴
}

/**
 * 習慣作成時のデータ
 */
export interface CreateHabitData {
  title: string;
  description?: string;
  frequency: HabitFrequency;
  targetDays?: number[];
  reminderTime?: string;
  isActive: boolean;
}

/**
 * 習慣更新時のデータ
 */
export interface UpdateHabitData {
  title?: string;
  description?: string;
  frequency?: HabitFrequency;
  targetDays?: number[];
  reminderTime?: string;
  isActive?: boolean;
}

/**
 * 習慣統計情報
 */
export interface HabitStats {
  totalHabits: number;                // 総習慣数
  activeHabits: number;               // アクティブな習慣数
  completedToday: number;             // 今日完了した習慣数
  averageCompletionRate: number;      // 平均完了率
  longestStreak: number;              // 最長ストリーク
  currentStreaks: { [habitId: string]: number }; // 現在のストリーク
}

/**
 * AI習慣提案
 */
export interface HabitSuggestion {
  title: string;
  description: string;
  frequency: HabitFrequency;
  targetDays?: number[];
  reminderTime?: string;
  reason: string;                     // 提案理由
  category: string;                   // カテゴリ
  priority: 'high' | 'medium' | 'low'; // 優先度
}

/**
 * 習慣ユーティリティクラス
 */
export class HabitUtils {
  /**
   * 今日がその習慣を実行する日かチェック
   */
  static shouldExecuteToday(habit: Habit, date: Date = new Date()): boolean {
    const today = new Date(date);
    
    switch (habit.frequency) {
      case 'daily':
        return habit.isActive;
        
      case 'weekly':
        if (!habit.targetDays || habit.targetDays.length === 0) return false;
        const dayOfWeek = today.getDay(); // 0=日曜日, 1=月曜日, ...
        return habit.isActive && habit.targetDays.includes(dayOfWeek);
        
      case 'monthly':
        if (!habit.targetDays || habit.targetDays.length === 0) return false;
        const dayOfMonth = today.getDate();
        return habit.isActive && habit.targetDays.includes(dayOfMonth);
        
      default:
        return false;
    }
  }

  /**
   * 今日の完了状況をチェック
   */
  static isCompletedToday(habit: Habit, date: Date = new Date()): boolean {
    const today = date.toISOString().split('T')[0];
    return habit.completionHistory.some(
      completion => completion.date === today && completion.completed
    );
  }

  /**
   * 習慣の現在のストリークを計算
   */
  static calculateCurrentStreak(habit: Habit): number {
    const sortedHistory = habit.completionHistory
      .filter(h => h.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (sortedHistory.length === 0) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    
    for (const completion of sortedHistory) {
      const completionDate = new Date(completion.date);
      const diffDays = Math.floor(
        (currentDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (diffDays === streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }

  /**
   * 習慣の完了率を計算
   */
  static calculateCompletionRate(habit: Habit, days: number = 30): number {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    let totalDays = 0;
    let completedDays = 0;
    
    // 指定期間内の各日をチェック
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (this.shouldExecuteToday(habit, d)) {
        totalDays++;
        if (this.isCompletedToday(habit, d)) {
          completedDays++;
        }
      }
    }
    
    return totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
  }

  /**
   * 習慣が期限切れかチェック（リマインダー時間を過ぎているか）
   */
  static isOverdue(habit: Habit, currentTime: Date = new Date()): boolean {
    // 今日実行する習慣でなければ期限切れではない
    if (!this.shouldExecuteToday(habit, currentTime)) return false;
    
    // 既に完了している場合は期限切れではない
    if (this.isCompletedToday(habit, currentTime)) return false;
    
    // リマインダー時間が設定されていない場合は期限切れではない
    if (!habit.reminderTime) return false;
    
    // リマインダー時間と現在時刻を比較
    const [reminderHour, reminderMinute] = habit.reminderTime.split(':').map(Number);
    const reminderTime = new Date(currentTime);
    reminderTime.setHours(reminderHour, reminderMinute, 0, 0);
    
    return currentTime > reminderTime;
  }

  /**
   * 次回実行日を計算
   */
  static getNextExecutionDate(habit: Habit): Date | null {
    const today = new Date();
    
    switch (habit.frequency) {
      case 'daily':
        // 毎日の場合、今日完了していなければ今日、完了していれば明日
        if (!this.isCompletedToday(habit, today)) {
          return today;
        } else {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          return tomorrow;
        }
        
      case 'weekly':
        if (!habit.targetDays || habit.targetDays.length === 0) return null;
        
        const currentDayOfWeek = today.getDay();
        const nextTargetDay = habit.targetDays
          .filter(day => day > currentDayOfWeek)
          .sort((a, b) => a - b)[0];
        
        if (nextTargetDay !== undefined) {
          // 今週の次の対象日
          const nextDate = new Date(today);
          nextDate.setDate(today.getDate() + (nextTargetDay - currentDayOfWeek));
          return nextDate;
        } else {
          // 来週の最初の対象日
          const nextWeekDay = Math.min(...habit.targetDays);
          const nextDate = new Date(today);
          nextDate.setDate(today.getDate() + (7 - currentDayOfWeek + nextWeekDay));
          return nextDate;
        }
        
      case 'monthly':
        if (!habit.targetDays || habit.targetDays.length === 0) return null;
        
        const currentDayOfMonth = today.getDate();
        const nextTargetDate = habit.targetDays
          .filter(day => day > currentDayOfMonth)
          .sort((a, b) => a - b)[0];
        
        if (nextTargetDate !== undefined) {
          // 今月の次の対象日
          const nextDate = new Date(today);
          nextDate.setDate(nextTargetDate);
          return nextDate;
        } else {
          // 来月の最初の対象日
          const nextMonthDay = Math.min(...habit.targetDays);
          const nextDate = new Date(today);
          nextDate.setMonth(today.getMonth() + 1, nextMonthDay);
          return nextDate;
        }
        
      default:
        return null;
    }
  }

  /**
   * 習慣のカテゴリを自動判定
   */
  static categorizeHabit(title: string, description?: string): string {
    const text = (title + ' ' + (description || '')).toLowerCase();
    
    if (text.includes('運動') || text.includes('ジョギング') || text.includes('筋トレ') || 
        text.includes('ウォーキング') || text.includes('ヨガ') || text.includes('ストレッチ')) {
      return '健康・運動';
    }
    
    if (text.includes('読書') || text.includes('勉強') || text.includes('学習') || 
        text.includes('本') || text.includes('語学') || text.includes('資格')) {
      return '学習・自己啓発';
    }
    
    if (text.includes('瞑想') || text.includes('日記') || text.includes('感謝') || 
        text.includes('リラックス') || text.includes('マインドフルネス')) {
      return 'メンタルヘルス';
    }
    
    if (text.includes('仕事') || text.includes('プロジェクト') || text.includes('会議') || 
        text.includes('タスク') || text.includes('メール')) {
      return '仕事・生産性';
    }
    
    if (text.includes('掃除') || text.includes('洗濯') || text.includes('料理') || 
        text.includes('整理') || text.includes('家事')) {
      return '生活習慣';
    }
    
    if (text.includes('家族') || text.includes('友人') || text.includes('連絡') || 
        text.includes('コミュニケーション')) {
      return '人間関係';
    }
    
    return 'その他';
  }

  /**
   * 習慣の重要度を計算
   */
  static calculateImportance(habit: Habit): number {
    let score = 0;
    
    // 頻度による加点
    switch (habit.frequency) {
      case 'daily': score += 30; break;
      case 'weekly': score += 20; break;
      case 'monthly': score += 10; break;
    }
    
    // ストリークによる加点
    const streak = this.calculateCurrentStreak(habit);
    score += Math.min(streak * 2, 20);
    
    // 完了率による加点
    const completionRate = this.calculateCompletionRate(habit);
    score += completionRate * 0.3;
    
    // カテゴリによる加点
    const category = this.categorizeHabit(habit.title, habit.description);
    if (category === '健康・運動' || category === 'メンタルヘルス') {
      score += 15;
    }
    
    return Math.round(score);
  }
}