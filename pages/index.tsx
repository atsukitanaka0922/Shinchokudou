/**
 * ホームページ (ルート) コンポーネント（習慣管理タブ追加版）
 * 
 * アプリケーションのメインビューを提供
 * レスポンシブデザインに対応し、モバイルとデスクトップで最適なUIを表示
 * v1.7.0: 効果音システム追加、習慣管理タブと AI習慣提案機能を追加
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useEnhancedTaskStore } from "@/store/enhancedTaskStore";
import { usePointStore } from "@/store/pointStore";
import { useGameCenterStore } from "@/store/gameCenterStore";
import { useThemeStore } from "@/store/themeStore";
import { useShopStore } from "@/store/shopStore";
import { useHabitStore } from "@/store/habitStore";
import { useAuthStore } from "@/store/auth";
import { useDevice } from "@/hooks/useDevice";
import Head from "next/head";

// コンポーネントのインポート
import EnhancedAddTask from "@/components/EnhancedAddTask";
import EnhancedTaskList from "@/components/EnhancedTaskList";
import PointsDashboard from "@/components/PointsDashboard";
import AITaskSuggestions from "@/components/AITaskSuggestions";
import AppLogo from "@/components/AppLogo";
import AuthButton from "@/components/AuthButton";
import Dashboard from "@/components/Dashboard";
import DeadlineWarning from "@/components/DeadlineWarning";
import Feedback from "@/components/Feedback";
import FloatingMenu from "@/components/FloatingMenu";
import FloatingPomodoroTimer from "@/components/FloatingPomodoroTimer";
import TaskStats from "@/components/TaskStats";
import Weather from "@/components/Weather";
import LoginRegister from "@/components/LoginRegister";
import GameCenter from "@/components/GameCenter";
import Shop from "@/components/Shop";
import HabitManager from "@/components/HabitManager";
import HabitWarning from "@/components/HabitWarning";

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
  const { loadTasks } = useEnhancedTaskStore();
  const { loadUserPoints, checkAndAwardLoginBonus } = usePointStore();
  const { loadGameHistory, loadGameStats } = useGameCenterStore();
  const { loadShopItems, loadUserPurchases } = useShopStore();
  const { loadHabits } = useHabitStore();
  const { getActiveBackground, isUsingGradient } = useThemeStore();
  const { user } = useAuthStore();
  const isMobile = useDevice();
  const [mounted, setMounted] = useState(false);
  const [dataInitialized, setDataInitialized] = useState(false);
  const [currentTab, setCurrentTab] = useState<'tasks' | 'habits' | 'games' | 'shop'>('tasks');

  // クライアントサイドのみの処理を確認するためのマウント状態
  useEffect(() => {
    setMounted(true);
  }, []);

  // 認証状態とデータの初期化（1回のみ実行）
  useEffect(() => {
    if (user && !dataInitialized) {
      console.log("ホームページがマウントされました - データ読み込み開始");
      
      const initializeData = async () => {
        try {
          // 基本データをロード
          await loadTasks();
          await loadUserPoints();
          
          // ゲームセンターデータをロード
          await loadGameHistory();
          await loadGameStats();
          
          // ショップデータをロード
          await loadShopItems();
          await loadUserPurchases();
          
          // 🔥 新機能: 習慣データをロード
          await loadHabits();
          
          setDataInitialized(true);
          console.log("データ初期化完了", { user: user.uid });
        } catch (error) {
          console.error("データ初期化エラー:", error);
        }
      };
      
      initializeData();
    }
    
    // クリーンアップ関数
    return () => {
      if (!user) {
        setDataInitialized(false);
      }
    };
  }, [user, dataInitialized, loadTasks, loadUserPoints, loadGameHistory, loadGameStats, loadShopItems, loadUserPurchases, loadHabits]);

  // テーマの動的適用
  useEffect(() => {
    if (document) {
      const activeBackground = getActiveBackground();
      
      if (isUsingGradient()) {
        // グラデーション背景の場合
        document.body.style.background = activeBackground;
        document.body.style.backgroundColor = ''; // フォールバック用に空にする
      } else {
        // 単色背景の場合
        document.body.style.backgroundColor = activeBackground;
        document.body.style.background = ''; // グラデーションを無効化
      }
    }
  }, [getActiveBackground, isUsingGradient]);

  // ServiceWorkerの登録
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.workbox !== undefined
    ) {
      console.log("PWA対応: ServiceWorkerが有効です");
    }
  }, []);

  // サーバーサイドレンダリング時はマウント状態を確認
  if (!mounted) {
    return (
      <>
        <Head>
          <title>進捗堂</title>
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
        <title>進捗堂</title>
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
        <Feedback />
        <DeadlineWarning />
        <HabitWarning />
        <FloatingMenu />
        <FloatingPomodoroTimer />

        {/* ログインしていない場合はログイン/登録画面を表示 */}
        {!user ? (
          <div className="container mx-auto p-4 min-h-screen flex items-center justify-center">
            <LoginRegister />
          </div>
        ) : (
          <>
            {/* モバイル版レイアウト */}
            {isMobile ? (
              <div className="container mx-auto p-4">
                {/* ロゴ - モバイル版 */}
                <div className="flex justify-center mb-6">
                  <AppLogo width={150} height={150} />
                </div>
                
                <AuthButton />
                
                {/* 🔥 更新: タブナビゲーションに習慣管理を追加 */}
                <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setCurrentTab('tasks')}
                    className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                      currentTab === 'tasks'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    📋 タスク
                  </button>
                  <button
                    onClick={() => setCurrentTab('habits')}
                    className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                      currentTab === 'habits'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    🔄 習慣
                  </button>
                  <button
                    onClick={() => setCurrentTab('games')}
                    className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                      currentTab === 'games'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    🎮 ゲーム
                  </button>
                  <button
                    onClick={() => setCurrentTab('shop')}
                    className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                      currentTab === 'shop'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    🛍️ ショップ
                  </button>
                </div>

                {/* コンテンツエリア - モバイル版 */}
                <div className="space-y-4 mb-20">
                  {currentTab === 'tasks' ? (
                    <>
                      <Dashboard />
                      <PointsDashboard />
                      <Weather />
                      <AITaskSuggestions />
                      <TaskStats />
                      <EnhancedAddTask />
                      <EnhancedTaskList />
                    </>
                  ) : currentTab === 'habits' ? (
                    // 🔥 新機能: 習慣管理タブ
                    <>
                      <PointsDashboard />
                      <HabitManager />
                    </>
                  ) : currentTab === 'games' ? (
                    <>
                      <PointsDashboard />
                      <GameCenter />
                    </>
                  ) : (
                    // ショップタブ
                    <>
                      <PointsDashboard />
                      <Shop />
                    </>
                  )}
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
                      <div>
                        <h1 className="text-3xl font-bold">進捗堂</h1>
                        <p className="text-gray-600 text-sm mt-1">AI搭載タスク管理アプリ v1.7.0</p>
                      </div>
                    </div>
                    <AuthButton />
                  </div>
                  
                  {/* 🔥 更新: タブナビゲーションに習慣管理を追加 */}
                  <div className="flex mt-6 space-x-1">
                    <button
                      onClick={() => setCurrentTab('tasks')}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        currentTab === 'tasks'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      📋 タスク管理
                    </button>
                    <button
                      onClick={() => setCurrentTab('habits')}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        currentTab === 'habits'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      🔄 習慣管理
                    </button>
                    <button
                      onClick={() => setCurrentTab('games')}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        currentTab === 'games'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      🎮 ゲームセンター
                    </button>
                    <button
                      onClick={() => setCurrentTab('shop')}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        currentTab === 'shop'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      🛍️ ポイントショップ
                    </button>
                  </div>
                </motion.div>
                
                {/* コンテンツエリア - デスクトップ版 */}
                {currentTab === 'tasks' ? (
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
                        <EnhancedAddTask />
                      </motion.div>
                      
                      {/* タスクリストセクション */}
                      <motion.div className="p-6 rounded-lg shadow-lg bg-white">
                        <h2 className="text-xl font-bold mb-4">📋 タスク一覧</h2>
                        <EnhancedTaskList />
                      </motion.div>
                    </div>
                    
                    {/* 右側のサイドバー */}
                    <div className="col-span-12 md:col-span-4 space-y-6">
                      <motion.div className="p-6 rounded-lg shadow-lg bg-white">
                        <PointsDashboard />
                      </motion.div>
                      
                      <motion.div className="p-6 rounded-lg shadow-lg bg-white">
                        <TaskStats />
                      </motion.div>
                      
                      {/* ポモドーロ情報カード */}
                      <motion.div className="p-6 rounded-lg shadow-lg bg-white">
                        <h2 className="text-xl font-bold mb-4">⏱️ ポモドーロタイマー</h2>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-blue-800 mb-3">
                            <span className="font-medium">💡 フローティングタイマー:</span> 
                            タスクの「⏳」ボタンでポモドーロを開始すると、画面に浮かぶタイマーが表示されます。
                          </p>
                          <div className="space-y-2 text-sm text-blue-700">
                            <p>• ドラッグで好きな位置に移動可能</p>
                            <p>• ゲーム中でも動作継続</p>
                            <p>• 最小化/展開機能付き</p>
                            <p>• アラーム音で終了をお知らせ</p>
                          </div>
                        </div>
                      </motion.div>
                      
                      {/* PWAインストールガイド */}
                      <InstallPWAGuide />
                      
                      {/* 新機能紹介カード */}
                      <NewFeaturesCard />
                    </div>
                  </div>
                ) : currentTab === 'habits' ? (
                  // 🔥 新機能: 習慣管理タブ
                  <div className="grid grid-cols-12 gap-6 mb-20">
                    <div className="col-span-12 md:col-span-12">
                      <motion.div className="p-6 rounded-lg shadow-lg bg-white">
                        <HabitManager />
                      </motion.div>
                    </div>
                    
                    <div className="col-span-12 md:col-span-4 space-y-6">
                      <motion.div className="p-6 rounded-lg shadow-lg bg-white">
                        <PointsDashboard />
                      </motion.div>
                      <HabitGuide />
                    </div>
                  </div>
                ) : currentTab === 'games' ? (
                  // ゲームセンタータブ
                  <div className="grid grid-cols-12 gap-6 mb-20">
                    <div className="col-span-12 md:col-span-8">
                      <motion.div className="p-6 rounded-lg shadow-lg bg-white">
                        <GameCenter />
                      </motion.div>
                    </div>
                    
                    <div className="col-span-12 md:col-span-4 space-y-6">
                      <motion.div className="p-6 rounded-lg shadow-lg bg-white">
                        <PointsDashboard />
                      </motion.div>
                      <GameCenterGuide />
                    </div>
                  </div>
                ) : (
                  // ショップタブ
                  <div className="grid grid-cols-12 gap-6 mb-20">
                    <div className="col-span-12 md:col-span-8">
                      <motion.div className="p-6 rounded-lg shadow-lg bg-white">
                        <Shop />
                      </motion.div>
                    </div>
                    
                    <div className="col-span-12 md:col-span-4 space-y-6">
                      <motion.div className="p-6 rounded-lg shadow-lg bg-white">
                        <PointsDashboard />
                      </motion.div>
                      <ShopGuide />
                    </div>
                  </div>
                )}
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
 */
function InstallPWAGuide() {
  const [isPWA, setIsPWA] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWA(true);
    }
  }, []);
  
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

/**
 * 新機能紹介カードコンポーネント
 */
function NewFeaturesCard() {
  const [showFeatures, setShowFeatures] = useState(true);
  
  if (!showFeatures) return null;
  
  return (
    <motion.div 
      className="p-6 rounded-lg shadow-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.2 }}
    >
      <div className="flex justify-between items-start">
        <h2 className="text-lg font-bold text-purple-800 mb-3">🎉 v1.7.0 新機能！</h2>
        <button
          onClick={() => setShowFeatures(false)}
          className="text-purple-500 hover:text-purple-700"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-sm text-purple-700">
        <div className="flex items-center">
          <span className="mr-2">🔄</span>
          <span>習慣管理機能追加</span>
        </div>
        <div className="flex items-center">
          <span className="mr-2">🤖</span>
          <span>AI習慣提案システム</span>
        </div>
        <div className="flex items-center">
          <span className="mr-2">📊</span>
          <span>習慣統計・ストリーク機能</span>
        </div>
        <div className="flex items-center">
          <span className="mr-2">⏰</span>
          <span>習慣リマインダー機能</span>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-white rounded-lg border border-purple-100">
        <p className="text-xs text-purple-600">
          <strong>v1.7.0の特徴:</strong> 効果音システム追加！タスク・サブタスク・習慣完了時に効果音が再生され、達成感とモチベーションを向上。音量調整や無効化も可能で、より快適なタスク管理体験を提供。
        </p>
      </div>
    </motion.div>
  );
}

/**
 * ゲームセンター紹介カードコンポーネント
 */
function GameCenterGuide() {
  const [showGuide, setShowGuide] = useState(true);
  
  if (!showGuide) return null;
  
  return (
    <motion.div 
      className="p-6 rounded-lg shadow-lg bg-gradient-to-r from-green-50 to-blue-50 border border-green-200"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex justify-between items-start">
        <h2 className="text-lg font-bold text-green-800 mb-3">🎮 ゲームセンターガイド</h2>
        <button
          onClick={() => setShowGuide(false)}
          className="text-green-500 hover:text-green-700"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-3 text-sm text-green-700">
        <div className="bg-white p-3 rounded-lg border border-green-100">
          <p className="font-medium text-green-800 mb-1">💰 ポイント消費システム</p>
          <p>1回のプレイに5ポイント必要です。タスクを完了してポイントを貯めましょう！</p>
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-green-100">
          <p className="font-medium text-green-800 mb-1">⏱️ v1.6.0新機能: ポモドーロ連携</p>
          <p>ゲーム中でもポモドーロタイマーが継続動作！効率的な休憩時間を楽しめます。</p>
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-green-100">
          <p className="font-medium text-green-800 mb-1">🏆 スコア記録</p>
          <p>最高スコア、平均スコア、プレイ回数が自動的に記録されます。</p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * ショップガイドコンポーネント
 */
function ShopGuide() {
  const [showGuide, setShowGuide] = useState(true);
  const { backgroundTheme } = useThemeStore();
  
  if (!showGuide) return null;
  
  return (
    <motion.div 
      className="p-6 rounded-lg shadow-lg bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex justify-between items-start">
        <h2 className="text-lg font-bold text-pink-800 mb-3">🛍️ ポイントショップガイド</h2>
        <button
          onClick={() => setShowGuide(false)}
          className="text-pink-500 hover:text-pink-700"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-3 text-sm text-pink-700">
        <div className="bg-white p-3 rounded-lg border border-pink-100">
          <p className="font-medium text-pink-800 mb-1">🎨 背景テーマ</p>
          <p>美しいグラデーション背景でアプリをカスタマイズ。4段階のレアリティがあります！</p>
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-pink-100">
          <p className="font-medium text-pink-800 mb-1">💎 購入システム</p>
          <p>タスク完了やログインボーナスで貯めたポイントで購入できます。</p>
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-pink-100">
          <p className="font-medium text-pink-800 mb-1">🌟 レアリティシステム</p>
          <p>• コモン: 50pt<br/>• レア: 75pt<br/>• エピック: 100pt<br/>• レジェンダリー: 200-250pt</p>
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-pink-100">
          <p className="font-medium text-pink-800 mb-1">✨ 現在適用中</p>
          <p className="text-purple-700 font-medium">{backgroundTheme.name}</p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * 🔥 新機能: 習慣管理ガイドコンポーネント
 */
function HabitGuide() {
  const [showGuide, setShowGuide] = useState(true);
  const { habits } = useHabitStore();
  
  if (!showGuide) return null;
  
  return (
    <motion.div 
      className="p-6 rounded-lg shadow-lg bg-gradient-to-r from-indigo-50 to-cyan-50 border border-indigo-200"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex justify-between items-start">
        <h2 className="text-lg font-bold text-indigo-800 mb-3">🔄 習慣管理ガイド</h2>
        <button
          onClick={() => setShowGuide(false)}
          className="text-indigo-500 hover:text-indigo-700"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-3 text-sm text-indigo-700">
        <div className="bg-white p-3 rounded-lg border border-indigo-100">
          <p className="font-medium text-indigo-800 mb-1">🎯 習慣の力</p>
          <p>小さな習慣の積み重ねが大きな変化を生み出します。毎日の継続を大切にしましょう。</p>
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-indigo-100">
          <p className="font-medium text-indigo-800 mb-1">💰 ポイント獲得</p>
          <p>習慣完了で8ポイント獲得！タスクと合わせて効率的にポイントを貯められます。</p>
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-indigo-100">
          <p className="font-medium text-indigo-800 mb-1">🤖 AI提案システム</p>
          <p>あなたの行動パターンと天気を分析し、最適な習慣を提案します。</p>
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-indigo-100">
          <p className="font-medium text-indigo-800 mb-1">⏰ 習慣リマインダー</p>
          <p>20時頃に未完了の習慣をお知らせ。継続をサポートします。</p>
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-indigo-100">
          <p className="font-medium text-indigo-800 mb-1">📊 現在の習慣数</p>
          <p className="text-cyan-700 font-medium">{habits.length}個の習慣を管理中</p>
        </div>
      </div>
    </motion.div>
  );
}