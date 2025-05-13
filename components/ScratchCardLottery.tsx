/**
 * スクラッチカードログインボーナスコンポーネント
 * 
 * 9枚のカードから3枚を削り、同じ絵柄を3つ揃えるとボーナスポイント獲得
 * Canvas を使用したリアルなスクラッチエフェクトを実装
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import { hasReceivedTodayBonus } from '@/lib/loginBonusService';
import { useFeedbackStore } from '@/store/feedbackStore';
import { addPointsSafely } from '@/lib/fixedPointHandler';
import { calculateConsecutiveDaysSafely, getTodayDate, CONSECUTIVE_LOGIN_BONUS } from '@/lib/loginBonusService';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { forceTokenRefresh } from '@/lib/authTokenRefresh';

// スクラッチカードの絵柄とポイント
export const SCRATCH_SYMBOLS = [
  { icon: '🌟', label: 'スター', points: 100, probability: 5 },    // レア
  { icon: '💎', label: 'ダイヤ', points: 50, probability: 15 },    // 高級
  { icon: '🎯', label: 'ターゲット', points: 30, probability: 20 }, // 中級
  { icon: '🍀', label: 'クローバー', points: 20, probability: 30 }, // 普通
  { icon: '💰', label: 'ゴールド', points: 10, probability: 30 }   // 基本
];

// カード1枚の状態
interface CardState {
  id: number;
  symbol: string;
  points: number;
  revealed: boolean;
  scratching: boolean;
}

/**
 * ランダムなシンボルを確率に基づいて選択
 */
const getRandomSymbol = () => {
  const random = Math.random() * 100;
  let cumulativeProbability = 0;
  
  for (const symbol of SCRATCH_SYMBOLS) {
    cumulativeProbability += symbol.probability;
    if (random <= cumulativeProbability) {
      return symbol;
    }
  }
  
  return SCRATCH_SYMBOLS[SCRATCH_SYMBOLS.length - 1]; // フォールバック
};

/**
 * 9枚のカードの配置を生成（バランスの取れた配置に修正）
 */
const generateCardArrangement = () => {
  // 9枚のカードを生成
  const cards: CardState[] = [];
  
  // 各シンボルを均等に配置（完全にランダムだと偏る可能性があるため）
  const symbolPool = [
    ...Array(2).fill(SCRATCH_SYMBOLS[4]), // 💰 ゴールド (2枚)
    ...Array(2).fill(SCRATCH_SYMBOLS[3]), // 🍀 クローバー (2枚)
    ...Array(2).fill(SCRATCH_SYMBOLS[2]), // 🎯 ターゲット (2枚)
    ...Array(2).fill(SCRATCH_SYMBOLS[1]), // 💎 ダイヤ (2枚)
    ...Array(1).fill(SCRATCH_SYMBOLS[0]), // 🌟 星 (1枚)
  ];
  
  // シャッフル
  for (let i = symbolPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [symbolPool[i], symbolPool[j]] = [symbolPool[j], symbolPool[i]];
  }
  
  // カードオブジェクトを作成
  for (let i = 0; i < 9; i++) {
    const symbol = symbolPool[i] || SCRATCH_SYMBOLS[4]; // フォールバック
    cards.push({
      id: i,
      symbol: symbol.icon,
      points: symbol.points,
      revealed: false,
      scratching: false
    });
  }
  
  console.log('生成されたカード配置:', cards);
  return cards;
};

/**
 * スクラッチカードコンポーネント
 */
