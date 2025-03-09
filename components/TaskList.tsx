import { useTaskStore } from "@/store/taskStore";
import { usePomodoroStore } from "@/store/pomodoroStore";

export default function TaskList() {
  const { tasks, toggleCompleteTask, removeTask, moveTaskUp, moveTaskDown, setDeadline, message } = useTaskStore();
  const { startPomodoro } = usePomodoroStore();
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="p-4 rounded-lg shadow-md bg-white">
      {message && (
        <div className="p-3 mb-3 text-center bg-green-100 text-green-700 rounded-lg">
          {message}
        </div>
      )}

      <ul className="space-y-2">
        {tasks.map((task, index) => (
          <li key={task.id} className={`flex flex-col p-3 rounded-lg border ${task.completed ? "bg-gray-200 text-gray-500 line-through" : "bg-white"}`}>
            <div className="flex justify-between items-center">
              <span className="flex-1 break-words">{task.text}</span>
              <div className="flex gap-2">
                <button onClick={() => moveTaskUp(index)}>⬆</button>
                <button onClick={() => moveTaskDown(index)}>⬇</button>
                <button onClick={() => startPomodoro(task.id)}>⏳</button>
                <button onClick={() => toggleCompleteTask(task.id)}>{task.completed ? "↩️" : "✅"}</button>
                <button onClick={() => removeTask(task.id)}>❌</button>
              </div>
            </div>
            <input type="date" value={task.deadline || ""} onChange={(e) => setDeadline(task.id, e.target.value)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
