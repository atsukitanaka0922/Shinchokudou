/**
 * ポイントダッシュボードコンポーネント
 * 
 * ユーザーのポイント残高、獲得履歴、連続ログイン情報を表示
 * ログインボーナスの受け取りボタンも含む
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePointStore } from '@/store/pointStore';
import { useAuthStore } from '@/store/auth';

/**
 * ポイントダッシュボードコンポーネント
 */
export default function PointsDashboard() {
  // ストアからの状態取得
  const { 
    userPoints, 
    pointHistory, 
    loading,
    loadUserPoints,
    loadPointHistory,
    checkAndAwardLoginBonus,
    getTodayPoints,
    getWeeklyPoints
  } = usePointStore();
  
  const { user } = useAuthStore();
  
  // ローカル状態
  const [showHistory, setShowHistory] = useState(false);
  const [isClaimingBonus, setIsClaimingBonus] = useState(false);
  const [loginBonusChecked, setLoginBonusChecked] = useState(false); // 重複防止フラグ

  // データ読み込み
  useEffect(() => {
    if (user) {
      console.log("ポイントダッシュボード: ユーザーデータ読み込み開始");
      
      // エラーハンドリング付きでデータ読み込み
      const loadData = async () => {
        try {
          await loadUserPoints();
          await loadPointHistory();
        } catch (error) {
          console.error("ポイントデータ読み込みエラー:", error);
        }
      };
      
      loadData();
    }
  }, [user, loadUserPoints, loadPointHistory]);

  // ログインボーナスの自動チェック（初回読み込み時のみ）
  useEffect(() => {
    if (user && userPoints && !loading && !loginBonusChecked) {
      // 今日まだログインボーナスを受け取っていない場合、自動で付与
      const today = new Date().toISOString().split('T')[0];
      if (userPoints.lastLoginBonusDate !== today) {
        console.log("自動ログインボーナスをチェック中...");
        setLoginBonusChecked(true); // フラグを立てて重複実行を防止
        
        checkAndAwardLoginBonus().catch(error => {
          console.error("ログインボーナス付与エラー:", error);
          setLoginBonusChecked(false); // エラー時はフラグをリセット
        });
      } else {
        setLoginBonusChecked(true); // 既に受け取り済みの場合もフラグを立てる
      }
    }
  }, [user, userPoints, loading, loginBonusChecked, checkAndAwardLoginBonus]);

  /**
   * 手動でログインボーナスを受け取る
   */
  const handleClaimLoginBonus = async () => {
    setIsClaimingBonus(true);
    try {
      await checkAndAwardLoginBonus();
    } catch (error) {
      console.error("手動ログインボーナス取得エラー:", error);
    } finally {
      setIsClaimingBonus(false);
    }
  };

  /**
   * デバッグ用：ログインボーナス状態をリセット（開発時のみ）
   */
  const handleResetLoginBonus = () => {
    if (user && process.env.NODE_ENV === 'development') {
      loginBonusManager.resetUser(user.uid);
      setLoginBonusChecked(false);
      console.log("ログインボーナス状態をリセットしました（開発モード）");
    }
  };

  /**
   * 連続ログイン日数に応じた絵文字を取得
   */
  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '👑';
    if (streak >= 14) return '🔥';
    if (streak >= 7) return '⭐';
    if (streak >= 3) return '✨';
    return '🎯';
  };

  /**
   * ポイント履歴のタイプに応じたアイコンを取得
   */
  const getHistoryIcon = (type: string, points: number) => {
    if (points < 0) {
      return '📤'; // 減算の場合
    }
    
    switch (type) {
      case 'task_completion': return '✅';
      case 'login_bonus': return '🎁';
      case 'daily_bonus': return '📅';
      case 'streak_bonus': return '🔥';
      default: return '💎';
    }
  };

  /**
   * ポイント履歴のタイプ名を日本語化
   */
  const getHistoryTypeName = (type: string) => {
    switch (type) {
      case 'task_completion': return 'タスク完了';
      case 'login_bonus': return 'ログインボーナス';
      case 'daily_bonus': return '日次ボーナス';
      case 'streak_bonus': return '連続ボーナス';
      default: return 'その他';
    }
  };

  // ユーザーがログインしていない場合
  if (!user) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">💎 ポイント</h2>
        <p className="text-gray-600">ログインするとポイント情報が表示されます</p>
      </div>
    );
  }

  // データ読み込み中
  if (loading || !userPoints) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">💎 ポイント</h2>
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const todayPoints = getTodayPoints();
  const weeklyPoints = getWeeklyPoints();
  const today = new Date().toISOString().split('T')[0];
  const canClaimBonus = userPoints.lastLoginBonusDate !== today;

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          💎 ポイント
        </h2>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-sm text-blue-500 hover:text-blue-700"
        >
          {showHistory ? '閉じる' : '履歴を見る'}
        </button>
      </div>

      {/* メインポイント表示 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <motion.div 
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-lg text-center"
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-xs opacity-90">現在のポイント</p>
          <p className="text-xl font-bold">{userPoints.currentPoints.toLocaleString()}</p>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-3 rounded-lg text-center"
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-xs opacity-90">総獲得ポイント</p>
          <p className="text-xl font-bold">{userPoints.totalPoints.toLocaleString()}</p>
        </motion.div>
      </div>

      {/* 連続ログイン情報 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-yellow-800 flex items-center">
              {getStreakEmoji(userPoints.loginStreak)} 連続ログイン
            </p>
            <p className="text-lg font-bold text-yellow-900">
              {userPoints.loginStreak}日
              {userPoints.maxLoginStreak > userPoints.loginStreak && (
                <span className="text-xs text-yellow-600 ml-1">
                  (最高: {userPoints.maxLoginStreak}日)
                </span>
              )}
            </p>
          </div>
          
          {/* ログインボーナス受け取りボタン */}
          {canClaimBonus && (
            <motion.button
              onClick={handleClaimLoginBonus}
              disabled={isClaimingBonus}
              className="px-3 py-1 bg-yellow-500 text-white text-xs rounded-md hover:bg-yellow-600 disabled:bg-gray-400"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isClaimingBonus ? '受け取り中...' : '🎁 受け取る'}
            </motion.button>
          )}
        </div>
      </div>

      {/* 今日・今週の獲得ポイント */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 p-2 rounded text-center">
          <p className="text-xs text-blue-600">今日</p>
          <p className={`text-sm font-semibold ${todayPoints >= 0 ? 'text-blue-800' : 'text-red-600'}`}>
            {todayPoints >= 0 ? '+' : ''}{todayPoints}
          </p>
        </div>
        <div className="bg-green-50 p-2 rounded text-center">
          <p className="text-xs text-green-600">今週</p>
          <p className={`text-sm font-semibold ${weeklyPoints >= 0 ? 'text-green-800' : 'text-red-600'}`}>
            {weeklyPoints >= 0 ? '+' : ''}{weeklyPoints}
          </p>
        </div>
      </div>

      {/* ポイント履歴 */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t pt-3 overflow-hidden"
          >
            <h3 className="text-md font-medium mb-2">📊 最近の獲得履歴</h3>
            {pointHistory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-2">
                まだポイント履歴がありません
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {pointHistory.slice(0, 10).map((history) => (
                  <div 
                    key={history.id || history.timestamp} 
                    className="flex justify-between items-center bg-gray-50 p-2 rounded text-xs"
                  >
                    <div className="flex items-center">
                      <span className="mr-2">{getHistoryIcon(history.type)}</span>
                      <div>
                        <p className="font-medium">{history.description}</p>
                        <p className="text-gray-500">
                          {getHistoryTypeName(history.type)} • {history.date}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-green-600">
                      +{history.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}