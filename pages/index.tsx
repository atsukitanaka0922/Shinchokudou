import { useEffect } from "react";
import { motion } from "framer-motion";
import { useTaskStore } from "@/store/taskStore";
import { useThemeStore } from "@/store/themeStore";
import { useDevice } from "@/hooks/useDevice";

// コンポーネントのインポート
import AddTaskWithPriority from "@/components/AddTaskWithPriority"; // AI優先度機能付きタスク追加
import TaskListWithPriority from "@/components/TaskListWithPriority"; // 優先度表示付きタスクリスト
import AITaskSuggestions from "@/components/AITaskSuggestions"; // AIタスク提案（天気機能付き）
import AppLogo from "@/components/AppLogo";
import Dashboard from "@/components/Dashboard";
import Feedback from "@/components/Feedback";
import TaskStats from "@/components/TaskStats";
import PomodoroStats from "@/components/PomodoroStats";
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

      {/* 浮動メニュー */}
      <FloatingMenu />

      {isMobile ? (
        <div className="container mx-auto p-4">
          {/* ロゴ - モバイル版 */}
          <div className="flex justify-center mb-6">
            <AppLogo width={150} height={150} />
          </div>
          
          <AuthButton />
          <div className="space-y-4 mb-20">
            <Dashboard />
            <Weather />
            <AITaskSuggestions /> {/* 天気対応AIタスク提案 */}
            <TaskStats />
            <AddTaskWithPriority /> {/* AI優先度機能付きタスク追加 */}
            <TaskListWithPriority /> {/* 優先度表示付きタスクリスト */}
            <PomodoroStats />
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto grid grid-cols-1 gap-6 p-6 bg-white shadow-lg rounded-lg mb-20">
          <motion.div className="p-6 rounded-lg shadow-lg">
            {/* ロゴとヘッダー - デスクトップ版 */}
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <AppLogo width={100} height={100} className="mr-4" />
                <h1 className="text-3xl font-bold">進捗堂</h1>
              </div>
              <AuthButton />
            </div>
            
            <div className="grid grid-cols-2 gap-6 mt-4">
              <Dashboard />
              <Weather />
            </div>
          </motion.div>

          <motion.div className="p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">🤖 AIアシスタント</h2>
            <AITaskSuggestions /> {/* 天気対応AIタスク提案 */}
          </motion.div>

          <motion.div className="p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">📝 新しいタスクを追加</h2>
            <AddTaskWithPriority /> {/* AI優先度機能付きタスク追加 */}
          </motion.div>

          <motion.div className="p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">📋 タスク一覧</h2>
            <TaskListWithPriority /> {/* 優先度表示付きタスクリスト */}
          </motion.div>

          <div className="grid grid-cols-2 gap-6">
            <motion.div className="p-6 rounded-lg shadow-lg">
              <TaskStats />
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