import { useEffect, useState } from "react";
import { usePomodoroStore } from "@/store/pomodoroStore";
import { useTaskStore } from "@/store/taskStore";
import { useStatsStore } from "@/store/statsStore";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";

export default function PomodoroTimer() {
  const { taskId, isRunning, timeLeft, isBreak, isVisible, stopPomodoro, tick } = usePomodoroStore();
  const { tasks } = useTaskStore();
  const { incrementPomodoro } = useStatsStore();

  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const storedPosition = localStorage.getItem("pomodoroTimerPosition");
    if (storedPosition) {
      setPosition(JSON.parse(storedPosition));
    }
  }, []);

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
        audio = new Audio("/sounds/pomodoro-end.mp3");
      } else {
        audio = new Audio("/sounds/pomodoro-end.mp3");
        console.log("✅ 作業時間終了！`incrementPomodoro()` を実行します。");
        incrementPomodoro();
      }

      audio.play().catch(err => console.log("オーディオ再生エラー:", err));

      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, 5000);
    }
  }, [timeLeft, isBreak, incrementPomodoro]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    // 移動距離を計算
    const deltaX = result.destination.x - result.source.x;
    const deltaY = result.destination.y - result.source.y;
    
    // 現在位置に移動距離を加算
    const newPosition = {
      x: position.x + deltaX,
      y: position.y + deltaY
    };
    
    setPosition(newPosition);
    localStorage.setItem("pomodoroTimerPosition", JSON.stringify(newPosition));
  };

  if (!isVisible) return null;

  const task = tasks.find((t) => t.id === taskId);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // インラインスタイルで位置を設定
  const timerStyle = {
    transform: `translate(${position.x}px, ${position.y}px)`,
    position: 'fixed',
    bottom: '1rem',
    right: '1rem',
    zIndex: 50
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="pomodoro-timer" type="pomodoro">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{ height: '100vh', width: '100vw', position: 'fixed', pointerEvents: 'none' }}
          >
            <Draggable draggableId="pomodoro-timer-draggable" index={0}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  style={{
                    ...timerStyle,
                    ...provided.draggableProps.style,
                    pointerEvents: 'auto'
                  } as React.CSSProperties}
                  className="bg-white p-6 rounded-lg shadow-lg text-center"
                >
                  <h2 className="text-xl font-bold mb-4">{isBreak ? "☕ 休憩タイム" : "⏳ 作業タイム"}</h2>
                  {task && !isBreak && <p className="text-lg font-semibold text-gray-700 mb-2">📝 {task.text}</p>}
                  <p className="text-4xl font-bold mb-4">
                    {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
                  </p>
                  <button 
                    onClick={stopPomodoro} 
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    ❌ 終了
                  </button>
                </div>
              )}
            </Draggable>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}