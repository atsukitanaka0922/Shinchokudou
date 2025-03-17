/**
 * 気分状態管理ストア
 * 
 * ユーザーの現在の気分状態を管理するZustandストア
 * AIタスク提案などで利用される状態情報
 */

import { create } from "zustand";

// 気分の種類
type Mood = "元気" | "普通" | "疲れた";

/**
 * 気分状態の型定義
 */
type MoodState = {
  mood: Mood;              // 現在の気分
  setMood: (mood: Mood) => void;  // 気分を設定する関数
};

/**
 * 気分状態管理Zustandストア
 */
export const useMoodStore = create<MoodState>((set) => ({
  // デフォルトの気分
  mood: "普通",
  
  /**
   * 気分を設定
   * @param mood 新しい気分状態
   */
  setMood: (mood) => set({ mood }),
}));
