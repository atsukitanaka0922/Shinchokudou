import { useTaskStore } from "@/store/taskStore";
import { usePomodoroStore } from "@/store/pomodoroStore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";


export default function TaskList() {
  const { tasks, toggleTask, removeTask } = useTaskStore(); // 修正: ここで useTaskStore() を実行
  const { startTimer, activeTaskId } = usePomodoroStore();

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold">📋 タスクリスト</h2>
      <ul>
        {tasks.map((task) => (
          <li key={task.id} className={`flex justify-between items-center p-2 rounded-lg ${task.id === activeTaskId ? "bg-yellow-100" : "bg-white"}`}>
            <span className={task.completed ? "line-through text-gray-500" : ""}>{task.text}</span>
            <div className="flex gap-2">
              <button onClick={() => startTimer(task.id)} className="px-2 py-1 bg-blue-500 text-white rounded-lg">⏳</button>
              <button onClick={() => toggleTask(task.id)} className="px-2 py-1 bg-green-500 text-white rounded-lg">✓</button>
              <button onClick={() => removeTask(task.id)} className="px-2 py-1 bg-red-500 text-white rounded-lg">✕</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
