import { create } from "zustand";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase"; // ✅ `lib/firebase.ts` からインポート

interface AuthState {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  loginWithGoogle: async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  },

  logout: async () => {
    await signOut(auth);
  },
}));

// ユーザーの状態を監視
onAuthStateChanged(auth, (user) => {
  useAuthStore.setState({ user, loading: false });
});
