/**
 * ログインボーナスルーレットコンポーネント
 * 
 * ログイン時に表示されるボーナスポイント付与用ルーレット
 * アニメーション付きのルーレットUIと結果表示を提供
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import { getRouletteOptions, hasReceivedTodayBonus, giveLoginBonus } from '@/lib/loginBonusService';
import { useFeedbackStore } from '@/store/feedbackStore';

// ルーレットのオプション型
interface BonusOption {
  points: number;
  label: string;
  probability: number;
  color: string;
}

/**
 * ログインボーナスルーレットコンポーネント
 */
export default function LoginBonusRoulette() {
  const { user } = useAuthStore();
  const { setMessage } = useFeedbackStore();
  
  // 状態管理
  const [showRoulette, setShowRoulette] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [hasReceived, setHasReceived] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rouletteOptions, setRouletteOptions] = useState<BonusOption[]>([]);
  const [rotationDegree, setRotationDegree] = useState(0);
  const [result, setResult] = useState<{
    rouletteBonus: BonusOption;
    consecutiveDays: number;
    consecutiveBonus: number;
    totalBonus: number;
  } | null>(null);
  
  // ルーレットの回転参照
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // ログイン時にボーナスのチェック
  useEffect(() => {
    if (user && !hasChecked) {
      checkLoginBonus();
    }
  }, [user, hasChecked]);
  
  // マウント時にルーレットオプションを取得
  useEffect(() => {
    setRouletteOptions(getRouletteOptions());
  }, []);
  
  // アンマウント時にタイマーをクリーンアップ
  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
      }
    };
  }, []);
  
  /**
   * ログインボーナスの状態をチェック
   */
  const checkLoginBonus = async () => {
    if (!user) return;
    
    try {
      const alreadyReceived = await hasReceivedTodayBonus(user.uid);
      setHasReceived(alreadyReceived);
      
      if (!alreadyReceived) {
        // まだ受け取っていなければルーレットを表示
        setShowRoulette(true);
      }
      
      setHasChecked(true);
    } catch (error) {
      console.error("ログインボーナスチェックエラー:", error);
      setHasChecked(true);
    }
  };
  
  /**
   * ルーレットを回す
   */
  const spinRoulette = async () => {
    if (!user || isSpinning) return;
    
    setIsSpinning(true);
    
    try {
      // 回転アニメーションの開始
      const randomRotations = 5 + Math.random() * 5; // 5〜10回転
      const totalRotation = 360 * randomRotations;
      setRotationDegree(totalRotation);
      
      // アニメーション完了後に結果を表示
      spinTimeoutRef.current = setTimeout(async () => {
        try {
          // サーバーサイドでボーナス付与
          const bonusResult = await giveLoginBonus(user.uid);
          
          // 結果を表示
          setResult(bonusResult);
          
          // フィードバック表示
          if (bonusResult.consecutiveBonus > 0) {
            setMessage(`${bonusResult.consecutiveDays}日連続ログイン達成！ボーナスポイントを獲得しました！`);
          } else {
            setMessage('ログインボーナスを獲得しました！');
          }
          
          // ルーレットの状態を更新
          setHasReceived(true);
        } catch (error) {
          console.error("ボーナス付与エラー:", error);
          setMessage('ボーナス付与中にエラーが発生しました');
        } finally {
          setIsSpinning(false);
        }
      }, 3000); // 3秒後に結果表示
    } catch (error) {
      console.error("ルーレット実行エラー:", error);
      setIsSpinning(false);
      setMessage('ルーレットの実行中にエラーが発生しました');
    }
  };
  
  /**
   * ルーレットを閉じる
   */
  const closeRoulette = () => {
    setShowRoulette(false);
  };
  
  // ユーザーがログインしていない場合は何も表示しない
  if (!user) return null;
  
  // まだチェックが完了していない場合はローディング表示
  if (!hasChecked) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <p className="text-center">ログインボーナスを確認中...</p>
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // すでに今日のボーナスを受け取っている場合は何も表示しない
  if (hasReceived && !result) return null;
  
  return (
    <AnimatePresence>
      {showRoulette && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">🎉 ログインボーナス 🎉</h2>
              <p className="text-gray-600 mt-1">
                {result 
                  ? `${result.consecutiveDays}日連続ログイン！` 
                  : 'ルーレットを回してボーナスポイントをゲット！'}
              </p>
            </div>
            
            {!result ? (
              // ルーレット表示（結果が出る前）
              <div className="relative my-8">
                {/* ルーレット本体 */}
                <div className="relative mx-auto w-64 h-64">
                  <div className="absolute top-0 left-1/2 w-0 h-0 -mt-4 -ml-4 z-20">
                    <div className="w-8 h-8 bg-red-500 transform rotate-45"></div>
                  </div>
                  
                  <motion.div
                    className="w-64 h-64 rounded-full overflow-hidden border-4 border-gray-300 relative"
                    animate={{ rotate: rotationDegree }}
                    transition={{ duration: 3, ease: "easeOut" }}
                  >
                    {/* ルーレットのセクション */}
                    {rouletteOptions.map((option, index) => {
                      const segmentDegree = 360 / rouletteOptions.length;
                      const startDegree = index * segmentDegree;
                      
                      return (
                        <div
                          key={index}
                          className="absolute top-0 left-0 w-full h-full flex items-center justify-center"
                          style={{
                            transform: `rotate(${startDegree}deg)`,
                            transformOrigin: 'center',
                            clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((segmentDegree * Math.PI) / 180)}% ${50 - 50 * Math.sin((segmentDegree * Math.PI) / 180)}%, 50% 50%)`,
                            backgroundColor: option.color
                          }}
                        >
                          <div 
                            className="text-center font-bold text-sm"
                            style={{ 
                              transform: `rotate(${segmentDegree / 2}deg) translateY(-32px)` 
                            }}
                          >
                            {option.label}
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                </div>
                
                {/* 回転ボタン */}
                <div className="text-center mt-6">
                  <button
                    onClick={spinRoulette}
                    disabled={isSpinning}
                    className={`px-6 py-2 rounded-full ${
                      isSpinning
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white transition`}
                  >
                    {isSpinning ? 'ルーレット回転中...' : 'ルーレットを回す'}
                  </button>
                </div>
              </div>
            ) : (
              // 結果表示（ボーナス獲得後）
              <div className="my-6 text-center">
                <div className="bg-blue-100 rounded-lg p-4 mb-4">
                  <p className="text-lg">
                    <span className="font-bold text-blue-800">
                      {result.rouletteBonus.label}
                    </span> 獲得！
                  </p>
                  
                  {result.consecutiveBonus > 0 && (
                    <div className="mt-2 bg-green-100 p-2 rounded">
                      <p className="text-green-800">
                        {result.consecutiveDays}日連続ログインボーナス: +{result.consecutiveBonus}ポイント
                      </p>
                    </div>
                  )}
                  
                  <p className="mt-3 text-xl font-bold text-blue-600">
                    合計: {result.totalBonus}ポイント
                  </p>
                </div>
                
                <button
                  onClick={closeRoulette}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition"
                >
                  OK
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}