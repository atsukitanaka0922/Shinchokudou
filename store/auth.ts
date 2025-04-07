/**
 * 認証管理ストア
 * 
 * Firebase Authenticationを利用した認証機能を提供するZustandストア
 * ユーザーのログイン状態管理、ログイン・ログアウト機能を提供
 */

import { create } from "zustand";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * 認証状態の型定義
 */
interface AuthState {
  user: User | null;       // 現在ログイン中のユーザー情報
  loading: boolean;        // 認証状態読み込み中フラグ
  authError: string | null; // 認証エラーメッセージ
  
  // ログイン機能
  loginWithGoogle: () => Promise<void>;  // Google認証でログイン
  loginWithEmail: (email: string, password: string) => Promise<void>; // メール/パスワードでログイン
  
  // 会員登録機能
  registerWithEmail: (email: string, password: string) => Promise<void>; // メール/パスワードで登録
  
  // パスワードリセット
  resetPassword: (email: string) => Promise<void>; // パスワードリセットメール送信
  
  // ログアウト
  logout: () => Promise<void>;      // ログアウトする関数
  
  // ユーザープロフィール更新
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
  
  // エラー管理
  clearAuthError: () => void;       // 認証エラーをクリア
}

/**
 * エラーメッセージを日本語に変換する関数
 */
const translateFirebaseError = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'このメールアドレスは既に使用されています';
    case 'auth/invalid-email':
      return 'メールアドレスの形式が正しくありません';
    case 'auth/user-disabled':
      return 'このアカウントは無効になっています';
    case 'auth/user-not-found':
      return 'ユーザーが見つかりません';
    case 'auth/wrong-password':
      return 'パスワードが間違っています';
    case 'auth/weak-password':
      return 'パスワードは6文字以上にしてください';
    case 'auth/network-request-failed':
      return 'ネットワークエラーが発生しました';
    case 'auth/too-many-requests':
      return 'アクセスが集中しています。しばらく時間をおいてお試しください';
    case 'auth/popup-closed-by-user':
      return 'ポップアップが閉じられました。もう一度お試しください';
    default:
      return 'エラーが発生しました: ' + errorCode;
  }
};

/**
 * 認証管理Zustandストア
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  authError: null,

  /**
   * Googleアカウントでログイン
   */
  loginWithGoogle: async () => {
    set({ loading: true, authError: null });
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      const errorCode = error.code || 'unknown';
      const errorMessage = translateFirebaseError(errorCode);
      set({ authError: errorMessage });
      console.error('Google ログインエラー:', error);
    } finally {
      set({ loading: false });
    }
  },
  
  /**
   * メールアドレスとパスワードでログイン
   */
  loginWithEmail: async (email, password) => {
    set({ loading: true, authError: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      const errorCode = error.code || 'unknown';
      const errorMessage = translateFirebaseError(errorCode);
      set({ authError: errorMessage });
      console.error('メールログインエラー:', error);
    } finally {
      set({ loading: false });
    }
  },
  
  /**
   * メールアドレスとパスワードで会員登録
   */
  registerWithEmail: async (email, password) => {
    set({ loading: true, authError: null });
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      const errorCode = error.code || 'unknown';
      const errorMessage = translateFirebaseError(errorCode);
      set({ authError: errorMessage });
      console.error('会員登録エラー:', error);
    } finally {
      set({ loading: false });
    }
  },
  
  /**
   * パスワードリセットメールを送信
   */
  resetPassword: async (email) => {
    set({ loading: true, authError: null });
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      const errorCode = error.code || 'unknown';
      const errorMessage = translateFirebaseError(errorCode);
      set({ authError: errorMessage });
      console.error('パスワードリセットエラー:', error);
    } finally {
      set({ loading: false });
    }
  },

  /**
   * ログアウト処理
   */
  logout: async () => {
    set({ loading: true, authError: null });
    try {
      await signOut(auth);
    } catch (error: any) {
      const errorCode = error.code || 'unknown';
      const errorMessage = translateFirebaseError(errorCode);
      set({ authError: errorMessage });
      console.error('ログアウトエラー:', error);
    } finally {
      set({ loading: false });
    }
  },
  
  /**
   * ユーザープロフィールを更新
   */
  updateUserProfile: async (displayName, photoURL) => {
    const { user } = get();
    if (!user) return;
    
    set({ loading: true, authError: null });
    try {
      await updateProfile(user, {
        displayName,
        photoURL
      });
      // ユーザー情報を更新するために強制的に再設定
      set({ user: auth.currentUser });
    } catch (error: any) {
      const errorCode = error.code || 'unknown';
      const errorMessage = translateFirebaseError(errorCode);
      set({ authError: errorMessage });
      console.error('プロフィール更新エラー:', error);
    } finally {
      set({ loading: false });
    }
  },
  
  /**
   * 認証エラーをクリア
   */
  clearAuthError: () => {
    set({ authError: null });
  }
}));

// Firebase Auth の状態変更を監視し、ストアの状態を自動更新
onAuthStateChanged(auth, (user) => {
  useAuthStore.setState({ user, loading: false });
});