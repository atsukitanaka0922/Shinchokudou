import { create } from "zustand";

type FeedbackState = {
  message: string | null;
  setMessage: (msg: string | null) => void;
};

export const useFeedbackStore = create<FeedbackState>((set) => ({
  message: null,
  setMessage: (msg) => set({ message: msg }),
}));
