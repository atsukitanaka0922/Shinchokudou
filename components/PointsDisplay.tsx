/**
 * ポイント表示コンポーネント
 * 
 * タスク完了時に獲得したポイントを表示し、ポイント履歴を閲覧できるコンポーネント
 * ユーザーの累積ポイント状況を視覚的に表示します
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePointsStore, PointHistory } from '@/store/pointsStore';
import { useAuthStore } from '@/store/auth';

/**
 * ポイント表示コンポーネント
 */
export default function PointsDisplay() {
  const { totalPoints, history, loadPoints } = usePointsStore();
  const { user } = useAuthStore();
  
  const [showHistory, setShowHistory] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // マウント時にポイントデータを読み込む
  useEffect(() => {
    setMounted(true);
    if (user) {
      loadPoints();
    }
  }, [user, loadPoints]);
  
  // まだマウントされていない場合はローディング表示
  if (!mounted) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">💎 ポイント</h2>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-blue-200 rounded w-3/4"></div>
            <div className="h-4 bg-blue-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // ログインしていない場合
  if (!user) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">💎 ポイント</h2>
        <p className="text-gray-600">ログインするとポイント情報が表示されます</p>
      </div>
    );
  }
  
  // ポイント履歴の日付フォーマット
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">💎 ポイント</h2>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-blue-500 hover:text-blue-700 text-sm"
        >
          {showHistory ? "履歴を閉じる" : "履歴を表示"}
        </button>
      </div>
      
      {/* ポイント総数の表示 */}
      <div className="bg-blue-50 rounded-lg p-4 mb-3 text-center">
        <p className="text-gray-700 text-sm mb-1">現在の合計ポイント</p>
        <p className="text-3xl font-bold text-blue-700">{totalPoints} pt</p>
      </div>
      
      {/* ポイントの使い方 */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          タスクを完了するとポイントが貯まります。
          優先度に応じて、高: 30pt、中: 20pt、低: 10ptが基本付与されます。
        </p>
      </div>
      
      {/* ポイント履歴 */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <h3 className="text-sm font-medium text-gray-700 mb-2">最近のポイント履歴</h3>
            
            {history.length === 0 ? (
              <p className="text-sm text-gray-500 p-2 bg-gray-50 rounded">
                ポイント履歴はまだありません
              </p>
            ) : (
              <div className="max-h-60 overflow-y-auto">
                <ul className="space-y-1">
                  {history.map((item) => (
                    <li 
                      key={item.id || item.timestamp} 
                      className="flex justify-between p-2 text-sm bg-gray-50 rounded"
                    >
                      <div>
                        <span className="mr-2 text-gray-700">{item.description}</span>
                        <span className="text-xs text-gray-500">{formatDate(item.timestamp)}</span>
                      </div>
                      <span className={item.points > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {item.points > 0 ? '+' : ''}{item.points} pt
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}