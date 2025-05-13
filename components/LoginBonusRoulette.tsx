/**
 * ログインボーナスルーレットコンポーネント（UI改良版）
 * 
 * アニメーション付きのルーレットUIを全面的に改良し、
 * より見やすく楽しいユーザー体験を提供
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import { getRouletteOptions, hasReceivedTodayBonus, spinRoulette } from '@/lib/loginBonusService';
import { useFeedbackStore } from '@/store/feedbackStore';
// 追加のインポート
import { addPointsSafely } from '@/lib/fixedPointHandler';
import { calculateConsecutiveDaysSafely, getTodayDate, CONSECUTIVE_LOGIN_BONUS } from '@/lib/loginBonusService';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { forceTokenRefresh } from '@/lib/authTokenRefresh';

// ルーレットのオプション型
interface BonusOption {
  points: number;
  label: string;
  probability: number;
  color: string;
}

/**
 * ログインボーナスを付与する（エラー処理強化版）
 * @param userId ユーザーID
 * @param selectedOption 選択されたルーレットオプション
 * @returns ボーナス情報
 */
const giveLoginBonusSafelyWithOption = async (userId: string, selectedOption: BonusOption): Promise<{
  rouletteBonus: BonusOption;
  consecutiveDays: number;
  consecutiveBonus: number;
  totalBonus: number;
} | null> => {
  try {
    // 認証状態を確認
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error("認証エラー: ユーザーIDが一致しません");
    }
    
    // 選択されたオプションを使用
    const rouletteBonus = selectedOption;
    
    // 連続ログイン日数を計算（認証エラー対策版）
    const consecutiveDays = await calculateConsecutiveDaysSafely(userId);
    
    // 連続ログイン特典があるかチェック
    let consecutiveBonus = 0;
    for (const [days, bonus] of Object.entries(CONSECUTIVE_LOGIN_BONUS)) {
      if (consecutiveDays === parseInt(days)) {
        consecutiveBonus = bonus;
        break;
      }
    }
    
    // 合計ボーナスを計算
    const totalBonus = rouletteBonus.points + consecutiveBonus;
    
    // ログイン記録を保存する（ポイント付与の前に記録）
    const today = getTodayDate();
    const loginRecord = {
      userId,
      date: today,
      timestamp: Date.now(),
      receivedBonus: true,
      bonusPoints: totalBonus,
      consecutiveDays
    };
    
    // ドキュメントIDを日付+ユーザーIDにする（重複防止）
    const docId = `${today}_${userId}`;
    
    try {
      // Firestoreにログイン記録を保存
      await setDoc(doc(db, "loginRecords", docId), loginRecord);
      console.log("ログイン記録を保存しました:", docId);
    } catch (error) {
      if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
        // 権限エラーの場合、トークンを更新して再試行
        await forceTokenRefresh();
        await setDoc(doc(db, "loginRecords", docId), loginRecord);
        console.log("トークン更新後、ログイン記録を保存しました:", docId);
      } else {
        throw error; // その他のエラーは上位で処理
      }
    }
    
    // ポイントを付与（安全な方法で）
    const pointsAdded = await addPointsSafely(
      userId,
      totalBonus,
      consecutiveBonus > 0 
        ? `ログインボーナス（${consecutiveDays}日連続ログイン！）` 
        : 'ログインボーナス',
      true // ポイント数を表示しない（サプライズ要素）
    );
    
    if (!pointsAdded) {
      console.warn("ポイント付与に失敗しましたが、ログイン記録は保存されました");
    }
    
    // フィードバックを表示
    const feedbackStore = useFeedbackStore.getState();
    if (consecutiveBonus > 0) {
      feedbackStore.setMessage(`${consecutiveDays}日連続ログイン達成！ボーナスポイントを獲得しました！`);
    }
    
    return {
      rouletteBonus,
      consecutiveDays,
      consecutiveBonus,
      totalBonus
    };
  } catch (error) {
    // エラーをより詳細に処理
    console.error("ログインボーナス付与エラー詳細:", error);
    
    // フィードバック表示
    const feedbackStore = useFeedbackStore.getState();
    feedbackStore.setMessage("ログインボーナスの付与に失敗しました。ページを更新してください。");
    
    return null;
  }
};

/**
 * ルーレットのスライス描画関数
 */
