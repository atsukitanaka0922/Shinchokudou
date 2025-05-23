/**
 * ポモドーロ統計コンポーネント
 * 
 * ポモドーロタイマーの統計情報とタイマー表示を提供
 * ユーザーがポモドーロテクニックを実践するためのUIを提供します
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { usePomodoroStore } from '@/store/pomodoroStore';
import { useStatsStore } from '@/store/statsStore';
import { useEnhancedTaskStore } from '@/store/enhancedTaskStore';

/**
 * ポモドーロ統計コンポーネント
 * タイマー表示と統計情報を表示する
 */
export default function PomodoroStats() {
  // ストアからの状態と関数の取得
  const { 
    isRunning, 
    timeLeft, 
    isBreak, 
    taskId, 
    isVisible,
    isAlarmPlaying,
    stopPomodoro, 
    playTestSound,
    stopAlarm
  } = usePomodoroStore();
  
  const { stats, loadStats } = useStatsStore();
  const { tasks } = useEnhancedTaskStore();
  
  // タブがアクティブかどうかの状態
  const [isActive, setIsActive] = useState(true);
  
  // ポモドーロで作業中のタスク名
  const currentTask = taskId ? tasks.find(t => t.id === taskId)?.text : null;

  // 統計データの読み込み
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // タブのアクティブ状態を監視
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsActive(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // ポモドーロタブを開くイベントのリスナー
    const handleOpenPomodoroTab = () => {
      const pomodoroTabElement = document.getElementById('pomodoro-tab');
      if (pomodoroTabElement) {
        // タブをアクティブにする処理（実装はタブコンポーネントによる）
        // この例ではカスタムイベントを発生させる形で実装
      }
    };

    window.addEventListener('openPomodoroTab', handleOpenPomodoroTab);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('openPomodoroTab', handleOpenPomodoroTab);
    };
  }, []);

  /**
   * 秒数から「MM:SS」形式の文字列に変換
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ポモドーロタイマーが表示されていない場合
  if (!isVisible) {
    return (
      <div className="p-4 bg-white shadow-md rounded-lg">
        <h2 className="text-lg font-semibold mb-3">⏳ ポモドーロタイマー</h2>
        <p className="text-gray-600 mb-2">
          タスクからポモドーロを開始すると、ここにタイマーが表示されます。
        </p>
        <p className="text-sm text-gray-500 mb-2">
          今日の完了セッション: {stats?.completedSessions || 0}
        </p>
        
        {/* テストサウンドボタン */}
        <button 
          onClick={playTestSound}
          className="text-sm text-blue-600 hover:text-blue-800 mb-2"
        >
          🔊 通知音をテスト
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      className="p-4 bg-white shadow-md rounded-lg"
      animate={{ 
        backgroundColor: isBreak 
          ? 'rgb(236, 253, 245)' // 休憩中は薄緑色
          : isAlarmPlaying 
            ? 'rgb(254, 242, 242)' // アラーム中は薄赤色
            : 'rgb(255, 255, 255)' // 通常は白
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">
          {isBreak ? '☕ 休憩時間' : '⏳ 作業中'}
        </h2>
        
        {/* 停止ボタン */}
        <button
          onClick={stopPomodoro}
          className="px-2 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600"
        >
          停止
        </button>
      </div>
      
      {/* タイマー表示 */}
      <div 
        className={`text-4xl font-bold text-center my-6 ${
          timeLeft < 10 ? 'text-red-500' : isBreak ? 'text-green-600' : 'text-blue-600'
        }`}
      >
        {formatTime(timeLeft)}
      </div>
      
      {/* 現在のタスク名 */}
      {currentTask && (
        <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
          <p className="text-sm text-gray-600">現在のタスク:</p>
          <p className="font-medium">{currentTask}</p>
        </div>
      )}
      
      {/* 統計情報 */}
      <p className="text-sm text-gray-500">
        今日の完了セッション: {stats?.completedSessions || 0}
      </p>
      
      {/* アラーム停止ボタン - アラームが鳴っている場合のみ表示 */}
      {isAlarmPlaying && (
        <motion.button
          onClick={stopAlarm}
          className="w-full mt-3 p-2 bg-red-100 text-red-800 rounded-lg border border-red-200"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ repeat: Infinity, repeatType: 'reverse', duration: 0.5 }}
        >
          🔔 アラームを停止
        </motion.button>
      )}
      
      {/* タブがバックグラウンドの場合の通知 */}
      {!isActive && isRunning && (
        <p className="text-xs text-gray-500 mt-2">
          ⚠️ タブがバックグラウンドです。タイマーは継続して動作しています。
        </p>
      )}
    </motion.div>
  );
}