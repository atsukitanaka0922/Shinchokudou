/**
 * タスク統計コンポーネント
 * 
 * タスクの完了率や優先度別の分布などの統計情報を視覚的に表示
 * 円グラフやバーチャートでタスクの進捗状況を可視化します
 */

import { useMemo } from 'react';
import { useEnhancedTaskStore } from '@/store/enhancedTaskStore';
import { motion } from 'framer-motion';

/**
 * タスク統計コンポーネント
 * グラフィカルなタスク統計情報を表示
 */
export default function TaskStats() {
  // タスクデータの取得
  const { tasks } = useEnhancedTaskStore();
  
  // 今日の日付（YYYY-MM-DD形式）
  const today = new Date().toISOString().split('T')[0];

  // 統計データの計算
  const stats = useMemo(() => {
    // 基本的な統計情報
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const remaining = total - completed;
    
    // 期限切れのタスク
    const overdue = tasks.filter(task => 
      !task.completed && 
      task.deadline && 
      task.deadline < today
    ).length;
    
    // 今日が期限のタスク
    const dueToday = tasks.filter(task => 
      !task.completed && 
      task.deadline === today
    ).length;
    
    // 優先度別の集計
    const byPriority = {
      high: tasks.filter(task => task.priority === 'high').length,
      medium: tasks.filter(task => task.priority === 'medium').length,
      low: tasks.filter(task => task.priority === 'low').length,
    };
    
    // 優先度別の完了率
    const completionByPriority = {
      high: {
        total: byPriority.high,
        completed: tasks.filter(task => 
          task.priority === 'high' && task.completed
        ).length,
        rate: byPriority.high > 0 
          ? Math.round((tasks.filter(task => 
              task.priority === 'high' && task.completed
            ).length / byPriority.high) * 100) 
          : 0
      },
      medium: {
        total: byPriority.medium,
        completed: tasks.filter(task => 
          task.priority === 'medium' && task.completed
        ).length,
        rate: byPriority.medium > 0 
          ? Math.round((tasks.filter(task => 
              task.priority === 'medium' && task.completed
            ).length / byPriority.medium) * 100) 
          : 0
      },
      low: {
        total: byPriority.low,
        completed: tasks.filter(task => 
          task.priority === 'low' && task.completed
        ).length,
        rate: byPriority.low > 0 
          ? Math.round((tasks.filter(task => 
              task.priority === 'low' && task.completed
            ).length / byPriority.low) * 100) 
          : 0
      }
    };
    
    return {
      total,
      completed,
      remaining,
      completionRate,
      overdue,
      dueToday,
      byPriority,
      completionByPriority
    };
  }, [tasks, today]);

  // タスクがない場合の表示
  if (stats.total === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">📊 タスク統計</h2>
        <p className="text-gray-600">タスクがありません。新しいタスクを追加すると統計が表示されます。</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">📊 タスク統計</h2>
      
      {/* 全体の完了率 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <p className="text-sm">全体の完了率</p>
          <p className="text-sm font-medium">{stats.completionRate}%</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <motion.div 
            className="bg-blue-600 h-2.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${stats.completionRate}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <div className="mt-1 text-xs text-gray-500 flex justify-between">
          <span>完了: {stats.completed}</span>
          <span>残り: {stats.remaining}</span>
        </div>
      </div>
      
      {/* 優先度別の統計 */}
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2">優先度別の進捗</h3>
        
        {/* 高優先度 */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs">
              <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span>
              高優先度
            </p>
            <p className="text-xs">{stats.completionByPriority.high.rate}% ({stats.completionByPriority.high.completed}/{stats.completionByPriority.high.total})</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <motion.div 
              className="bg-red-500 h-1.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${stats.completionByPriority.high.rate}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>
        
        {/* 中優先度 */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs">
              <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-1"></span>
              中優先度
            </p>
            <p className="text-xs">{stats.completionByPriority.medium.rate}% ({stats.completionByPriority.medium.completed}/{stats.completionByPriority.medium.total})</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <motion.div 
              className="bg-yellow-500 h-1.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${stats.completionByPriority.medium.rate}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>
        
        {/* 低優先度 */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
              低優先度
            </p>
            <p className="text-xs">{stats.completionByPriority.low.rate}% ({stats.completionByPriority.low.completed}/{stats.completionByPriority.low.total})</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <motion.div 
              className="bg-green-500 h-1.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${stats.completionByPriority.low.rate}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>
      </div>
      
      {/* 期限関連の情報 */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-lg ${stats.overdue > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}`}>
          <p className="text-xs mb-1">期限切れ</p>
          <p className="text-xl font-bold">{stats.overdue}</p>
        </div>
        <div className={`p-3 rounded-lg ${stats.dueToday > 0 ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-700'}`}>
          <p className="text-xs mb-1">今日が期限</p>
          <p className="text-xl font-bold">{stats.dueToday}</p>
        </div>
      </div>
    </div>
  );
}