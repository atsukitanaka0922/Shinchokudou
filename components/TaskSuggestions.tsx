import { useEffect } from "react";
import { useSuggestionStore } from "@/store/suggestionStore";
import { useTaskStore } from "@/store/taskStore";
import { useMoodStore } from "@/store/moodStore";

export default function TaskSuggestions() {
  const { suggestedTasks, generateSuggestions } = useSuggestionStore();
  const { addTask } = useTaskStore();
  const { mood } = useMoodStore();

  useEffect(() => {
    generateSuggestions();
    }, [mood, generateSuggestions]);

  return (
    <div className="p-4 bg-yellow-100 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold">🧠 タスクの提案</h2>
      <ul>
        {suggestedTasks.map((task, index) => (
          <li key={index} className="flex justify-between items-center">
            <span>{task}</span>
            <button
              onClick={() => addTask(task)}
              className="px-2 py-1 bg-blue-500 text-white rounded-lg"
            >
              追加
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
