import { create } from "zustand";

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

export const usePomodoroStore = create<PomodoroState>((set) => ({
  taskId: null,
  isRunning: false,
  timeLeft: 25 * 60, // 25分
  isBreak: false, // 作業 or 休憩
  pomodoroCount: 0, // ポモドーロ回数
  isVisible: false, // タイマーの表示状態

  startPomodoro: (taskId) =>
    set({ taskId, isRunning: true, timeLeft: 25 * 60, isBreak: false, isVisible: true }),

  stopPomodoro: () =>
    set({ taskId: null, isRunning: false, isBreak: false, isVisible: false }),

  tick: () =>
    set((state) => {
      if (state.timeLeft > 0) {
        return { timeLeft: state.timeLeft - 1 };
      } else {
        if (state.isBreak) {
          // 休憩終了 → 新しいポモドーロ開始
          return { timeLeft: 25 * 60, isBreak: false, isRunning: true };
        } else {
          // 作業終了 → 休憩開始
          return {
            timeLeft: 5 * 60,
            isBreak: true,
            isRunning: true,
            pomodoroCount: state.pomodoroCount + 1, // ポモドーロ回数カウント
          };
        }
      }
    }),
}));
