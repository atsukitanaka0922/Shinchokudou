import { create } from "zustand";
import { useFeedbackStore } from "./feedbackStore";
import { useStatsStore } from "./statsStore";

type PomodoroState = {
  taskId: string | null;
  isRunning: boolean;
  timeLeft: number;
  isBreak: boolean;
  pomodoroCount: number;
  isVisible: boolean;
  
  // ポモドーロを開始する
  startPomodoro: (taskId: string) => void;
  
  // ポモドーロを停止する
  stopPomodoro: () => void;
  
  // 時間を進める（毎秒呼び出される）
  tick: () => void;
  
  // バックグラウンドタイマーを開始・停止
  setupBackgroundTimer: () => void;
  clearBackgroundTimer: () => void;
};

// 作業時間と休憩時間の設定（秒単位）
const WORK_TIME = 25 * 60; // 25分
const BREAK_TIME = 5 * 60; // 5分

// グローバルなタイマーIDを保持
let globalTimerId: NodeJS.Timeout | null = null;

// サウンド通知を再生
const playNotificationSound = (isBreak: boolean) => {
  if (typeof window === 'undefined') return;
  
  try {
    const audio = new Audio("/sounds/pomodoro-end.mp3");
    audio.play().catch(err => console.log("オーディオ再生エラー:", err));
    
    // ブラウザ通知も表示
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(isBreak ? "休憩終了！" : "ポモドーロ完了！", {
        body: isBreak ? "新しいポモドーロを開始します" : "5分間の休憩を始めましょう",
        icon: "/favicon.ico"
      });
    }
  } catch (error) {
    console.log("通知エラー:", error);
  }
};

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  taskId: null,
  isRunning: false,
  timeLeft: WORK_TIME,
  isBreak: false,
  pomodoroCount: 0,
  isVisible: false,

  // バックグラウンドタイマーをセットアップ
  setupBackgroundTimer: () => {
    const tick = get().tick;
    
    // すでにタイマーが動いていれば何もしない
    if (globalTimerId) return;
    
    // グローバルなタイマーを設定
    globalTimerId = setInterval(() => {
      if (get().isRunning) {
        tick();
      }
    }, 1000);
    
    // ページ読み込み時に通知許可をリクエスト
    if (typeof window !== 'undefined' && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  },
  
  // バックグラウンドタイマーをクリア
  clearBackgroundTimer: () => {
    if (globalTimerId) {
      clearInterval(globalTimerId);
      globalTimerId = null;
    }
  },

  startPomodoro: (taskId) => {
    // フィードバックメッセージを表示
    const feedbackStore = useFeedbackStore.getState();
    feedbackStore.setMessage("ポモドーロタイマーを開始しました！");
    
    set({ 
      taskId, 
      isRunning: true, 
      timeLeft: WORK_TIME, 
      isBreak: false, 
      isVisible: true 
    });
    
    // バックグラウンドタイマーを開始
    get().setupBackgroundTimer();
  },

  stopPomodoro: () => {
    set({ 
      taskId: null, 
      isRunning: false, 
      isBreak: false, 
      isVisible: false 
    });
    
    // フィードバックメッセージを表示
    const feedbackStore = useFeedbackStore.getState();
    feedbackStore.setMessage("ポモドーロタイマーを終了しました");
  },

  tick: () => 
    set((state) => {
      if (state.timeLeft > 0) {
        return { timeLeft: state.timeLeft - 1 };
      } else {
        // タイマーが0になった時
        if (state.isBreak) {
          // 休憩終了 → 新しいポモドーロ開始
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage("休憩終了！新しいポモドーロを開始します");
          
          // 音声通知を再生
          playNotificationSound(true);
          
          return { 
            timeLeft: WORK_TIME, 
            isBreak: false, 
            isRunning: true 
          };
        } else {
          // 作業終了 → 休憩開始（ここでポモドーロ統計を更新）
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage("ポモドーロ完了！休憩タイムです");
          
          // statsStoreのincrementPomodoroを呼び出す
          const statsStore = useStatsStore.getState();
          console.log("✅ 作業時間終了！statsStore.incrementPomodoro() を実行します。");
          statsStore.incrementPomodoro();
          
          // 音声通知を再生
          playNotificationSound(false);
          
          return {
            timeLeft: BREAK_TIME,
            isBreak: true,
            isRunning: true,
            pomodoroCount: state.pomodoroCount + 1
          };
        }
      }
    }),
}));

// ページ読み込み時にバックグラウンドタイマーを自動的に開始
if (typeof window !== 'undefined') {
  // 小さい遅延を入れて、アプリの初期化後に実行されるようにする
  setTimeout(() => {
    usePomodoroStore.getState().setupBackgroundTimer();
  }, 100);
}

// ページアンロード時にタイマーをクリーンアップ
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    usePomodoroStore.getState().clearBackgroundTimer();
  });
}