/**
 * データ移行ユーティリティ
 * 
 * 既存のtasksコレクションから新しいenhancedTasksコレクションへのデータ移行
 * ユーザーの既存タスクを失わずに新機能に移行するためのツール
 */

import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  query, 
  where, 
  writeBatch,
  deleteDoc
} from "firebase/firestore";
import { Task } from "@/store/taskStore";
import { EnhancedTask } from "@/lib/taskInterfaces";
import { PriorityLevel } from "@/lib/aiPriorityAssignment";

/**
 * 移行ログのインターフェース
 */
export interface MigrationLog {
  userId: string;
  migratedAt: number;
  originalTasksCount: number;
  migratedTasksCount: number;
  skippedTasksCount: number;
  errors: string[];
}

/**
 * 既存タスクを拡張タスク形式に変換
 */
function convertToEnhancedTask(oldTask: Task): Omit<EnhancedTask, 'id'> {
  const enhancedTask: any = {
    text: oldTask.text,
    completed: oldTask.completed,
    completedAt: oldTask.completedAt || null,
    userId: oldTask.userId,
    order: oldTask.order || 0,
    priority: (oldTask.priority as PriorityLevel) || 'medium',
    createdAt: oldTask.createdAt || Date.now(),
    scheduledForDeletion: oldTask.scheduledForDeletion || false,
    
    // 新機能のデフォルト値（undefinedを避ける）
    subTasks: [],
    subTasksCount: 0,
    completedSubTasksCount: 0
  };

  // 条件付きでフィールドを追加（undefinedを避ける）
  if (oldTask.deadline) {
    enhancedTask.deadline = oldTask.deadline;
  }

  return enhancedTask;
}

/**
 * ユーザーのタスクデータを移行
 */
export async function migrateUserTasks(userId: string): Promise<MigrationLog> {
  console.log(`ユーザー ${userId} のタスクデータ移行を開始`);
  
  const migrationLog: MigrationLog = {
    userId,
    migratedAt: Date.now(),
    originalTasksCount: 0,
    migratedTasksCount: 0,
    skippedTasksCount: 0,
    errors: []
  };

  try {
    // 既存のタスクを取得
    const oldTasksQuery = query(
      collection(db, "tasks"),
      where("userId", "==", userId)
    );
    const oldTasksSnapshot = await getDocs(oldTasksQuery);
    const oldTasks = oldTasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Task[];

    migrationLog.originalTasksCount = oldTasks.length;
    console.log(`移行対象タスク: ${oldTasks.length}件`);

    if (oldTasks.length === 0) {
      console.log("移行するタスクがありません");
      return migrationLog;
    }

    // 既に拡張タスクが存在するかチェック
    const enhancedTasksQuery = query(
      collection(db, "enhancedTasks"),
      where("userId", "==", userId)
    );
    const enhancedTasksSnapshot = await getDocs(enhancedTasksQuery);
    
    if (enhancedTasksSnapshot.docs.length > 0) {
      console.log("既に拡張タスクが存在します。重複移行を防止します。");
      migrationLog.errors.push("拡張タスクが既に存在するため、移行をスキップしました");
      return migrationLog;
    }

    // 個別にタスクを移行（バッチ処理を避けてエラーを分離）
    for (const oldTask of oldTasks) {
      try {
        const enhancedTaskData = convertToEnhancedTask(oldTask);
        const enhancedTaskRef = doc(db, "enhancedTasks", oldTask.id);
        
        // 個別にsetDoc実行
        await setDoc(enhancedTaskRef, enhancedTaskData);
        migrationLog.migratedTasksCount++;
        
        console.log(`タスク ${oldTask.id} を移行しました`);
      } catch (error) {
        console.error(`タスク ${oldTask.id} の移行でエラー:`, error);
        migrationLog.errors.push(`タスク ${oldTask.id}: ${error}`);
        migrationLog.skippedTasksCount++;
      }
    }

    console.log(`移行完了: ${migrationLog.migratedTasksCount}件成功, ${migrationLog.skippedTasksCount}件スキップ`);
    
    // 移行ログを保存（エラーが発生してもログは保存）
    try {
      await saveMigrationLog(migrationLog);
    } catch (logError) {
      console.error("移行ログの保存でエラー:", logError);
      // ログ保存エラーは移行の成功に影響しない
    }
    
    return migrationLog;
    
  } catch (error) {
    console.error("タスク移行でエラーが発生:", error);
    migrationLog.errors.push(`移行エラー: ${error}`);
    
    // エラーが発生してもログは保存を試行
    try {
      await saveMigrationLog(migrationLog);
    } catch (logError) {
      console.error("エラー時の移行ログ保存でエラー:", logError);
    }
    
    throw error;
  }
}

