/**
 * ポモドーロタイマー管理ストア
 * 
 * ポモドーロテクニックに基づくタイマー機能を提供します。
 * 作業時間と休憩時間の管理、通知機能、統計情報の連携などを行います。
 */

import { create } from "zustand";
import { useFeedbackStore } from "./feedbackStore";
import { useStatsStore } from "./statsStore";

/**
 * ポモドーロタイマーの状態定義
 */
type PomodoroState = {
  taskId: string | null;      // 現在作業中のタスクID
  isRunning: boolean;         // タイマー実行中かどうか
  timeLeft: number;           // 残り時間（秒）
  isBreak: boolean;           // 休憩中かどうか
  pomodoroCount: number;      // 完了したポモドーロの数
  isVisible: boolean;         // タイマーUIの表示状態
  isAlarmPlaying: boolean;    // アラーム再生中かどうか
  
  // アクション
  startPomodoro: (taskId: string) => void;
  stopPomodoro: () => void;
  tick: () => void;
  setupBackgroundTimer: () => void;
  clearBackgroundTimer: () => void;
  playTestSound: () => void;
  stopAlarm: () => void;
};

// 時間設定（秒単位）
const WORK_TIME = 25 * 60;  // 25分間の作業時間
const BREAK_TIME = 5 * 60;  // 5分間の休憩時間

// 開発テスト用の短い時間設定（必要に応じてコメントを外す）
// const WORK_TIME = 10;  // 10秒の作業時間
// const BREAK_TIME = 5;  // 5秒の休憩時間

// グローバル変数（ストア外でも状態を保持するため）
let globalTimerId: NodeJS.Timeout | null = null;
let audioInstance: HTMLAudioElement | null = null;
let soundPlayCount = 0;

/**
 * 通知音を再生する関数
 * @param set Zustand の set 関数
 */
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
    audioInstance.volume = 1.0;
    soundPlayCount = 0;
    
    // 最大5回の再生ループを設定
    audioInstance.onended = () => {
      if (soundPlayCount < 4 && audioInstance) {
        audioInstance.currentTime = 0;
        audioInstance.play()
          .then(() => {
            soundPlayCount++;
            set({ isAlarmPlaying: true });
          })
          .catch(err => {
            console.error("オーディオ再生エラー:", err);
            set({ isAlarmPlaying: false });
          });
      } else {
        set({ isAlarmPlaying: false });
      }
    };
    
    // 再生を開始
    const playPromise = audioInstance.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          set({ isAlarmPlaying: true });
        })
        .catch(err => {
          console.error("オーディオ再生エラー:", err);
          set({ isAlarmPlaying: false });
          
          // 代替通知としてフィードバックを表示
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage("🔔 タイマーが終了しました！");
        });
    }
    
    // ブラウザ通知を表示（許可されている場合）
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

/**
 * ポモドーロタイマーを管理するZustandストア
 */
export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  taskId: null,
  isRunning: false,
  timeLeft: WORK_TIME,
  isBreak: false,
  pomodoroCount: 0,
  isVisible: false,
  isAlarmPlaying: false,

  /**
   * アラームを停止
   */
  stopAlarm: () => {
    if (audioInstance) {
      audioInstance.pause();
      audioInstance.currentTime = 0;
      audioInstance = null;
    }
    set({ isAlarmPlaying: false });
    
    const feedbackStore = useFeedbackStore.getState();
    feedbackStore.setMessage("アラームを停止しました");
  },

  /**
   * テスト用に通知音を再生
   */
  playTestSound: () => {
    const feedbackStore = useFeedbackStore.getState();
    feedbackStore.setMessage("テストサウンドを再生中...");
    
    playNotificationSoundWrapper(set);
  },

  /**
   * バックグラウンドタイマーをセットアップ
   */
  setupBackgroundTimer: () => {
    const tick = get().tick;
    
    // 既存のタイマーが動いていれば何もしない
    if (globalTimerId) return;
    
    // 毎秒tickを実行するタイマーを設定
    globalTimerId = setInterval(() => {
      if (get().isRunning) {
        tick();
      }
    }, 1000);
    
    // 通知許可をリクエスト
    if (typeof window !== 'undefined' && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    
    // サウンド事前読み込み
    if (typeof window !== 'undefined') {
      const preloadAudio = new Audio("/sounds/bell.mp3");
      preloadAudio.preload = "auto";
      preloadAudio.load();
    }
  },
  
  /**
   * バックグラウンドタイマーを解除
   */
  clearBackgroundTimer: () => {
    if (globalTimerId) {
      clearInterval(globalTimerId);
      globalTimerId = null;
    }
  },

  /**
   * ポモドーロタイマーを開始
   * @param taskId 作業対象のタスクID
   */
  startPomodoro: (taskId) => {
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
    
    // オーディオ初期化（ユーザーインタラクション時に行う必要がある）
    if (typeof window !== 'undefined') {
      const silentAudio = new Audio("/sounds/silence.mp3");
      silentAudio.volume = 0.1;
      silentAudio.play().catch(() => {
        // エラーは無視（サイレントオーディオは存在しなくても良い）
      });
    }
  },

  /**
   * ポモドーロタイマーを停止
   */
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
    
    const feedbackStore = useFeedbackStore.getState();
    feedbackStore.setMessage("ポモドーロタイマーを終了しました");
  },

  /**
   * タイマーの時間を進める（毎秒呼び出される）
   */
  tick: () => 
    set((state) => {
      if (state.timeLeft > 0) {
        return { timeLeft: state.timeLeft - 1 };
      } else {
        // タイマーが0になった時の処理
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
          // 作業終了 → 休憩開始（統計更新）
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage("ポモドーロ完了！休憩タイムです");
          
          // 統計を更新
          const statsStore = useStatsStore.getState();
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

// ページ読み込み時にバックグラウンドタイマーを開始
if (typeof window !== 'undefined') {
  setTimeout(() => {
    usePomodoroStore.getState().setupBackgroundTimer();
  }, 100);
}

// ページアンロード時にタイマーをクリア
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    usePomodoroStore.getState().clearBackgroundTimer();
  });
}