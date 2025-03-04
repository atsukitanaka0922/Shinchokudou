import { create } from "zustand";
import { persist } from "zustand/middleware";

type StatsState = {
  pomodoroCount: number;
  incrementPomodoro: () => void;
};

export const useStatsStore = create<StatsState>()(
  persist(
    (set) => ({
      pomodoroCount: 0,
      incrementPomodoro: () =>
        set((state) => ({ pomodoroCount: state.pomodoroCount + 1 })),
    }),
    { name: "pomodoro-storage" }
  )
);