const ScratchCard = ({ card, onReveal, disabled }: {
  card: CardState;
  onReveal: (cardId: number) => void;
  disabled: boolean;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchPercentage, setScratchPercentage] = useState(0);
  
  // Canvas初期化
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || card.revealed) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // キャンバスサイズ設定
    canvas.width = 120;
    canvas.height = 120;
    
    // スクラッチ面を描画（銀色）
    ctx.fillStyle = '#a0a0a0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // グラデーション効果を追加
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#e0e0e0');
    gradient.addColorStop(0.5, '#a0a0a0');
    gradient.addColorStop(1, '#808080');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 「スクラッチして削ってね！」のテキストを描画
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('削ってね！', canvas.width / 2, canvas.height / 2);
    
    // テクスチャを追加
    ctx.fillStyle = '#b0b0b0';
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.fillRect(x, y, 1, 1);
    }
  }, [card.revealed]);
  
  // スクラッチエフェクト
  const scratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || card.revealed || disabled || card.scratching) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const canvasX = (x - rect.left) * scaleX;
    const canvasY = (y - rect.top) * scaleY;
    
    // 削る部分を透明にする
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 15, 0, 2 * Math.PI);
    ctx.fill();
    
    // 削った部分の計算
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentPixels = 0;
    
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        transparentPixels++;
      }
    }
    
    const percentage = (transparentPixels / (canvas.width * canvas.height)) * 100;
    setScratchPercentage(percentage);
    
    // 30%以上削ったら自動で全て表示（一度だけ実行）
    if (percentage > 30 && !card.revealed && !card.scratching && !isScratching) {
      setIsScratching(true);
      
      // カードの状態を更新してマークする
      const newCard = { ...card, scratching: true };
      
      console.log('カード削り完了 - 30%到達:', card.id);
      
      setTimeout(() => {
        onReveal(card.id);
      }, 300);
    }
  }, [card.id, card.revealed, card.scratching, disabled, onReveal]);
  
  // マウスイベント
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsScratching(true);
    scratch(e.clientX, e.clientY);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isScratching) {
      scratch(e.clientX, e.clientY);
    }
  };
  
  const handleMouseUp = () => {
    setIsScratching(false);
  };
  
  // タッチイベント
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsScratching(true);
    const touch = e.touches[0];
    scratch(touch.clientX, touch.clientY);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (isScratching) {
      const touch = e.touches[0];
      scratch(touch.clientX, touch.clientY);
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsScratching(false);
  };
  
  return (
    <motion.div
      className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 border-2 border-gray-300 rounded-lg overflow-hidden cursor-pointer"
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      animate={{ opacity: disabled ? 0.5 : 1 }}
    >
      {/* カードの内容（シンボル） */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 to-orange-100">
        <span className="text-4xl mb-1">{card.symbol}</span>
        <span className="text-xs font-bold text-gray-700">
          {SCRATCH_SYMBOLS.find(s => s.icon === card.symbol)?.points || 0}pt
        </span>
      </div>
      
      {/* スクラッチ面 */}
      {!card.revealed && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }}
        />
      )}
      
      {/* スクラッチ進行度 */}
      {!card.revealed && scratchPercentage > 5 && (
        <div className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-50 text-white text-xs text-center py-1 rounded">
          {Math.round(scratchPercentage)}%
        </div>
      )}
      
      {/* カードID（デバッグ用） */}
      <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
        {card.id}
      </div>
    </motion.div>
  );
};

/**
 * メインスクラッチロッタリーコンポーネント
 */
