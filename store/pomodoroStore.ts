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
  isAlarmPlaying: boolean; // アラーム再生状態を追加
  
  // ポモドーロを開始する
  startPomodoro: (taskId: string) => void;
  
  // ポモドーロを停止する
  stopPomodoro: () => void;
  
  // 時間を進める（毎秒呼び出される）
  tick: () => void;
  
  // バックグラウンドタイマーを開始・停止
  setupBackgroundTimer: () => void;
  clearBackgroundTimer: () => void;

  // テスト用に音を鳴らす
  playTestSound: () => void;
  
  // アラームを停止する
  stopAlarm: () => void;
};

// 作業時間と休憩時間の設定（秒単位）
const WORK_TIME = 25 * 60; // 25分
const BREAK_TIME = 5 * 60; // 5分

// 開発テスト用に短い時間を設定（コメントアウト）
// const WORK_TIME = 10; // 10秒
// const BREAK_TIME = 5; // 5秒

// グローバルなタイマーIDを保持
let globalTimerId: NodeJS.Timeout | null = null;

// グローバルなオーディオインスタンス
let audioInstance: HTMLAudioElement | null = null;

// サウンド再生カウンタ
let soundPlayCount = 0;

// サウンド通知を再生する関数（Zustandストア内で使用するためのラッパー関数）
const playNotificationSoundWrapper = (set: any) => {
  if (typeof window === 'undefined') return;

  try {
    // 既存のオーディオインスタンスがあれば停止
    if (audioInstance) {
      audioInstance.pause();
      audioInstance.currentTime = 0;
    }

    // 新しいオーディオインスタンスを作成
    audioInstance = new Audio("/sounds/bell.mp3");
    
    // ボリュームを最大に設定
    audioInstance.volume = 1.0;
    
    // 再生回数をリセット
    soundPlayCount = 0;
    
    // ループ設定（5回再生）
    audioInstance.onended = () => {
      if (soundPlayCount < 4 && audioInstance) {
        audioInstance.currentTime = 0;
        audioInstance.play()
          .then(() => {
            soundPlayCount++;
            // アラーム再生中のフラグをセット
            set({ isAlarmPlaying: true });
          })
          .catch(err => {
            console.error("オーディオ再生エラー（ループ）:", err);
            set({ isAlarmPlaying: false });
          });
      } else {
        // 5回再生し終わったらフラグをリセット
        set({ isAlarmPlaying: false });
      }
    };
    
    // 再生を試みる
    const playPromise = audioInstance.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // 再生開始時にフラグをセット
          set({ isAlarmPlaying: true });
        })
        .catch(err => {
          console.error("オーディオ再生エラー:", err);
          set({ isAlarmPlaying: false });
          // フィードバックメッセージを表示（代替通知）
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage("🔔 タイマーが終了しました！");
        });
    }
    
    // ブラウザ通知も表示
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("ポモドーロタイマーが終了しました！", {
        body: "次のステップに進みましょう",
        icon: "/favicon.ico"
      });
    }
  } catch (error) {
    console.error("通知エラー:", error);
    set({ isAlarmPlaying: false });
  }
};

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  taskId: null,
  isRunning: false,
  timeLeft: WORK_TIME,
  isBreak: false,
  pomodoroCount: 0,
  isVisible: false,
  isAlarmPlaying: false, // アラーム再生状態のデフォルト値

  // アラームを停止する関数
  stopAlarm: () => {
    if (audioInstance) {
      audioInstance.pause();
      audioInstance.currentTime = 0;
      audioInstance = null;
    }
    set({ isAlarmPlaying: false });
    
    // フィードバックメッセージを表示
    const feedbackStore = useFeedbackStore.getState();
    feedbackStore.setMessage("アラームを停止しました");
  },

  // テスト用に音を鳴らす関数
  playTestSound: () => {
    // フィードバックメッセージを表示
    const feedbackStore = useFeedbackStore.getState();
    feedbackStore.setMessage("テストサウンドを再生中...");
    
    playNotificationSoundWrapper(set);
  },

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
    
    // 通知許可をリクエスト
    if (typeof window !== 'undefined' && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    
    // オーディオの事前読み込み
    if (typeof window !== 'undefined') {
      const preloadAudio = new Audio("/sounds/bell.mp3");
      preloadAudio.preload = "auto";
      preloadAudio.load();
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
      isVisible: true,
      isAlarmPlaying: false
    });
    
    // バックグラウンドタイマーを開始
    get().setupBackgroundTimer();
    
    // ユーザーインタラクションを利用してオーディオを事前に初期化
    if (typeof window !== 'undefined') {
      const silentAudio = new Audio("/sounds/silence.mp3");
      silentAudio.volume = 0.1;
      silentAudio.play().catch(err => {
        console.log("サイレントオーディオの初期化に失敗:", err);
      });
    }
  },

  stopPomodoro: () => {
    // アラームが鳴っていたら停止
    if (get().isAlarmPlaying) {
      get().stopAlarm();
    }
    
    set({ 
      taskId: null, 
      isRunning: false, 
      isBreak: false, 
      isVisible: false,
      isAlarmPlaying: false
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
          
          // 効果音を再生
          playNotificationSoundWrapper(set);
          
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
          
          // 効果音を再生
          playNotificationSoundWrapper(set);
          
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