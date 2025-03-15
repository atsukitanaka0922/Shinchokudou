import { useState } from "react";
import { useTaskStore } from "@/store/taskStore";

export default function AddTask() {
  const [taskText, setTaskText] = useState("");
  const { addTask } = useTaskStore();

  const handleAdd = () => {
    if (taskText.trim()) {
      addTask(taskText);
      setTaskText("");
    }
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <input
        type="text"
        value={taskText}
        onChange={(e) => setTaskText(e.target.value)}
        placeholder="新しいタスクを追加"
        className="border p-2 rounded w-full"
      />
      <button onClick={handleAdd} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg">
        追加
      </button>
    </div>
  );
}
