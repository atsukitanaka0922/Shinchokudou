import { useEffect } from "react";
import { motion } from "framer-motion";
import { useTaskStore } from "@/store/taskStore";
import { useThemeStore } from "@/store/themeStore";
import { useDevice } from "@/hooks/useDevice";

// コンポーネントのインポート
import AddTask from "@/components/AddTask";
import TaskList from "@/components/TaskList";
import Dashboard from "@/components/Dashboard";
import Feedback from "@/components/Feedback";
import TaskStats from "@/components/TaskStats";
import PomodoroStats from "@/components/PomodoroStats";
import TaskSuggestions from "@/components/TaskSuggestions";
import Weather from "@/components/Weather";
import AuthButton from "@/components/AuthButton";
import DeadlineWarning from "@/components/DeadlineWarning";
import FloatingMenu from "@/components/FloatingMenu";

export default function Home() {
  const { loadTasks } = useTaskStore();
  const { bgColor } = useThemeStore();
  const isMobile = useDevice();

  useEffect(() => {
    loadTasks();
    document.body.style.backgroundColor = bgColor; // 背景色を body に適用
  }, [loadTasks, bgColor]);

  return (
    <motion.main
      className="min-h-screen transition-colors"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* フィードバック通知 */}
      <Feedback />

      {/* 締め切り警告 */}
      <DeadlineWarning />

      {/* 浮動メニュー（タブ型UI） */}
      <FloatingMenu />

      {isMobile ? (
        <div className="container mx-auto p-4">
          <motion.h1 className="text-2xl font-bold text-center mb-4">
            Shinchokudou
          </motion.h1>
          <AuthButton />
          <div className="space-y-4">
            <Dashboard />
            <Weather />
            <TaskSuggestions />
            <TaskStats />
            <AddTask />
            <TaskList />
            <PomodoroStats />
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto grid grid-cols-1 gap-6 p-6 bg-white shadow-lg rounded-lg">
          <motion.div className="p-6 rounded-lg shadow-lg">
            <AuthButton />
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
              <PomodoroStats />
            </motion.div>
          </div>
        </div>
      )}
    </motion.main>
  );
}