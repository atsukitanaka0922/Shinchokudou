import { useEffect } from "react";
import { usePomodoroStore } from "@/store/pomodoroStore";
import { useTaskStore } from "@/store/taskStore";

interface PomodoroTimerProps {
  inTabPanel?: boolean;
}

export default function PomodoroTimer({ inTabPanel = false }: PomodoroTimerProps) {
  const { taskId, isRunning, timeLeft, isBreak, stopPomodoro, setupBackgroundTimer } = usePomodoroStore();
  const { tasks } = useTaskStore();

  // コンポーネントマウント時にバックグラウンドタイマーをセットアップ
  useEffect(() => {
    setupBackgroundTimer();
  }, [setupBackgroundTimer]);

  // ポモドーロタイマーが実行中でなく、タブパネル内でもない場合は非表示
  if (!isRunning && !inTabPanel) return null;

  // タブパネル内に表示中の場合は、常に表示するが現在タイマーが実行中でなければ開始メッセージを表示
  if (inTabPanel && !isRunning) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-600 mb-4">現在ポモドーロタイマーは実行されていません。</p>
        <p className="text-sm text-gray-500">タスクリストから「⏳」ボタンをクリックして開始してください。</p>
      </div>
    );
  }

  const task = tasks.find((t) => t.id === taskId);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // タブ内表示の場合はコンテナスタイルを適用しない
  return (
    <div className={inTabPanel ? "" : "fixed bottom-20 right-4 z-40 bg-white p-6 rounded-lg shadow-lg text-center w-64"}>
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
      
      <button 
        onClick={stopPomodoro} 
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
      >
        ❌ 終了
      </button>
      
      {!inTabPanel && (
        <div className="mt-3 text-xs text-gray-500">
          <p>タブを閉じてもタイマーはバックグラウンドで動作します</p>
        </div>
      )}
    </div>
  );
}