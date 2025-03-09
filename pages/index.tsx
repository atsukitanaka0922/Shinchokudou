import { useEffect } from "react";
import { motion } from "framer-motion";
import { useTaskStore } from "@/store/taskStore";
import { useThemeStore } from "@/store/themeStore";
import { useDevice } from "@/hooks/useDevice";
import AddTask from "@/components/AddTask";
import TaskList from "@/components/TaskList";
import PomodoroTimer from "@/components/PomodoroTimer";
import Dashboard from "@/components/Dashboard";
import Feedback from "@/components/Feedback";
import TaskStats from "@/components/TaskStats";
import PomodoroStats from "@/components/PomodoroStats";
import BackgroundColorPicker from "@/components/BackgroundColorPicker";
import TaskSuggestions from "@/components/TaskSuggestions";
import BGMPlayer from "@/components/BGMPlayer";
import Weather from "@/components/Weather";

export default function Home() {
  const { loadTasks } = useTaskStore();
  const { bgColor } = useThemeStore();
  const isMobile = useDevice();

  useEffect(() => {
    loadTasks();
    document.body.style.backgroundColor = bgColor; // ✅ 背景色を body に適用
  }, [loadTasks, bgColor]);

  return (
    <motion.main
      className="min-h-screen transition-colors"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <BackgroundColorPicker />
      <Feedback />

      {isMobile ? (
        <div className="container mx-auto p-4">
          <motion.h1 className="text-2xl font-bold text-center mb-4">
          </motion.h1>
          <BGMPlayer />
          <Dashboard />
          <TaskSuggestions />
          <TaskStats />
          <AddTask />
          <TaskList />
          <PomodoroTimer />
          <PomodoroStats />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto grid grid-cols-1 gap-6 p-6 bg-white shadow-lg rounded-lg">
          <motion.div className="p-6 rounded-lg shadow-lg">
            <BGMPlayer />
            <Dashboard />
            <Weather />
            <TaskStats />
          </motion.div>

          <motion.div className="p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">📝 新しいタスクを追加</h2>
            <AddTask />
          </motion.div>

          <motion.div className="p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">📋 タスク一覧</h2>
            <TaskList />
          </motion.div>

          <div className="grid grid-cols-2 gap-6">
            <motion.div className="p-6 rounded-lg shadow-lg">
             <TaskSuggestions />
            </motion.div>

            <motion.div className="p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">⏳ ポモドーロタイマー</h2>
              <PomodoroTimer />
              <PomodoroStats />
            </motion.div>
          </div>
        </div>
      )}
    </motion.main>
  );
}
