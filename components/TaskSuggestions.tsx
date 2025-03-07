import { useTaskStore } from "@/store/taskStore";

export default function MoodTasks() {
  const { addTask } = useTaskStore();

  const suggestedTasks = ["読書をする", "運動をする", "勉強する"];

  return (
    <div className="p-4 rounded-lg shadow-md bg-white">
      {/* タスク追加提案 */}
      <h2 className="text-lg font-semibold mb-4">💡 タスクの提案</h2>
      <ul className="space-y-2">
        {suggestedTasks.map((task, index) => (
          <li key={index} className="flex justify-between items-center p-2 border rounded-lg">
            <span>{task}</span>
            <button
              onClick={() => addTask(task)}
              className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              ➕ 追加
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
