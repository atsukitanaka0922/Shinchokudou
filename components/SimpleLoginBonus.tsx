/**
 * シンプルログインボーナスコンポーネント
 * 
 * ログイン時に自動的にポイントを付与し、
 * アニメーション付きでボーナス情報を表示する
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import { hasReceivedTodayBonus, giveLoginBonus, getLoginStats } from '@/lib/simpleLoginBonusService';

interface LoginBonusData {
  points: number;
  consecutiveDays: number;
  isNewRecord: boolean;
}

interface LoginStats {
  totalLogins: number;
  currentStreak: number;
  longestStreak: number;
  totalBonusPoints: number;
}

/**
 * ログインボーナス表示コンポーネント
 */
const SimpleLoginBonus = () => {
  const { user } = useAuthStore();
  
  // 状態管理
  const [bonusData, setBonusData] = useState<LoginBonusData | null>(null);
  const [showBonus, setShowBonus] = useState(false);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<LoginStats | null>(null);
  
  // ユーザーログイン時にボーナスをチェック
  useEffect(() => {
    if (user && !checked) {
      checkAndGiveLoginBonus();
    }
  }, [user, checked]);
  
  /**
   * ログインボーナスをチェックして付与
   */
  const checkAndGiveLoginBonus = async () => {
    if (!user) return;
    
    setLoading(true);
    setChecked(true);
    
    try {
      // 既に受け取り済みかチェック
      const alreadyReceived = await hasReceivedTodayBonus(user.uid);
      
      if (!alreadyReceived) {
        // ボーナスを付与
        const result = await giveLoginBonus(user.uid);
        
        if (result) {
          setBonusData(result);
          setShowBonus(true);
          
          // 5秒後に自動で閉じる
          setTimeout(() => {
            setShowBonus(false);
          }, 5000);
        }
      }
      
      // 統計情報を取得
      const userStats = await getLoginStats(user.uid);
      setStats(userStats);
    } catch (error) {
      console.error("ログインボーナス処理エラー:", error);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * ボーナスダイアログを閉じる
   */
  const closeBonus = () => {
    setShowBonus(false);
  };
  
  // ユーザーがログインしていない場合は何も表示しない
  if (!user) return null;
  
  return (
    <>
      {/* ローディング表示 */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <p className="text-center mb-3">ログインボーナスを確認中...</p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* ボーナス表示ダイアログ */}
      <AnimatePresence>
        {showBonus && bonusData && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-yellow-50 to-orange-50 p-8 rounded-xl shadow-2xl max-w-md w-full text-center"
              initial={{ scale: 0.7, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, y: 50 }}
              transition={{ type: "spring", damping: 15 }}
            >
              {/* ヘッダー */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold text-orange-600 mb-2">🎁 ログインボーナス！</h2>
                <div className="text-6xl mb-4">
                  {bonusData.isNewRecord ? '🏆' : bonusData.consecutiveDays > 7 ? '🔥' : '⭐'}
                </div>
              </motion.div>
              
              {/* ポイント表示 */}
              <motion.div
                className="bg-white rounded-lg p-6 shadow-inner mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              >
                <h3 className="text-xl font-semibold text-gray-700 mb-2">獲得ポイント</h3>
                <motion.p
                  className="text-4xl font-bold text-green-600"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
                >
                  +{bonusData.points} pt
                </motion.p>
              </motion.div>
              
              {/* 連続ログイン情報 */}
              <motion.div
                className="bg-blue-50 rounded-lg p-4 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <h4 className="text-lg font-semibold text-blue-700 mb-2">
                  連続ログイン
                </h4>
                <div className="flex justify-center items-baseline">
                  <span className="text-3xl font-bold text-blue-600">{bonusData.consecutiveDays}</span>
                  <span className="text-lg text-blue-500 ml-1">日</span>
                </div>
                
                {bonusData.isNewRecord && (
                  <motion.p
                    className="text-sm text-red-500 font-semibold mt-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1, type: "spring", stiffness: 300 }}
                  >
                    🎉 新記録達成！
                  </motion.p>
                )}
                
                <div className="mt-2 text-xs text-gray-600">
                  <p>毎日ログインで+1pt ずつ増加</p>
                  <p>最大 100pt まで</p>
                </div>
              </motion.div>
              
              {/* 閉じるボタン */}
              <motion.button
                onClick={closeBonus}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ✨ ありがとう！
              </motion.button>
              
              {/* 自動クローズ案内 */}
              <motion.p
                className="text-xs text-gray-500 mt-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                （5秒後に自動で閉じます）
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 統計情報（オプション：フローティングメニューに統合可能） */}
      {stats && !showBonus && (
        <motion.div
          className="fixed bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg z-30"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2 }}
        >
          <h5 className="text-sm font-semibold text-gray-700 mb-2">📊 ログイン統計</h5>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-500">現在のストリーク</span>
              <p className="font-bold text-blue-600">{stats.currentStreak}日</p>
            </div>
            <div>
              <span className="text-gray-500">最長ストリーク</span>
              <p className="font-bold text-purple-600">{stats.longestStreak}日</p>
            </div>
            <div>
              <span className="text-gray-500">総ログイン回数</span>
              <p className="font-bold text-green-600">{stats.totalLogins}回</p>
            </div>
            <div>
              <span className="text-gray-500">累計ボーナス</span>
              <p className="font-bold text-orange-600">{stats.totalBonusPoints}pt</p>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default SimpleLoginBonus;