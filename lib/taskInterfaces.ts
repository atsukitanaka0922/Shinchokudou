/**
 * 拡張タスクインターフェース
 * 
 * サブタスクとメモ機能を含む拡張されたタスクの型定義
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
 * タスクのソート条件
 */
export type TaskSortBy = 'created' | 'deadline' | 'priority' | 'progress' | 'alphabetical';

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
}