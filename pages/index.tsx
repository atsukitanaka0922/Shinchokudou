/**
 * ホームページ (ルート) コンポーネント
 * 
 * アプリケーションのメインビューを提供
 * レスポンシブデザインに対応し、モバイルとデスクトップで最適なUIを表示
 */

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useTaskStore } from "@/store/taskStore";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/auth";
import { useDevice } from "@/hooks/useDevice";

// コンポーネントのインポート
import AddTaskWithPriority from "@/components/AddTaskWithPriority";
import AITaskSuggestions from "@/components/AITaskSuggestions";
import AppLogo from "@/components/AppLogo";
import AuthButton from "@/components/AuthButton";
import Dashboard from "@/components/Dashboard";
import DeadlineWarning from "@/components/DeadlineWarning";
import Feedback from "@/components/Feedback";
import FloatingMenu from "@/components/FloatingMenu";
import PomodoroStats from "@/components/PomodoroStats";
import TaskListWithPriority from "@/components/TaskListWithPriority";
import TaskStats from "@/components/TaskStats";
import Weather from "@/components/Weather";

/**
 * ホームページコンポーネント
 * アプリケーションのメインページを構成し、各機能コンポーネントを配置
 */
export default function Home() {
  const { loadTasks } = useTaskStore();
  const { bgColor } = useThemeStore();
  const { user } = useAuthStore(); // 認証状態を取得
  const isMobile = useDevice(); // デバイスタイプを判定

  // 認証状態とタスクデータの初期化
  useEffect(() => {
    console.log("ホームページがマウントされました - タスク読み込み開始");
    // ユーザーの認証状態が変わるたびにタスクをロード
    loadTasks();
    
    // デバッグログ
    console.log("タスク読み込み関数を呼び出しました", { user: user?.uid || "未ログイン" });
    
    // クリーンアップ関数
    return () => {
      console.log("ホームページがアンマウントされました");
    };
  }, [loadTasks, user]); // userの変更でも再実行

  // テーマの適用
  useEffect(() => {
    document.body.style.backgroundColor = bgColor;
  }, [bgColor]);

  return (
    <motion.main
      className="min-h-screen transition-colors"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 共通コンポーネント */}
      <Feedback />       {/* フィードバック通知 */}
      <DeadlineWarning />{/* 締め切り警告 */}
      <FloatingMenu />   {/* 設定メニュー */}

      {/* モバイル版レイアウト */}
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
            <AITaskSuggestions />
            <TaskStats />
            <AddTaskWithPriority />
            <TaskListWithPriority />
            <PomodoroStats />
          </div>
        </div>
      ) : (
        // デスクトップ版レイアウト
        <div className="max-w-4xl mx-auto grid grid-cols-1 gap-6 p-6 bg-white shadow-lg rounded-lg mb-20">
          <motion.div className="p-6 rounded-lg shadow-lg">
            {/* ヘッダーセクション */}
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <AppLogo width={100} height={100} className="mr-4" />
                <h1 className="text-3xl font-bold">進捗堂</h1>
              </div>
              <AuthButton />
            </div>
            
            {/* ダッシュボードと天気のグリッド */}
            <div className="grid grid-cols-2 gap-6 mt-4">
              <Dashboard />
              <Weather />
            </div>
          </motion.div>

          {/* AIアシスタントセクション */}
          <motion.div className="p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">🤖 AIアシスタント</h2>
            <AITaskSuggestions />
          </motion.div>

          {/* タスク追加セクション */}
          <motion.div className="p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">📝 新しいタスクを追加</h2>
            <AddTaskWithPriority />
          </motion.div>

          {/* タスクリストセクション */}
          <motion.div className="p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">📋 タスク一覧</h2>
            <TaskListWithPriority />
          </motion.div>

          {/* 統計情報セクション */}
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