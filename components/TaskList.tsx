import { useTaskStore } from "@/store/taskStore";
import { usePomodoroStore } from "@/store/pomodoroStore";

export default function TaskList() {
  const { tasks, completeTask, removeTask, moveTaskUp, moveTaskDown, setDeadline } = useTaskStore();
  const { startPomodoro } = usePomodoroStore();

  const today = new Date().toISOString().split("T")[0]; // 今日の日付

  return (
    <div className="p-4 rounded-lg shadow-md bg-white">
      <ul className="space-y-2">
        {tasks.map((task, index) => (
          <li
            key={task.id}
            className={`flex flex-col p-3 rounded-lg border ${
              task.completed ? "bg-gray-200 text-gray-500 line-through" : "bg-white"
            }`}
          >
            {/* タスク情報 */}
            <div className="flex justify-between items-center">
              <span className="flex-1 break-words">{task.text}</span>

              {/* ボタン類 */}
              <div className="flex gap-2">
                <button onClick={() => moveTaskUp(index)} className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600">🔼</button>
                <button onClick={() => moveTaskDown(index)} className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600">🔽</button>
                <button onClick={() => startPomodoro(task.id)} className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600">⏳</button>
                <button onClick={() => completeTask(task.id)} className="px-3 py-1 bg-[#9ACD32] text-white rounded-lg hover:bg-[#7FBF00]">✅</button>
                <button onClick={() => removeTask(task.id)} className="px-3 py-1 bg-[#FF8C00] text-white rounded-lg hover:bg-[#E67E00]">❌</button>
              </div>
            </div>

            {/* 締め切り日設定 */}
            <div className="mt-2">
              <label className="text-sm text-gray-600">締め切り</label>
              <input
                type="date"
                value={task.deadline || ""}
                onChange={(e) => setDeadline(task.id, e.target.value)}
                className={`w-full p-2 border rounded-lg ${
                  task.deadline && task.deadline < today ? "text-red-500 border-red-500" : ""
                }`}
              />
              {task.deadline && task.deadline < today && (
                <p className="text-red-500 text-xs mt-1">⚠️ 期限が過ぎています！</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
