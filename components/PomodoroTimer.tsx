import { useEffect, useState } from "react";
import { Rnd } from "react-rnd"; // 🔥 react-rnd を使用
import { usePomodoroStore } from "@/store/pomodoroStore";
import { useTaskStore } from "@/store/taskStore";
import { useStatsStore } from "@/store/statsStore";

export default function PomodoroTimer() {
  const { taskId, isRunning, timeLeft, isBreak, isVisible, stopPomodoro, tick } = usePomodoroStore();
  const { tasks } = useTaskStore();
  const { incrementPomodoro } = useStatsStore();

  // 🔥 位置とサイズを `localStorage` で保存
  const [position, setPosition] = useState({ x: 100, y: 100, width: 280, height: 180 });

  useEffect(() => {
    const savedPosition = localStorage.getItem("pomodoroTimerPosition");
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition));
    }
  }, []);

  const handleDragStop = (e, d) => {
    const newPosition = { ...position, x: d.x, y: d.y };
    setPosition(newPosition);
    localStorage.setItem("pomodoroTimerPosition", JSON.stringify(newPosition));
  };

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
      let audio = new Audio("/sounds/pomodoro-end.mp3");

      if (!isBreak) {
        console.log("✅ 作業時間終了！`incrementPomodoro()` を実行します。");
        incrementPomodoro();
      }

      audio.play();
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, 5000);
    }
  }, [timeLeft, isBreak, incrementPomodoro]);

  if (!isVisible) return null;

  const task = tasks.find((t) => t.id === taskId);

  return (
    <Rnd
      size={{ width: position.width, height: position.height }}
      position={{ x: position.x, y: position.y }}
      onDragStop={handleDragStop}
      bounds="parent"
      enableResizing={{ right: true, bottom: true, bottomRight: true }}
      onResizeStop={(e, direction, ref, delta, position) => {
        const newSize = {
          width: ref.offsetWidth,
          height: ref.offsetHeight,
          x: position.x,
          y: position.y,
        };
        setPosition(newSize);
        localStorage.setItem("pomodoroTimerPosition", JSON.stringify(newSize));
      }}
    >
      <div className="bg-white p-6 rounded-lg shadow-lg text-center cursor-move">
        <h2 className="text-xl font-bold mb-4">{isBreak ? "☕ 休憩タイム" : "⏳ 作業タイム"}</h2>
        {task && !isBreak && <p className="text-lg font-semibold text-gray-700">📝 {task.text}</p>}
        <p className="text-4xl font-bold mb-4">
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
        </p>
        <button onClick={stopPomodoro} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
          ❌ 閉じる
        </button>
      </div>
    </Rnd>
  );
}
