/**
 * フローティングポモドーロタイマーコンポーネント
 * 
 * ゲームプレイ中やアプリ全体で常に表示されるポモドーロタイマー
 * 画面の邪魔にならない位置に配置し、最小限の情報を表示
 * v1.6.0: ゲーム中でもタイマー継続機能
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePomodoroStore } from '@/store/pomodoroStore';
import { useEnhancedTaskStore } from '@/store/enhancedTaskStore';

/**
 * フローティングポモドーロタイマーコンポーネント
 */
export default function FloatingPomodoroTimer() {
  const { 
    isRunning, 
    timeLeft, 
    isBreak, 
    taskId, 
    isVisible,
    isAlarmPlaying,
    stopPomodoro, 
    stopAlarm
  } = usePomodoroStore();
  
  const { tasks } = useEnhancedTaskStore();
  
  // フローティングタイマーの表示/非表示状態
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 }); // 初期位置
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // ポモドーロで作業中のタスク名
  const currentTask = taskId ? tasks.find(t => t.id === taskId)?.text : null;

  /**
   * 秒数から「MM:SS」形式の文字列に変換
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * ドラッグ開始処理
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  /**
   * ドラッグ中の処理
   */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // 画面内に収まるように制限
      const maxX = window.innerWidth - 200; // タイマーの幅を考慮
      const maxY = window.innerHeight - 100; // タイマーの高さを考慮
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  /**
   * タッチイベント対応（モバイル用）
   */
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
  };

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      
      const touch = e.touches[0];
      const newX = touch.clientX - dragOffset.x;
      const newY = touch.clientY - dragOffset.y;
      
      const maxX = window.innerWidth - 200;
      const maxY = window.innerHeight - 100;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragOffset]);

  // ポモドーロタイマーが動いていない場合は表示しない
  if (!isVisible || !isRunning) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed z-50 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          left: position.x,
          top: position.y
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          className={`bg-white border-2 rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${
            isBreak 
              ? 'border-green-400 bg-green-50' 
              : isAlarmPlaying 
                ? 'border-red-400 bg-red-50' 
                : 'border-blue-400'
          }`}
        >
          {/* 最小化されていない場合の表示 */}
          {!isMinimized ? (
            <div className="p-3 min-w-[180px]">
              {/* ヘッダー */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <span className="text-sm font-medium">
                    {isBreak ? '☕ 休憩中' : '⏳ 作業中'}
                  </span>
                </div>
                <div className="flex space-x-1">
                  {/* 最小化ボタン */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMinimized(true);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-xs"
                    title="最小化"
                  >
                    ➖
                  </button>
                  {/* 停止ボタン */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      stopPomodoro();
                    }}
                    className="text-gray-400 hover:text-red-500 text-xs"
                    title="停止"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              {/* タイマー表示 */}
              <div 
                className={`text-2xl font-bold text-center mb-2 ${
                  timeLeft < 10 ? 'text-red-500' : isBreak ? 'text-green-600' : 'text-blue-600'
                }`}
              >
                {formatTime(timeLeft)}
              </div>
              
              {/* 現在のタスク名（短縮版） */}
              {currentTask && !isBreak && (
                <div className="text-xs text-gray-600 text-center mb-2">
                  {currentTask.length > 20 ? `${currentTask.substring(0, 20)}...` : currentTask}
                </div>
              )}
              
              {/* アラーム停止ボタン */}
              {isAlarmPlaying && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    stopAlarm();
                  }}
                  className="w-full text-xs bg-red-100 text-red-800 py-1 rounded border border-red-200 hover:bg-red-200"
                >
                  🔔 アラーム停止
                </button>
              )}
            </div>
          ) : (
            /* 最小化された場合の表示 */
            <div className="p-2 min-w-[80px]">
              <div className="flex items-center justify-between">
                <div 
                  className={`text-sm font-bold ${
                    timeLeft < 10 ? 'text-red-500' : isBreak ? 'text-green-600' : 'text-blue-600'
                  }`}
                >
                  {formatTime(timeLeft)}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-xs ml-2"
                  title="展開"
                >
                  ⬆️
                </button>
              </div>
              {isAlarmPlaying && (
                <div className="text-center mt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      stopAlarm();
                    }}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    🔔
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* ドラッグ中のヘルプテキスト */}
        {isDragging && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            ドラッグして移動
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}