const ScratchCardLottery = () => {
  const { user } = useAuthStore();
  const { setMessage } = useFeedbackStore();
  
  // 状態管理
  const [showLottery, setShowLottery] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [hasReceived, setHasReceived] = useState(false);
  const [cards, setCards] = useState<CardState[]>([]);
  const [revealedCards, setRevealedCards] = useState<CardState[]>([]);
  const [gameComplete, setGameComplete] = useState(false);
  const [isProcessingBonus, setIsProcessingBonus] = useState(false); // 新しいフラグ追加
  const [result, setResult] = useState<{
    symbol: string;
    points: number;
    totalBonus: number;
    consecutiveDays: number;
    consecutiveBonus: number;
  } | null>(null);
  
  // ログイン時にボーナスのチェック
  useEffect(() => {
    if (user && !hasChecked) {
      checkLoginBonus();
    }
  }, [user, hasChecked]);
  
  /**
   * ログインボーナスの状態をチェック
   */
  const checkLoginBonus = async () => {
    if (!user) return;
    
    try {
      const alreadyReceived = await hasReceivedTodayBonus(user.uid);
      setHasReceived(alreadyReceived);
      
      if (!alreadyReceived) {
        // まだ受け取っていなければスクラッチカードを表示
        setShowLottery(true);
        const newCards = generateCardArrangement();
        setCards(newCards);
        setRevealedCards([]); // 削られたカードをリセット
        console.log('スクラッチカード開始 - カード数:', newCards.length);
      }
      
      setHasChecked(true);
    } catch (error) {
      console.error("ログインボーナスチェックエラー:", error);
      setHasChecked(true);
    }
  };
  
  /**
   * カードが削られた時の処理（修正版）
   */
  const handleCardReveal = useCallback((cardId: number) => {
    // ゲームが完了していたり、ボーナス処理中の場合は何もしない
    if (gameComplete || isProcessingBonus) {
      console.log('ゲーム完了済みまたは処理中のため、カード削り処理をスキップ:', cardId);
      return;
    }
    
    // すでに削られているかチェック
    if (revealedCards.some(card => card.id === cardId)) {
      console.log('カードはすでに削られています:', cardId);
      return;
    }
    
    // カードの状態を更新
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === cardId ? { ...card, revealed: true, scratching: false } : card
      )
    );
    
    // 削られたカードを追加
    const revealedCard = cards.find(card => card.id === cardId);
    if (revealedCard) {
      setRevealedCards(prev => {
        // 既に追加されているかチェック
        const alreadyRevealed = prev.some(card => card.id === cardId);
        if (alreadyRevealed) {
          console.log('削られたカードは既に登録済み:', cardId);
          return prev;
        }
        
        const newRevealed = [...prev, { ...revealedCard, revealed: true }];
        console.log('削られたカード追加:', revealedCard, '合計:', newRevealed.length);
        
        // 3枚削られたらゲーム完了
        if (newRevealed.length === 3 && !gameComplete && !isProcessingBonus) {
          console.log('3枚削り完了 - ゲーム結果を処理します');
          setIsProcessingBonus(true);
          setTimeout(() => {
            checkGameResult(newRevealed);
          }, 500);
        }
        
        return newRevealed;
      });
    }
  }, [cards, revealedCards, gameComplete, isProcessingBonus]);
  
  /**
   * ゲーム結果をチェック
   */
  const checkGameResult = async (finalCards: CardState[]) => {
    console.log('削られたカード:', finalCards);
    
    // シンボルごとにカウント
    const symbolCounts: { [key: string]: { count: number; points: number } } = {};
    
    finalCards.forEach(card => {
      if (!symbolCounts[card.symbol]) {
        symbolCounts[card.symbol] = { count: 0, points: card.points };
      }
      symbolCounts[card.symbol].count++;
    });
    
    // 3つ揃ったシンボルを探す
    let winningSymbol: string | null = null;
    let wonPoints = 0;
    
    for (const [symbol, data] of Object.entries(symbolCounts)) {
      if (data.count === 3) {
        winningSymbol = symbol;
        wonPoints = data.points;
        break;
      }
    }
    
    // 3つ揃わなかった場合も最低10ポイント付与
    if (!winningSymbol) {
      winningSymbol = '🎁';
      wonPoints = 10; // 参加賞を10ポイントに増加
    }
    
    try {
      // 連続ログイン日数を計算
      const consecutiveDays = await calculateConsecutiveDaysSafely(user!.uid);
      
      // 連続ログイン特典
      let consecutiveBonus = 0;
      for (const [days, bonus] of Object.entries(CONSECUTIVE_LOGIN_BONUS)) {
        if (consecutiveDays === parseInt(days)) {
          consecutiveBonus = bonus;
          break;
        }
      }
      
      const totalBonus = wonPoints + consecutiveBonus;
      
      // ログイン記録を保存
      const today = getTodayDate();
      const loginRecord = {
        userId: user!.uid,
        date: today,
        timestamp: Date.now(),
        receivedBonus: true,
        bonusPoints: totalBonus,
        consecutiveDays
      };
      
      const docId = `${today}_${user!.uid}`;
      
      try {
        await setDoc(doc(db, "loginRecords", docId), loginRecord);
        console.log("ログイン記録を保存しました:", docId);
      } catch (error) {
        if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
          await forceTokenRefresh();
          await setDoc(doc(db, "loginRecords", docId), loginRecord);
          console.log("トークン更新後、ログイン記録を保存しました:", docId);
        } else {
          throw error;
        }
      }
      
      // ポイントを付与
      const pointsAdded = await addPointsSafely(
        user!.uid,
        totalBonus,
        consecutiveBonus > 0 
          ? `スクラッチボーナス（${consecutiveDays}日連続ログイン！）` 
          : 'スクラッチボーナス',
        false
      );
      
      if (!pointsAdded) {
        console.warn("ポイント付与に失敗しましたが、ログイン記録は保存されました");
      }
      
      // 結果を表示
      setResult({
        symbol: winningSymbol,
        points: wonPoints,
        totalBonus,
        consecutiveDays,
        consecutiveBonus
      });
      
      setGameComplete(true);
      
      // フィードバック表示
      if (consecutiveBonus > 0) {
        setMessage(`${consecutiveDays}日連続ログイン達成！ボーナスポイントを獲得しました！`);
      }
      
    } catch (error) {
      console.error("ボーナス付与エラー:", error);
      setMessage("ボーナス付与に失敗しました。ページを更新してください。");
    }
  };
  
  /**
   * スクラッチカードを閉じる
   */
  const closeLottery = () => {
    setShowLottery(false);
    setGameComplete(false);
    setIsProcessingBonus(false);
    setResult(null);
    setCards([]);
    setRevealedCards([]);
    console.log('スクラッチカードを閉じました - 状態をリセット');
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
      {showLottery && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-2 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white p-4 sm:p-6 rounded-lg shadow-xl max-w-sm sm:max-w-md md:max-w-lg w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">🎫 スクラッチカード 🎫</h2>
              <p className="text-gray-600 mt-1">
                {gameComplete 
                  ? `おめでとうございます！` 
                  : `カードを3枚削って、同じ絵柄を3つ揃えよう！`}
              </p>
              {!gameComplete && (
                <p className="text-sm text-blue-600 mt-2">
                  💡 カードを指やマウスで削ってみてください
                </p>
              )}
            </div>
            
            {!gameComplete ? (
              // ゲーム中の表示
              <>
                {/* カードグリッド */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 max-w-sm mx-auto">
                  {cards.map((card) => (
                    <ScratchCard 
                      key={card.id}
                      card={card}
                      onReveal={handleCardReveal}
                      disabled={revealedCards.length >= 3 || gameComplete}
                    />
                  ))}
                </div>
                
                {/* 進行状況（修正版） */}
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">
                    削ったカード: {Math.min(revealedCards.length, 3)} / 3
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((revealedCards.length / 3) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                
                {/* 削ったカードの表示 */}
                {revealedCards.length > 0 && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">削ったカード:</p>
                    <div className="flex justify-center space-x-2 flex-wrap">
                      {revealedCards.map((card, index) => (
                        <div key={`revealed-${card.id}`} className="text-2xl">
                          {card.symbol}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              // ゲーム完了後の結果表示
              result && (
                <div className="text-center">
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
                      <div className="text-6xl mb-3">{result.symbol}</div>
                      <p className="text-xl mb-3">
                        <span className="font-bold text-blue-800 text-2xl">
                          {result.points === 1 ? '💝 参加賞!' : `🎊 ${result.points} pt 🎊`}
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
                        className="mt-4 text-xl font-bold text-purple-600"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.3, type: "spring", stiffness: 500 }}
                      >
                        💎 合計: {result.totalBonus}ポイント 💎
                      </motion.p>
                    </motion.div>
                  </motion.div>
                  
                  <motion.button
                    onClick={closeLottery}
                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full font-bold shadow-lg transition-all"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ✨ ありがとう！ ✨
                  </motion.button>
                </div>
              )
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScratchCardLottery;