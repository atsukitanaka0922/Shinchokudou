/**
 * 拡張タスクインターフェース（ソート機能追加）
 * 
 * サブタスクとメモ機能を含む拡張されたタスクの型定義
 * v1.6.0: タスクソート機能の型定義を追加
 */

import { PriorityLevel } from './aiPriorityAssignment';

/**
 * サブタスクのインターフェース
 */
export interface SubTask {
  id: string;                    // サブタスクのユニークID
  text: string;                  // サブタスクの内容
  completed: boolean;            // 完了状態
  completedAt?: number | null;   // 完了日時のタイムスタンプ
  order: number;                 // 表示順序
  createdAt: number;             // 作成日時のタイムスタンプ
}

/**
 * 拡張されたタスクのインターフェース
 */
export interface EnhancedTask {
  id: string;                    // タスクのユニークID
  text: string;                  // タスクの内容
  completed: boolean;            // 完了状態
  completedAt?: number | null;   // 完了日時のタイムスタンプ
  userId: string;                // 所有ユーザーID
  deadline?: string;             // 期限（YYYY-MM-DD形式）
  order: number;                 // 表示順序
  priority: PriorityLevel;       // 優先度（high/medium/low）
  createdAt?: number;            // 作成日時のタイムスタンプ
  scheduledForDeletion?: boolean; // 削除予定フラグ
  
  // 新機能
  memo?: string;                 // メモ（マークダウン対応）
  subTasks: SubTask[];           // サブタスクのリスト
  subTasksCount?: number;        // サブタスクの総数（パフォーマンス用）
  completedSubTasksCount?: number; // 完了済みサブタスクの数（パフォーマンス用）
  
  // 統計情報
  estimatedMinutes?: number;     // 見積もり時間（分）
  actualMinutes?: number;        // 実際にかかった時間（分）
  
  // タグ機能（将来拡張）
  tags?: string[];               // タグのリスト
}

/**
 * サブタスクの作成データ
 */
export interface CreateSubTaskData {
  text: string;
  parentTaskId: string;
}

/**
 * サブタスクの更新データ
 */
export interface UpdateSubTaskData {
  text?: string;
  completed?: boolean;
  order?: number;
}

/**
 * タスクメモの更新データ
 */
export interface UpdateTaskMemoData {
  memo: string;
}

/**
 * タスクの見積もり時間更新データ
 */
export interface UpdateTaskEstimateData {
  estimatedMinutes: number;
}

/**
 * サブタスクの進捗統計
 */
export interface SubTaskProgress {
  total: number;           // 総サブタスク数
  completed: number;       // 完了済みサブタスク数
  progress: number;        // 進捗率（0-100）
}

/**
 * タスクの拡張統計情報
 */
export interface TaskAnalytics {
  totalTasks: number;
  completedTasks: number;
  totalSubTasks: number;
  completedSubTasks: number;
  averageSubTasksPerTask: number;
  tasksWithMemo: number;
  tasksWithSubTasks: number;
  estimatedTotalMinutes: number;
  actualTotalMinutes: number;
}

/**
 * サブタスクのフィルター条件
 */
export type SubTaskFilter = 'all' | 'active' | 'completed';

/**
 * 🔥 追加: タスクのソート条件
 */
export type TaskSortBy = 'created' | 'deadline' | 'priority' | 'progress' | 'alphabetical';

/**
 * 🔥 追加: ソート順序
 */
export type SortOrder = 'asc' | 'desc';

/**
 * 🔥 追加: ソート設定
 */
export interface TaskSortConfig {
  sortBy: TaskSortBy;
  sortOrder: SortOrder;
}

/**
 * サブタスクユーティリティ関数
 */
export class SubTaskUtils {
  /**
   * サブタスクの進捗を計算
   */
  static calculateProgress(subTasks: SubTask[]): SubTaskProgress {
    const total = subTasks.length;
    const completed = subTasks.filter(subTask => subTask.completed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, progress };
  }

