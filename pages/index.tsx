/**
 * ホームページ (ルート) コンポーネント
 * 
 * アプリケーションのメインビューを提供
 * レスポンシブデザインに対応し、モバイルとデスクトップで最適なUIを表示
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTaskStore } from "@/store/taskStore";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/auth";
import { useDevice } from "@/hooks/useDevice";
import Head from "next/head";

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
import LoginRegister from "@/components/LoginRegister";

// window.workboxのための型拡張
declare global {
  interface Window {
    workbox?: any;
  }
}

/**
 * ホームページコンポーネント
 * アプリケーションのメインページを構成し、各機能コンポーネントを配置
 */
export default function Home() {
  const { loadTasks } = useTaskStore();
  const { bgColor } = useThemeStore();
  const { user } = useAuthStore(); // 認証状態を取得
  const isMobile = useDevice(); // デバイスタイプを判定
  const [mounted, setMounted] = useState(false);

  // クライアントサイドのみの処理を確認するためのマウント状態
  useEffect(() => {
    setMounted(true);
  }, []);

  // 認証状態とタスクデータの初期化
  useEffect(() => {
    if (user) {
      console.log("ホームページがマウントされました - タスク読み込み開始");
      // ユーザーの認証状態が変わるたびにタスクをロード
      loadTasks();
      
      // デバッグログ
      console.log("タスク読み込み関数を呼び出しました", { user: user.uid });
    }
    
    // クリーンアップ関数
    return () => {
      console.log("ホームページがアンマウントされました");
    };
  }, [loadTasks, user]); // userの変更でも再実行

  // テーマの適用
  useEffect(() => {
    if (document) {
      document.body.style.backgroundColor = bgColor;
    }
  }, [bgColor]);

  // ServiceWorkerの登録
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.workbox !== undefined
    ) {
      // PWAが有効な場合はServiceWorkerを登録
      console.log("PWA対応: ServiceWorkerが有効です");
    }
  }, []);

  // サーバーサイドレンダリング時はマウント状態を確認
  if (!mounted) {
    // 初期表示用のシンプルなスケルトン
    return (
      <>
        <Head>
          <title>進捗堂 - AI搭載タスク管理アプリ</title>
          <meta name="description" content="AIを活用したタスク管理とポモドーロタイマーアプリ" />
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="mx-auto h-20 w-20 bg-blue-300 rounded-full mb-4"></div>
              <div className="h-6 w-32 mx-auto bg-blue-300 rounded mb-2"></div>
              <div className="h-4 w-48 mx-auto bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>進捗堂 - AI搭載タスク管理アプリ</title>
        <meta name="description" content="AIを活用したタスク管理とポモドーロタイマーアプリ" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

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

        {/* ログインしていない場合はログイン/登録画面を表示 */}
        {!user ? (
          <div className="container mx-auto p-4 min-h-screen flex items-center justify-center">
            <LoginRegister />
          </div>
        ) : (
          // ログイン済みの場合はアプリのメイン画面を表示
          <>
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
              <div className="max-w-6xl mx-auto p-6">
                <motion.div className="p-6 rounded-lg shadow-lg bg-white mb-6">
                  {/* ヘッダーセクション */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <AppLogo width={100} height={100} className="mr-4" />
                      <h1 className="text-3xl font-bold">進捗堂</h1>
                    </div>
                    <AuthButton />
                  </div>
                </motion.div>
                
                <div className="grid grid-cols-12 gap-6 mb-20">
                  {/* 左側のコンテンツ */}
                  <div className="col-span-12 md:col-span-8 space-y-6">
                    {/* ダッシュボードと天気のグリッド */}
                    <div className="grid grid-cols-2 gap-6">
                      <Dashboard />
                      <Weather />
                    </div>
                    
                    {/* AIアシスタントセクション */}
                    <motion.div className="p-6 rounded-lg shadow-lg bg-white">
                      <h2 className="text-xl font-bold mb-4">🤖 AIアシスタント</h2>
                      <AITaskSuggestions />
                    </motion.div>
                    
                    {/* タスク追加セクション */}
                    <motion.div className="p-6 rounded-lg shadow-lg bg-white">
                      <h2 className="text-xl font-bold mb-4">📝 新しいタスクを追加</h2>
                      <AddTaskWithPriority />
                    </motion.div>
                    
                    {/* タスクリストセクション */}
                    <motion.div className="p-6 rounded-lg shadow-lg bg-white">
                      <h2 className="text-xl font-bold mb-4">📋 タスク一覧</h2>
                      <TaskListWithPriority />
                    </motion.div>
                  </div>
                  
                  {/* 右側のサイドバー */}
                  <div className="col-span-12 md:col-span-4 space-y-6">
                    <motion.div className="p-6 rounded-lg shadow-lg bg-white">
                      <TaskStats />
                    </motion.div>
                    
                    <motion.div className="p-6 rounded-lg shadow-lg bg-white">
                      <h2 className="text-xl font-bold mb-4">⏳ ポモドーロタイマー</h2>
                      <PomodoroStats />
                    </motion.div>
                    
                    {/* PWAインストールガイド */}
                    <InstallPWAGuide />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </motion.main>
    </>
  );
}

/**
 * PWAインストールガイドコンポーネント
 * PWAをインストールする方法を説明するカード
 */
function InstallPWAGuide() {
  const [isPWA, setIsPWA] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  
  // PWA環境かどうかを検出
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWA(true); // すでにPWAとしてインストールされている
    }
  }, []);
  
  // すでにPWAとしてインストールされている場合や非表示にした場合は何も表示しない
  if (isPWA || !showGuide) return null;
  
  return (
    <motion.div 
      className="p-6 rounded-lg shadow-lg bg-blue-50 border border-blue-200"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1 }}
    >
      <div className="flex justify-between items-start">
        <h2 className="text-lg font-bold text-blue-800 mb-3">📱 アプリとしてインストール</h2>
        <button
          onClick={() => setShowGuide(false)}
          className="text-blue-500 hover:text-blue-700"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>
      
      <p className="text-sm text-blue-700 mb-3">
        進捗堂はPWA対応アプリです。ホーム画面に追加すると、アプリのように使用できます。
      </p>
      
      <div className="space-y-2 text-sm text-blue-600">
        <p className="font-medium">インストール方法:</p>
        <div className="pl-4">
          <p>• iOSのSafari: 「共有」→「ホーム画面に追加」</p>
          <p>• Androidのブラウザ: 「メニュー」→「アプリをインストール」</p>
          <p>• PCのChrome: アドレスバーの右にあるインストールアイコン</p>
        </div>
      </div>
    </motion.div>
  );
}