/**
 * 締め切り警告コンポーネント
 * 
 * 期限が近いタスクがある場合に警告バナーを表示します
 * フローティングバナーとして画面上部に表示され、ユーザーに通知します
 */

import { useState, useEffect } from 'react';
import { useEnhancedTaskStore } from '@/store/enhancedTaskStore';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 締め切り警告コンポーネント
 * 期限が近いまたは過ぎたタスクがある場合に警告を表示
 */
export default function DeadlineWarning() {
  // ストアからタスクを取得
  const { tasks } = useEnhancedTaskStore();
  
  // 警告表示の状態
  const [showWarning, setShowWarning] = useState(false);
  const [expiredTasks, setExpiredTasks] = useState<string[]>([]);
  const [dueSoonTasks, setDueSoonTasks] = useState<string[]>([]);
  
  // 警告を閉じるフラグ
  const [dismissed, setDismissed] = useState(false);

  // タスクが変更されたときに期限チェックを実行
  useEffect(() => {
    if (dismissed) return;
    
    // 現在の日付を取得
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 明日の日付を取得（期限間近の基準）
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // 3日後の日付を取得
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    
    // 未完了タスクのみを対象にする
    const uncompletedTasks = tasks.filter(task => !task.completed);
    
    // 期限切れのタスクを抽出
    const expiredTaskList = uncompletedTasks
      .filter(task => {
        if (!task.deadline) return false;
        const deadline = new Date(task.deadline);
        return deadline < today;
      })
      .map(task => task.text);
    
    // 期限間近のタスクを抽出（3日以内）
    const dueSoonTaskList = uncompletedTasks
      .filter(task => {
        if (!task.deadline) return false;
        const deadline = new Date(task.deadline);
        return deadline >= today && deadline <= threeDaysLater;
      })
      .map(task => task.text);
    
    // 期限切れまたは期限間近のタスクがある場合、警告を表示
    setExpiredTasks(expiredTaskList);
    setDueSoonTasks(dueSoonTaskList);
    setShowWarning(expiredTaskList.length > 0 || dueSoonTaskList.length > 0);
    
  }, [tasks, dismissed]);

  // 警告がない場合、何も表示しない
  if (!showWarning || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 p-4 bg-yellow-100 shadow-lg"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        exit={{ y: -100 }}
        transition={{ type: 'spring', stiffness: 120 }}
      >
        <div className="max-w-3xl mx-auto flex items-start justify-between">
          <div>
            <h3 className="font-bold text-yellow-800 flex items-center">
              <span className="mr-2">⚠️</span>期限に関する注意
            </h3>
            
            {/* 期限切れタスクの表示 */}
            {expiredTasks.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-red-600 font-semibold">期限切れのタスク:</p>
                <ul className="text-sm text-red-800 ml-5">
                  {expiredTasks.map((task, index) => (
                    <li key={index} className="list-disc">
                      {task.length > 40 ? `${task.substring(0, 40)}...` : task}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* 期限間近タスクの表示 */}
            {dueSoonTasks.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-yellow-700 font-semibold">期限間近のタスク:</p>
                <ul className="text-sm text-yellow-800 ml-5">
                  {dueSoonTasks.map((task, index) => (
                    <li key={index} className="list-disc">
                      {task.length > 40 ? `${task.substring(0, 40)}...` : task}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* 閉じるボタン */}
          <button
            onClick={() => setDismissed(true)}
            className="text-yellow-800 hover:text-yellow-900"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}