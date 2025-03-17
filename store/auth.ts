/**
 * 認証管理ストア
 * 
 * Firebase Authenticationを利用した認証機能を提供するZustandストア
 * ユーザーのログイン状態管理、ログイン・ログアウト機能を提供
 */

import { create } from "zustand";
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * 認証状態の型定義
 */
interface AuthState {
  user: User | null;       // 現在ログイン中のユーザー情報
  loading: boolean;        // 認証状態読み込み中フラグ
  loginWithGoogle: () => void;  // Google認証でログインする関数
  logout: () => void;      // ログアウトする関数
}

/**
 * 認証管理Zustandストア
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  /**
   * Googleアカウントでログイン
   */
  loginWithGoogle: async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  },

  /**
   * ログアウト処理
   */
  logout: async () => {
    await signOut(auth);
  },
}));

// Firebase Auth の状態変更を監視し、ストアの状態を自動更新
onAuthStateChanged(auth, (user) => {
  useAuthStore.setState({ user, loading: false });
});
