import { useTaskStore } from "@/store/taskStore";

export default function DeadlineWarning() {
  const { tasks } = useTaskStore();

  const today = new Date().toISOString().split("T")[0];

  const urgentTasks = tasks.filter((task) => task.deadline && task.deadline <= today && !task.completed);

  if (urgentTasks.length === 0) return null;

  return (
    <div className="p-4 mb-4 rounded-lg shadow-md bg-red-100 text-red-700">
      <h2 className="text-lg font-semibold">⚠️ 期限切れのタスク</h2>
      <ul className="list-disc ml-4">
        {urgentTasks.map((task) => (
          <li key={task.id}>{task.text}（期限: {task.deadline}）</li>
        ))}
      </ul>
    </div>
  );
}
