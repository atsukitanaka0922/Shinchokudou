/**
 * タスク移行コンポーネント
 * 
 * 既存のタスクを新しい拡張タスク形式に移行するためのUI
 * ユーザーに移行の必要性を通知し、ワンクリックで移行を実行
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import { useFeedbackStore } from '@/store/feedbackStore';
import { 
  migrateUserTasks, 
  cleanupOldTasks, 
  autoMigrateIfNeeded,
  checkMigrationStatus,
  MigrationLog 
} from '@/lib/dataMigration';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * タスク移行コンポーネント
 */
export default function TaskMigration() {
  const { user } = useAuthStore();
  const { setMessage } = useFeedbackStore();
  
  // ローカル状態
  const [needsMigration, setNeedsMigration] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [autoMigrating, setAutoMigrating] = useState(false);
  const [migrationLog, setMigrationLog] = useState<MigrationLog | null>(null);
  const [oldTasksCount, setOldTasksCount] = useState(0);
  const [showMigration, setShowMigration] = useState(false);
  const [step, setStep] = useState<'check' | 'migrate' | 'cleanup' | 'complete'>('check');

  // 移行の必要性をチェック
  useEffect(() => {
    if (user) {
      checkIfMigrationNeeded();
    }
  }, [user]);

  /**
   * 移行が必要かどうかをチェック
   */
  const checkIfMigrationNeeded = async () => {
    if (!user) return;

    try {
      // 既に移行済みかチェック
      const alreadyMigrated = await checkMigrationStatus(user.uid);
      if (alreadyMigrated) {
        setNeedsMigration(false);
        return;
      }

      // 旧タスクが存在するかチェック
      const oldTasksQuery = query(
        collection(db, "tasks"),
        where("userId", "==", user.uid)
      );
      const oldTasksSnapshot = await getDocs(oldTasksQuery);
      const oldTasksCount = oldTasksSnapshot.docs.length;
      
      setOldTasksCount(oldTasksCount);
      
      if (oldTasksCount > 0) {
        setNeedsMigration(true);
        setShowMigration(true);
        
        // 自動移行を試行
        attemptAutoMigration();
      }
    } catch (error) {
      console.error("移行チェックエラー:", error);
    }
  };

  /**
   * 自動移行を試行
   */
  const attemptAutoMigration = async () => {
    if (!user) return;

    setAutoMigrating(true);
    try {
      const log = await autoMigrateIfNeeded(user.uid);
      if (log) {
        setMigrationLog(log);
        setStep('complete');
        setMessage(`🎉 ${log.migratedTasksCount}件のタスクを新形式に移行しました！`);
        
        // 数秒後に移行UIを非表示
        setTimeout(() => {
          setShowMigration(false);
          setNeedsMigration(false);
        }, 5000);
      }
    } catch (error) {
      console.error("自動移行エラー:", error);
      setMessage("自動移行に失敗しました。手動で移行してください。");
    } finally {
      setAutoMigrating(false);
    }
  };

  /**
   * 手動移行を実行
   */
  const handleManualMigration = async () => {
    if (!user) return;

    setMigrating(true);
    setStep('migrate');
    
    try {
      const log = await migrateUserTasks(user.uid);
      setMigrationLog(log);
      
      if (log.migratedTasksCount > 0) {
        setMessage(`✅ ${log.migratedTasksCount}件のタスクを移行しました！`);
        setStep('cleanup');
      } else {
        setMessage("移行するタスクがありませんでした。");
        setStep('complete');
      }
    } catch (error) {
      console.error("手動移行エラー:", error);
      setMessage("移行に失敗しました。もう一度お試しください。");
      setStep('check');
    } finally {
      setMigrating(false);
    }
  };

  /**
   * 古いタスクをクリーンアップ
   */
  const handleCleanup = async () => {
    if (!user) return;

    try {
      await cleanupOldTasks(user.uid);
      setMessage("古いタスクデータを削除しました。");
      setStep('complete');
      
      // 数秒後に移行UIを非表示
      setTimeout(() => {
        setShowMigration(false);
        setNeedsMigration(false);
      }, 3000);
    } catch (error) {
      console.error("クリーンアップエラー:", error);
      setMessage("古いデータの削除に失敗しましたが、移行は完了しています。");
    }
  };

  /**
   * 移行をスキップ
   */
  const handleSkip = () => {
    setShowMigration(false);
    setMessage("移行をスキップしました。後で設定から実行できます。");
  };

  // 移行が不要または非表示の場合は何も表示しない
  if (!needsMigration || !showMigration) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          {/* ヘッダー */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">📦 データ移行</h2>
            <p className="text-sm text-gray-600 mt-1">
              新機能を使用するためにタスクデータを更新します
            </p>
          </div>

          {/* 自動移行中 */}
          {autoMigrating && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
              <p className="text-gray-600">自動移行を実行中...</p>
              <p className="text-xs text-gray-500 mt-1">
                {oldTasksCount}件のタスクを処理しています
              </p>
            </div>
          )}

          {/* 移行ステップ表示 */}
          {!autoMigrating && (
            <>
              {step === 'check' && (
                <div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-blue-800 mb-2">
                      🔍 移行対象のタスクを発見
                    </h3>
                    <p className="text-sm text-blue-700">
                      {oldTasksCount}件の既存タスクが見つかりました。
                      新しいサブタスクやメモ機能を使用するために、データ形式を更新する必要があります。
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleManualMigration}
                      disabled={migrating}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {migrating ? '移行中...' : '今すぐ移行する'}
                    </button>
                    
                    <button
                      onClick={handleSkip}
                      className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                    >
                      後で実行する
                    </button>
                  </div>
                </div>
              )}

              {step === 'migrate' && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                  <p className="text-gray-600">タスクを移行中...</p>
                </div>
              )}

              {step === 'cleanup' && migrationLog && (
                <div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-green-800 mb-2">
                      ✅ 移行完了
                    </h3>
                    <p className="text-sm text-green-700 mb-2">
                      {migrationLog.migratedTasksCount}件のタスクを正常に移行しました！
                    </p>
                    <p className="text-xs text-green-600">
                      古いデータを削除しますか？（推奨）
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleCleanup}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                    >
                      古いデータを削除する（推奨）
                    </button>
                    
                    <button
                      onClick={() => setStep('complete')}
                      className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                    >
                      古いデータを保持する
                    </button>
                  </div>
                </div>
              )}

              {step === 'complete' && migrationLog && (
                <div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-center">
                    <div className="text-4xl mb-2">🎉</div>
                    <h3 className="font-medium text-green-800 mb-2">
                      移行完了！
                    </h3>
                    <p className="text-sm text-green-700">
                      サブタスクやメモ機能が利用できるようになりました。
                    </p>
                  </div>

                  <div className="text-xs text-gray-600 space-y-1">
                    <p>移行済み: {migrationLog.migratedTasksCount}件</p>
                    {migrationLog.skippedTasksCount > 0 && (
                      <p>スキップ: {migrationLog.skippedTasksCount}件</p>
                    )}
                    {migrationLog.errors.length > 0 && (
                      <p className="text-red-600">エラー: {migrationLog.errors.length}件</p>
                    )}
                  </div>

                  <button
                    onClick={() => setShowMigration(false)}
                    className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                  >
                    完了
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}