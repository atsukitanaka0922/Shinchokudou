import { create } from "zustand";

type Mood = "元気" | "普通" | "疲れた";

type MoodState = {
  mood: Mood;
  setMood: (mood: Mood) => void;
};

export const useMoodStore = create<MoodState>((set) => ({
  mood: "普通",
  setMood: (mood) => set({ mood }),
}));
