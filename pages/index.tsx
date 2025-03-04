import { useEffect } from "react";
import { useTaskStore } from "@/store/taskStore";
import { useThemeStore } from "@/store/themeStore";
import AddTask from "@/components/AddTask";
import TaskList from "@/components/TaskList";
import PomodoroTimer from "@/components/PomodoroTimer";
import Dashboard from "@/components/Dashboard";
import MoodSelector from "@/components/MoodSelector";
import Feedback from "@/components/Feedback";
import TaskSuggestions from "@/components/TaskSuggestions";
import TaskStats from "@/components/TaskStats";
import PomodoroStats from "@/components/PomodoroStats";
import BackgroundColorPicker from "@/components/BackgroundColorPicker";

export default function Home() {
  const { loadTasks } = useTaskStore();
  const { bgColor } = useThemeStore();

  useEffect(() => {
    loadTasks(); // Firestore からタスクをロード
  }, [loadTasks]);

  return (
    <main
      className="max-w-lg mx-auto p-4 text-gray-900 dark:text-gray-100 transition-colors"
      style={{ backgroundColor: bgColor }}
    >
      <BackgroundColorPicker />
      <Feedback />
      <h1 className="text-2xl font-bold text-center mb-4">進捗堂</h1>
      <Dashboard />
      <MoodSelector />
      <TaskSuggestions />
      <PomodoroTimer />
      <TaskStats />
      <PomodoroStats />
      <AddTask />
      <TaskList />
    </main>
  );
}
