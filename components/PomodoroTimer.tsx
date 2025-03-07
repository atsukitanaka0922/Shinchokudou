import { useEffect } from "react";
import { usePomodoroStore } from "@/store/pomodoroStore";
import { useTaskStore } from "@/store/taskStore";

export default function PomodoroTimer() {
  const { taskId, isRunning, timeLeft, isBreak, isVisible, stopPomodoro, tick } = usePomodoroStore();
  const { tasks } = useTaskStore();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning) {
      timer = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, tick]);

  useEffect(() => {
    if (timeLeft === 0) {
      let audio: HTMLAudioElement;
      
      if (isBreak) {
        audio = new Audio("/sounds/break-end.mp3"); // 休憩終了音
      } else {
        audio = new Audio("/sounds/pomodoro-end.mp3"); // 作業終了音
      }

      audio.play();

      // 5 秒後に音を停止
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, 5000);
    }
  }, [timeLeft, isBreak]);

  if (!isVisible) return null;

  const task = tasks.find((t) => t.id === taskId);

  return (
    <div className="fixed bottom-4 right-4 bg-white p-6 rounded-lg shadow-lg text-center">
      <h2 className="text-xl font-bold mb-4">{isBreak ? "☕ 休憩タイム" : "⏳ 作業タイム"}</h2>
      {task && !isBreak && <p className="text-lg font-semibold text-gray-700">📝 {task.text}</p>}
      <p className="text-4xl font-bold mb-4">
        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
      </p>
      <button onClick={stopPomodoro} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
        ❌ 閉じる
      </button>
    </div>
  );
}
