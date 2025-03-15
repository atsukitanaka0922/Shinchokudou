import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeState = {
  bgColor: string;
  setBgColor: (color: string) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      bgColor: "#ffffff", // デフォルトの背景色（白）
      setBgColor: (color) => set({ bgColor: color }),
    }),
    { name: "theme-storage" }
  )
);