/**
 * 移行後に古いタスクを削除（オプション）
 */
export async function cleanupOldTasks(userId: string): Promise<void> {
  console.log(`ユーザー ${userId} の古いタスクを削除中...`);
  
  try {
    const oldTasksQuery = query(
      collection(db, "tasks"),
      where("userId", "==", userId)
    );
    const oldTasksSnapshot = await getDocs(oldTasksQuery);
    
    const batch = writeBatch(db);
    let deleteCount = 0;
    
    oldTasksSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      deleteCount++;
    });
    
    if (deleteCount > 0) {
      await batch.commit();
      console.log(`${deleteCount}件の古いタスクを削除しました`);
    }
  } catch (error) {
    console.error("古いタスクの削除でエラー:", error);
    throw error;
  }
}

/**
 * 移行ログを保存
 */
async function saveMigrationLog(log: MigrationLog): Promise<void> {
  try {
    // ログIDをユーザーIDベースの単純な形式に変更
    const logId = `${log.userId}_migration`;
    const logRef = doc(db, "migrationLogs", logId);
    
    // ログデータからundefinedを除去
    const cleanLog = {
      userId: log.userId,
      migratedAt: log.migratedAt,
      originalTasksCount: log.originalTasksCount || 0,
      migratedTasksCount: log.migratedTasksCount || 0,
      skippedTasksCount: log.skippedTasksCount || 0,
      errors: log.errors || []
    };
    
    await setDoc(logRef, cleanLog);
    console.log("移行ログを保存しました:", logId);
  } catch (error) {
    console.error("移行ログの保存でエラー:", error);
    // ログ保存の失敗は移行の成功に影響しないため、エラーを投げない
  }
}

/**
 * ユーザーの移行履歴を確認
 */
export async function checkMigrationStatus(userId: string): Promise<boolean> {
  try {
    // シンプルなIDでドキュメント取得
    const logRef = doc(db, "migrationLogs", `${userId}_migration`);
    const logSnap = await getDoc(logRef);
    
    const exists = logSnap.exists();
    console.log(`移行履歴チェック - ユーザー ${userId}: ${exists ? '移行済み' : '未移行'}`);
    return exists;
  } catch (error) {
    console.error("移行履歴確認エラー:", error);
    // エラーの場合は安全のため「未移行」として扱う
    return false;
  }
}

/**
 * 自動移行チェック
 * アプリ起動時に実行される自動移行機能
 */
export async function autoMigrateIfNeeded(userId: string): Promise<MigrationLog | null> {
  try {
    // 既に移行済みかチェック
    const alreadyMigrated = await checkMigrationStatus(userId);
    if (alreadyMigrated) {
      console.log("ユーザーは既に移行済みです");
      return null;
    }
    
    // 旧タスクが存在するかチェック
    const oldTasksQuery = query(
      collection(db, "tasks"),
      where("userId", "==", userId)
    );
    const oldTasksSnapshot = await getDocs(oldTasksQuery);
    
    if (oldTasksSnapshot.docs.length === 0) {
      console.log("移行するタスクがありません");
      return null;
    }
    
    console.log("自動移行を実行します...");
    return await migrateUserTasks(userId);
    
  } catch (error) {
    console.error("自動移行チェックでエラー:", error);
    return null;
  }
}