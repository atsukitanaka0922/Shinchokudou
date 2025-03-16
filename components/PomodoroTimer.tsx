import { useEffect } from "react";
import { usePomodoroStore } from "@/store/pomodoroStore";
import { useTaskStore } from "@/store/taskStore";
import { motion, AnimatePresence } from "framer-motion";

interface PomodoroTimerProps {
  inTabPanel?: boolean;
}

export default function PomodoroTimer({ inTabPanel = false }: PomodoroTimerProps) {
  const { 
    taskId, 
    isRunning, 
    timeLeft, 
    isBreak, 
    isAlarmPlaying, 
    stopPomodoro, 
    setupBackgroundTimer, 
    playTestSound,
    stopAlarm 
  } = usePomodoroStore();
  const { tasks } = useTaskStore();

  // コンポーネントマウント時にバックグラウンドタイマーをセットアップ
  useEffect(() => {
    setupBackgroundTimer();
  }, [setupBackgroundTimer]);

  // ポモドーロタイマーが実行中でなく、タブパネル内でもなく、アラームも鳴っていない場合は非表示
  if (!isRunning && !inTabPanel && !isAlarmPlaying) return null;

  // タブパネル内に表示中の場合は、常に表示するが現在タイマーが実行中でなければ開始メッセージを表示
  if (inTabPanel && !isRunning && !isAlarmPlaying) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-600 mb-4">現在ポモドーロタイマーは実行されていません。</p>
        <p className="text-sm text-gray-500 mb-4">タスクリストから「⏳」ボタンをクリックして開始してください。</p>
        
        {/* サウンドテスト機能 */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">🔊 アラームサウンドのテスト</h4>
          <button
            onClick={playTestSound}
            className="w-full px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
          >
            アラーム音をテスト
          </button>
          <p className="text-xs text-gray-500 mt-2">
            ブラウザの制限により、アラーム音を鳴らすにはユーザーの操作が必要です。
            このボタンをクリックして、アラーム音が正常に再生されるか確認してください。
          </p>
        </div>
      </div>
    );
  }

  const task = tasks.find((t) => t.id === taskId);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // アラーム停止ボタンを表示するかどうか
  const showAlarmStopButton = isAlarmPlaying;

  return (
    <div className={inTabPanel ? "" : "fixed bottom-20 right-4 z-40 bg-white p-6 rounded-lg shadow-lg text-center w-64"}>
      {/* アラーム停止通知 */}
      <AnimatePresence>
        {showAlarmStopButton && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-0 left-0 right-0 transform -translate-y-full p-2 bg-red-500 text-white rounded-t-lg"
          >
            アラームが鳴っています
          </motion.div>
        )}
      </AnimatePresence>

      <h2 className="text-xl font-bold mb-4">{isBreak ? "☕ 休憩タイム" : "⏳ 作業タイム"}</h2>
      
      {task && !isBreak && (
        <p className="text-lg font-semibold text-gray-700 mb-2 break-words">
          📝 {task.text}
        </p>
      )}
      
      <p className="text-4xl font-bold mb-4">
        {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
      </p>
      
      {/* タイマー残り時間のプログレスバー（25分中の残り） */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div 
          className={`h-2.5 rounded-full ${isBreak ? 'bg-blue-500' : 'bg-green-500'}`}
          style={{ width: `${isBreak ? (timeLeft / (5 * 60)) * 100 : (timeLeft / (25 * 60)) * 100}%` }}
        ></div>
      </div>
      
      {/* ボタン表示エリア */}
      <div className="flex flex-col space-y-2">
        {/* アラーム停止ボタン（アラーム再生中のみ表示） */}
        {showAlarmStopButton && (
          <button 
            onClick={stopAlarm} 
            className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition animate-pulse"
          >
            🔕 アラームを停止
          </button>
        )}
        
        {/* 終了ボタン */}
        <button 
          onClick={stopPomodoro} 
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          ❌ 終了
        </button>
      </div>
      
      {!inTabPanel && (
        <div className="mt-3 text-xs text-gray-500">
          <p>タブを閉じてもタイマーはバックグラウンドで動作します</p>
        </div>
      )}
    </div>
  );
}