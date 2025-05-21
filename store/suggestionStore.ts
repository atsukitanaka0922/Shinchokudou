/**
 * タスク提案管理ストア
 * 
 * ユーザーの現在の気分に基づいたタスク提案を管理するZustandストア
 * 気分に応じたタスク候補を生成する機能を提供
 */

import { create } from "zustand";
import { useMoodStore } from "./moodStore";

/**
 * タスク提案状態の型定義
 */
type SuggestionState = {
  suggestedTasks: string[];           // 提案されたタスクのリスト
  generateSuggestions: () => void;    // タスク提案を生成する関数
};

/**
 * タスク提案管理Zustandストア
 */
export const useSuggestionStore = create<SuggestionState>((set) => ({
  suggestedTasks: [],
  
  /**
   * 現在の気分に基づいてタスク提案を生成
   */
  generateSuggestions: () => {
    // 現在の気分を取得
    const mood = useMoodStore.getState().mood;

    // 気分別のタスク提案
    const suggestions: Record<string, string[]> = {
      "元気": ["ランニング🏃", "新しいスキルを学ぶ📚", "部屋の掃除🧹"],
      "普通": ["読書📖", "簡単なストレッチ🧘", "料理をする🍳"],
      "疲れた": ["リラックス音楽を聴く🎵", "軽い散歩🚶", "昼寝をする😴"]
    };

    // 気分に応じた提案を設定（見つからない場合は空配列）
    set({ suggestedTasks: suggestions[mood] || [] });
  }
}));
