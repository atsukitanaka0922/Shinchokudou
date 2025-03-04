import { create } from "zustand";
import { useTaskStore } from "./taskStore";
import { useStatsStore } from "./statsStore";

type PomodoroState = {
  activeTaskId: number | null;
  timeLeft: number;
  isRunning: boolean;
  startTimer: (taskId: number) => void;
  stopTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
};

export const usePomodoroStore = create<PomodoroState>((set) => ({
  activeTaskId: null,
  timeLeft: 25 * 60, // 25分
  isRunning: false,
  startTimer: (taskId) =>
    set(() => ({ activeTaskId: taskId, timeLeft: 25 * 60, isRunning: true })),
  stopTimer: () => set(() => ({ isRunning: false })),
  resetTimer: () => set(() => ({ activeTaskId: null, timeLeft: 25 * 60, isRunning: false })),
  tick: () =>
    set((state) => {
      if (state.timeLeft > 1) {
        return { timeLeft: state.timeLeft - 1 };
      } else {
        useTaskStore.getState().toggleTask(String(state.activeTaskId!)); // ここを修正
        useStatsStore.getState().incrementPomodoro();
        return { timeLeft: 0, isRunning: false, activeTaskId: null };
      }
    }),
}));
