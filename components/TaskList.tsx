import { useTaskStore } from "@/store/taskStore";

export default function TaskList() {
  const { tasks, toggleTask, removeTask } = useTaskStore();

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold">📋 タスクリスト</h2>
      <ul>
        {tasks.map((task) => (
          <li key={task.id} className="flex justify-between items-center p-2 my-2 rounded-lg shadow-sm bg-white dark:bg-gray-700">
            <span className={task.completed ? "line-through text-gray-500" : ""}>{task.text}</span>
            <div className="flex gap-2">
              <button
                onClick={() => toggleTask(task.id)}
                className="px-2 py-1 bg-blue-500 text-white rounded-lg"
              >
                ✓
              </button>
              <button onClick={() => removeTask(task.id)} className="px-2 py-1 bg-red-500 text-white rounded-lg">
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