const createSVGSlice = (option: BonusOption, index: number, total: number, radius: number = 120) => {
  const angle = (2 * Math.PI) / total;
  const startAngle = index * angle - Math.PI / 2; // -Math.PI/2で上から開始
  const endAngle = (index + 1) * angle - Math.PI / 2;
  
  // パスの座標計算
  const x1 = Math.cos(startAngle) * radius;
  const y1 = Math.sin(startAngle) * radius;
  const x2 = Math.cos(endAngle) * radius;
  const y2 = Math.sin(endAngle) * radius;
  
  // 大きい弧フラグ
  const largeArcFlag = angle > Math.PI ? 1 : 0;
  
  // SVGパス作成
  const pathData = [
    "M", 0, 0, // 中心から開始
    "L", x1, y1, // 開始角度の端へ
    "A", radius, radius, 0, largeArcFlag, 1, x2, y2, // 弧を描く
    "Z" // 中心に戻る
  ].join(" ");
  
  return pathData;
};

/**
 * ログインボーナスルーレットコンポーネント（UI改良版）
 */
const LoginBonusRoulette = () => {
  const { user } = useAuthStore();
  const { setMessage } = useFeedbackStore();
  
  // コンポーネント内でルーレットオプションを定義（正しい順序で）
  const localRouletteOptions = [
    { points: 100, label: '100', probability: 5, color: '#FFF1F0' },   // 薄い赤
    { points: 50, label: '50', probability: 15, color: '#FFF7E6' },     // 薄いオレンジ  
    { points: 20, label: '20', probability: 30, color: '#E6F7FF' },     // 薄い水色
    { points: 30, label: '30', probability: 20, color: '#F6FFED' },     // 薄い緑
    { points: 10, label: '10', probability: 30, color: '#FFE0E6' }      // 薄いピンク
  ];
  
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
  
  // マウント時にルーレットオプションを設定
  useEffect(() => {
    setRouletteOptions(localRouletteOptions);
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
  const handleSpinRoulette = async () => {
    if (!user || isSpinning) return;
    
    setIsSpinning(true);
    
    try {
      // まずルーレットの結果を決定
      const selectedOption = spinRoulette();
      
      // 結果が決まったら、そのオプションに対応する角度を計算
      const selectedIndex = rouletteOptions.findIndex(option => option.points === selectedOption.points);
      const anglePerSegment = 360 / rouletteOptions.length;
      // 矢印（上方向）に合わせるため、選択されたセグメントの中央角度を計算
      const targetAngle = selectedIndex * anglePerSegment + (anglePerSegment / 2);
      
      // 回転数を追加（5-7回転）
      const rotations = 5 + Math.random() * 2;
      // 最終的に選択されたセグメントが矢印の位置（上）で停止するよう調整
      const totalRotation = 360 * rotations - targetAngle;
      
      setRotationDegree(totalRotation);
      
      // アニメーション完了後に結果を表示
      spinTimeoutRef.current = setTimeout(async () => {
        try {
          // 選択されたボーナスを使用してボーナスを付与
          const bonusResult = await giveLoginBonusSafelyWithOption(user.uid, selectedOption);
          
          if (bonusResult) {
            // 結果を表示
            setResult(bonusResult);
          } else {
            // エラー発生時のフィードバック
            const feedbackStore = useFeedbackStore.getState();
            feedbackStore.setMessage('ボーナス付与に失敗しました。ページを更新してください。');
          }
        } catch (error) {
          console.error("ボーナス付与エラー:", error);
        } finally {
          setIsSpinning(false);
        }
      }, 3000);
    } catch (error) {
      console.error("ルーレット実行エラー:", error);
      setIsSpinning(false);
    }
  };
  
  /**
   * ルーレットを閉じる
   */
  const closeRoulette = () => {
    setShowRoulette(false);
    setResult(null);
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
            className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full"
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
              // 新しいルーレット表示
              <div className="relative my-8">
                {/* ルーレットコンテナ */}
                <div className="relative mx-auto w-96 h-96 flex items-center justify-center">
                  {/* 背景装飾 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full p-8">
                    {/* 外枠装飾 */}
                    <div className="w-full h-full bg-white rounded-full shadow-inner p-4">
                      {/* ルーレット本体 */}
                      <motion.div
                        className="relative w-full h-full rounded-full overflow-hidden shadow-lg"
                        animate={{ rotate: rotationDegree }}
                        transition={{ duration: 3, ease: "easeOut" }}
                      >
                        {/* SVGルーレット */}
                        <svg 
                          className="absolute inset-0 w-full h-full" 
                          viewBox="-150 -150 300 300"
                        >
                          {rouletteOptions.map((option, index) => {
                            const segmentAngle = 360 / rouletteOptions.length;
                            const startAngle = index * segmentAngle;
                            const pathData = createSVGSlice(option, index, rouletteOptions.length);
                            
                            // 各セグメントの中央角度を計算（上から時計回りで開始）
                            const centerAngle = startAngle + segmentAngle / 2;
                            const textRadius = 70;
                            const textX = Math.cos((centerAngle - 90) * Math.PI / 180) * textRadius;
                            const textY = Math.sin((centerAngle - 90) * Math.PI / 180) * textRadius;
                            
                            return (
                              <g key={index}>
                                {/* スライス */}
                                <path
                                  d={pathData}
                                  fill={option.color}
                                  stroke="#ffffff"
                                  strokeWidth="3"
                                />
                                {/* テキスト */}
                                <text
                                  x={textX}
                                  y={textY}
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  className="font-bold"
                                  fontSize="22"
                                  fill="#2d3748"
                                  filter="url(#textShadow)"
                                >
                                  {option.label}
                                </text>
                              </g>
                            );
                          })}
                          
                          {/* テキストシャドウフィルター */}
                          <defs>
                            <filter id="textShadow" x="-100%" y="-100%" width="300%" height="300%">
                              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(255,255,255,0.8)" />
                              <feDropShadow dx="1" dy="1" stdDeviation="1" floodColor="rgba(0,0,0,0.3)" />
                            </filter>
                          </defs>
                        </svg>
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* 矢印（ポインター） */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="w-6 h-10 bg-red-600 rounded-b-lg shadow-lg relative">
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 w-0 h-0 border-l-4 border-r-4 border-t-6 border-transparent border-t-red-600"></div>
                    </div>
                  </div>
                  
                  {/* 中央ボタン */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                    <motion.button
                      onClick={handleSpinRoulette}
                      disabled={isSpinning}
                      className={`w-16 h-16 rounded-full font-bold text-white shadow-lg border-4 border-white ${
                        isSpinning
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 active:scale-95 transform transition-all'
                      }`}
                      whileHover={{ scale: isSpinning ? 1 : 1.1 }}
                      whileTap={{ scale: isSpinning ? 1 : 0.95 }}
                    >
                      {isSpinning ? (
                        <div className="animate-spin">
                          ⏳
                        </div>
                      ) : (
                        '▶️'
                      )}
                    </motion.button>
                  </div>
                </div>
                
                {/* 回転ボタン（下部） */}
                <div className="text-center mt-6">
                  <p className="text-gray-600 text-sm mb-3">
                    {isSpinning ? '運命の輪が回転中...' : '中央のボタンをクリックしてスタート！'}
                  </p>
                </div>
              </div>
            ) : (
              // 結果表示（ボーナス獲得後）
              <div className="my-6 text-center">
                <motion.div
                  className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-6 mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                >
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <p className="text-xl mb-3">
                      <span className="font-bold text-blue-800 text-3xl">
                        🎊 {result.rouletteBonus.label} pt 🎊
                      </span>
                    </p>
                    
                    {result.consecutiveBonus > 0 && (
                      <motion.div
                        className="mt-3 bg-gradient-to-r from-green-100 to-emerald-100 p-3 rounded-lg border border-green-200"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1, type: "spring", stiffness: 300 }}
                      >
                        <p className="text-green-800 font-semibold">
                          ⭐ {result.consecutiveDays}日連続ログインボーナス ⭐
                        </p>
                        <p className="text-green-700">
                          +{result.consecutiveBonus}ポイント追加！
                        </p>
                      </motion.div>
                    )}
                    
                    <motion.p
                      className="mt-4 text-2xl font-bold text-purple-600"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.3, type: "spring", stiffness: 500 }}
                    >
                      💎 合計: {result.totalBonus}ポイント 💎
                    </motion.p>
                  </motion.div>
                </motion.div>
                
                <motion.button
                  onClick={closeRoulette}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full font-bold shadow-lg transition-all"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ✨ やったー！ ✨
                </motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginBonusRoulette;