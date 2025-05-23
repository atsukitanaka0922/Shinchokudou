/**
 * ダッシュボードコンポーネント
 * 
 * ユーザーの今日のタスク状況と進捗を表示するダッシュボード
 * 今日の日付、残りのタスク数、完了率などを視覚的に表示します
 */

import { useMemo } from 'react';
import { useEnhancedTaskStore } from '@/store/enhancedTaskStore';
import { motion } from 'framer-motion';

/**
 * ダッシュボードコンポーネント
 * 今日の予定と進捗状況を表示
 */
export default function Dashboard() {
  // タスクデータの取得
  const { tasks } = useEnhancedTaskStore();
  
  // 今日の日付を取得（YYYY-MM-DD形式）
  const today = new Date().toISOString().split('T')[0];
  
  // 今日のタスクとその統計を計算
  const todayStats = useMemo(() => {
    // 今日が期限のタスク
    const todayTasks = tasks.filter(task => task.deadline === today);
    const totalTasks = todayTasks.length;
    const completedTasks = todayTasks.filter(task => task.completed).length;
    
    // 完了率（タスクがない場合は0%）
    const completionRate = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;
    
    return {
      totalTasks,
      completedTasks,
      completionRate,
      remainingTasks: totalTasks - completedTasks
    };
  }, [tasks, today]);

  // 日付表示のフォーマット
  const formattedDate = useMemo(() => {
    const date = new Date();
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }).format(date);
  }, []);

  return (
    <motion.div 
      className="p-4 bg-white rounded-lg shadow-md"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 日付表示 */}
      <h2 className="text-lg font-bold mb-3">📅 今日の予定</h2>
      <p className="text-gray-600 mb-4">{formattedDate}</p>
      
      {/* タスク統計 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">残りのタスク</p>
          <p className="text-xl font-bold text-blue-700">{todayStats.remainingTasks}件</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">完了率</p>
          <p className="text-xl font-bold text-green-700">{todayStats.completionRate}%</p>
        </div>
      </div>
      
      {/* プログレスバー */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <motion.div 
          className="bg-blue-600 h-2.5 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${todayStats.completionRate}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      <p className="text-xs text-gray-500 text-center">
        {todayStats.completedTasks} / {todayStats.totalTasks} タスク完了
      </p>
    </motion.div>
  );
}