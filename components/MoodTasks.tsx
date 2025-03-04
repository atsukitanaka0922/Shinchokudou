import { useMoodStore } from "@/store/moodStore";
import { useTaskStore } from "@/store/taskStore";

const moodTaskSuggestions = {
  "元気": ["ランニング", "掃除", "新しいスキルを学ぶ"],
  "普通": ["読書", "買い物", "映画を見る"],
  "疲れた": ["瞑想", "音楽を聴く", "昼寝"],
};

export default function MoodTasks() {
  const { mood } = useMoodStore();
  const { addTask } = useTaskStore();
  
  return (
    <div className="p-4 bg-green-100 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold">🎯 おすすめタスク</h2>
      <ul className="list-disc pl-5">
        {moodTaskSuggestions[mood].map((task, index) => (
          <li key={index} className="flex justify-between items-center">
            {task}
            <button
              onClick={() => addTask(task)}
              className="ml-2 px-2 py-1 bg-blue-500 text-white rounded-lg text-sm"
            >
              ＋
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
