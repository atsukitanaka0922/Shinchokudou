import { create } from "zustand";
import { useMoodStore } from "./moodStore";

type SuggestionState = {
  suggestedTasks: string[];
  generateSuggestions: () => void;
};

export const useSuggestionStore = create<SuggestionState>((set) => ({
  suggestedTasks: [],
  generateSuggestions: () => {
    const mood = useMoodStore.getState().mood;

    const suggestions: Record<string, string[]> = {
      "元気": ["ランニング🏃", "新しいスキルを学ぶ📚", "部屋の掃除🧹"],
      "普通": ["読書📖", "簡単なストレッチ🧘", "料理をする🍳"],
      "疲れた": ["リラックス音楽を聴く🎵", "軽い散歩🚶", "昼寝をする😴"]
    };

    set({ suggestedTasks: suggestions[mood] || [] });
  }
}));