  /**
   * 新しいサブタスクのIDを生成
   */
  static generateSubTaskId(): string {
    return `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * サブタスクを順序で並び替え
   */
  static sortByOrder(subTasks: SubTask[]): SubTask[] {
    return [...subTasks].sort((a, b) => a.order - b.order);
  }

  /**
   * サブタスクの順序を再計算
   */
  static reorderSubTasks(subTasks: SubTask[]): SubTask[] {
    return subTasks.map((subTask, index) => ({
      ...subTask,
      order: index + 1
    }));
  }

  /**
   * サブタスクをフィルタリング
   */
  static filterSubTasks(subTasks: SubTask[], filter: SubTaskFilter): SubTask[] {
    switch (filter) {
      case 'active':
        return subTasks.filter(subTask => !subTask.completed);
      case 'completed':
        return subTasks.filter(subTask => subTask.completed);
      case 'all':
      default:
        return subTasks;
    }
  }
}

/**
 * タスクユーティリティ関数
 */
export class TaskUtils {
  /**
   * タスクの完了状態を判定（メインタスクとサブタスクを考慮）
   */
  static isTaskFullyCompleted(task: EnhancedTask): boolean {
    if (!task.completed) return false;
    if (task.subTasks.length === 0) return true;
    return task.subTasks.every(subTask => subTask.completed);
  }

  /**
   * タスクの総進捗を計算（メインタスク + サブタスク）
   */
  static calculateTotalProgress(task: EnhancedTask): number {
    if (task.subTasks.length === 0) {
      return task.completed ? 100 : 0;
    }

    const subTaskProgress = SubTaskUtils.calculateProgress(task.subTasks);
    const mainTaskWeight = 0.3; // メインタスクの重み
    const subTaskWeight = 0.7;  // サブタスクの重み

    const mainProgress = task.completed ? 100 : 0;
    return Math.round(mainProgress * mainTaskWeight + subTaskProgress.progress * subTaskWeight);
  }

  /**
   * 見積もり時間の精度を計算
   */
  static calculateTimeAccuracy(task: EnhancedTask): number | null {
    if (!task.estimatedMinutes || !task.actualMinutes) return null;
    
    const accuracy = 100 - Math.abs(task.estimatedMinutes - task.actualMinutes) / task.estimatedMinutes * 100;
    return Math.max(0, Math.round(accuracy));
  }

  /**
   * タスクの複雑度を計算
   */
  static calculateComplexity(task: EnhancedTask): 'simple' | 'medium' | 'complex' {
    let score = 0;
    
    // サブタスクの数
    if (task.subTasks.length > 5) score += 2;
    else if (task.subTasks.length > 2) score += 1;
    
    // メモの長さ
    if (task.memo && task.memo.length > 200) score += 2;
    else if (task.memo && task.memo.length > 50) score += 1;
    
    // 見積もり時間
    if (task.estimatedMinutes && task.estimatedMinutes > 120) score += 2;
    else if (task.estimatedMinutes && task.estimatedMinutes > 60) score += 1;
    
    // 優先度
    if (task.priority === 'high') score += 1;
    
    if (score >= 4) return 'complex';
    if (score >= 2) return 'medium';
    return 'simple';
  }

  /**
   * 🔥 追加: タスクをソートする関数
   */
  static sortTasks(tasks: EnhancedTask[], sortConfig: TaskSortConfig): EnhancedTask[] {
    const { sortBy, sortOrder } = sortConfig;
    
    const sorted = [...tasks].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'priority':
          // 優先度: high(3) > medium(2) > low(1)
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
          
        case 'deadline':
          // 期限: 近い順（期限なしは最後）
          if (!a.deadline && !b.deadline) comparison = 0;
          else if (!a.deadline) comparison = 1;
          else if (!b.deadline) comparison = -1;
          else comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          break;
          
        case 'created':
          // 作成日: 新しい順
          comparison = (b.createdAt || 0) - (a.createdAt || 0);
          break;
          
        case 'progress':
          // 進捗: 高い順
          const progressA = TaskUtils.calculateTotalProgress(a);
          const progressB = TaskUtils.calculateTotalProgress(b);
          comparison = progressB - progressA;
          break;
          
        case 'alphabetical':
          // あいうえお順
          comparison = a.text.localeCompare(b.text, 'ja');
          break;
          
        default:
          comparison = 0;
      }
      
      // ソート順序を適用
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }

  /**
   * 🔥 追加: 期限の緊急度を計算
   */
  static getDeadlineUrgency(task: EnhancedTask): 'overdue' | 'today' | 'soon' | 'normal' | 'none' {
    if (!task.deadline) return 'none';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const deadline = new Date(task.deadline);
    deadline.setHours(0, 0, 0, 0);
    
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'today';
    if (diffDays <= 3) return 'soon';
    return 'normal';
  }

  /**
   * 🔥 追加: タスクの重要度スコアを計算（ソートの補助）
   */
  static calculateImportanceScore(task: EnhancedTask): number {
    let score = 0;
    
    // 優先度による加点
    const priorityScores = { 'high': 30, 'medium': 20, 'low': 10 };
    score += priorityScores[task.priority];
    
    // 期限による加点
    const urgency = TaskUtils.getDeadlineUrgency(task);
    const urgencyScores = { 'overdue': 50, 'today': 40, 'soon': 30, 'normal': 10, 'none': 0 };
    score += urgencyScores[urgency];
    
    // 進捗による調整（進捗が低いほど重要）
    const progress = TaskUtils.calculateTotalProgress(task);
    score += (100 - progress) * 0.1;
    
    // 複雑度による加点
    const complexity = TaskUtils.calculateComplexity(task);
    const complexityScores = { 'complex': 15, 'medium': 10, 'simple': 5 };
    score += complexityScores[complexity];
    
    return score;
  }
}