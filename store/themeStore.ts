/**
 * テーマ設定管理ストア
 * 
 * アプリの見た目や色のテーマを管理するZustandストア
 * ローカルストレージを利用して設定を永続化
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * テーマ状態の型定義
 */
type ThemeState = {
  bgColor: string;                    // 背景色（HTMLカラーコード）
  setBgColor: (color: string) => void; // 背景色を設定する関数
};

/**
 * テーマ管理Zustandストア
 * persist ミドルウェアを使用してローカルストレージに設定を保存
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      // デフォルトの背景色（白）
      bgColor: "#ffffff",
      
      /**
       * 背景色を設定
       * @param color 新しい背景色（HTMLカラーコード）
       */
      setBgColor: (color) => set({ bgColor: color }),
    }),
    { 
      name: "theme-storage" // ローカルストレージのキー名
    }
  )
);
