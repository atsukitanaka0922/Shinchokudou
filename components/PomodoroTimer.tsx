import { useEffect } from "react";
import { usePomodoroStore } from "@/store/pomodoroStore";

export default function PomodoroTimer() {
  const { activeTaskId, timeLeft, isRunning, startTimer, stopTimer, resetTimer, tick } =
    usePomodoroStore();

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, tick]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="p-4 bg-gray-200 rounded-lg text-center shadow-md">
      <h2 className="text-lg font-semibold">⏳ ポモドーロタイマー</h2>
      <p className="text-3xl font-bold">{formatTime(timeLeft)}</p>
      {activeTaskId ? (
        <p className="text-sm text-gray-500">タスク ID: {activeTaskId}</p>
      ) : (
        <p className="text-sm text-gray-400">タスク未選択</p>
      )}
      <div className="flex justify-center gap-4 mt-2">
        {!isRunning ? (
          <button onClick={() => startTimer(activeTaskId || 1)} className="bg-green-500 text-white px-4 py-2 rounded-lg">
            スタート
          </button>
        ) : (
          <button onClick={stopTimer} className="bg-yellow-500 text-white px-4 py-2 rounded-lg">
            ストップ
          </button>
        )}
        <button onClick={resetTimer} className="bg-red-500 text-white px-4 py-2 rounded-lg">
          リセット
        </button>
      </div>
    </div>
  );
}