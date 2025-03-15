import { create } from "zustand";
import { useFeedbackStore } from "./feedbackStore";

type PomodoroState = {
  taskId: string | null;
  isRunning: boolean;
  timeLeft: number;
  isBreak: boolean;
  pomodoroCount: number;
  isVisible: boolean;
  startPomodoro: (taskId: string) => void;
  stopPomodoro: () => void;
  tick: () => void;
};

// 作業時間と休憩時間の設定（秒単位）
const WORK_TIME = 25 * 60; // 25分
const BREAK_TIME = 5 * 60; // 5分

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  taskId: null,
  isRunning: false,
  timeLeft: WORK_TIME,
  isBreak: false, // 作業 or 休憩
  pomodoroCount: 0, // ポモドーロ回数
  isVisible: false, // タイマーの表示状態

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
          
          return { 
            timeLeft: WORK_TIME, 
            isBreak: false, 
            isRunning: true 
          };
        } else {
          // 作業終了 → 休憩開始
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage("ポモドーロ完了！休憩タイムです");
          
          return {
            timeLeft: BREAK_TIME,
            isBreak: true,
            isRunning: true,
            pomodoroCount: state.pomodoroCount + 1 // ポモドーロ回数カウント
          };
        }
      }
    }),
}));