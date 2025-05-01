/**
 * 認証トークン自動更新ユーティリティ
 * 
 * Firebaseの認証トークンを定期的に更新し、
 * 「Missing or insufficient permissions」エラーを防止する
 */

import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

/**
 * 認証状態リスナーを設定
 * ログイン状態の変化を監視し、ユーザーが自動的にログアウトされた場合に対応
 */
export const setupAuthStateListener = () => {
  // ユーザーの認証状態変更を監視
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("認証状態: ログイン中", user.uid);
      
      // トークンを1時間ごとに更新するタイマーを設定
      startTokenRefreshTimer(user);
    } else {
      console.log("認証状態: ログアウト");
      
      // ユーザーが意図せずログアウトした可能性がある場合、
      // 再認証を促すアラートを表示
      if (document.visibilityState === 'visible') {
        // ログアウトが検出されてタブがアクティブな場合のみアラート表示
        setTimeout(() => {
          alert("ログイン状態が変更されました。ページを更新して再ログインしてください。");
        }, 500);
      }
    }
  });
  
  return unsubscribe;
};

/**
 * トークン更新タイマーのID
 */
let tokenRefreshTimerId = null;

/**
 * トークン自動更新タイマーを開始
 * @param user 現在のユーザー
 */
const startTokenRefreshTimer = (user) => {
  // 既存のタイマーがあれば解除
  if (tokenRefreshTimerId) {
    clearInterval(tokenRefreshTimerId);
  }
  
  // 50分ごとにトークンを更新（トークンの有効期限は1時間）
  tokenRefreshTimerId = setInterval(async () => {
    try {
      // 現在のユーザーが有効かを確認
      const currentUser = auth.currentUser;
      if (currentUser) {
        // トークンを強制的に更新
        await currentUser.getIdToken(true);
        console.log("認証トークンを更新しました");
      } else {
        // ユーザーがログアウトしている場合はタイマーを停止
        console.log("ユーザーがログアウトしています。トークン更新タイマーを停止します");
        clearInterval(tokenRefreshTimerId);
        tokenRefreshTimerId = null;
      }
    } catch (error) {
      console.error("トークン更新エラー:", error);
    }
  }, 50 * 60 * 1000); // 50分 = 3000000ミリ秒
  
  // ページが閉じられる前にタイマーをクリーンアップ
  window.addEventListener('beforeunload', () => {
    if (tokenRefreshTimerId) {
      clearInterval(tokenRefreshTimerId);
      tokenRefreshTimerId = null;
    }
  });
};

/**
 * 即時のトークン更新を実行
 * エラー発生時に明示的に呼び出すことができる
 */
export const forceTokenRefresh = async () => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await currentUser.getIdToken(true);
      console.log("認証トークンを強制更新しました");
      return true;
    }
    return false;
  } catch (error) {
    console.error("トークン強制更新エラー:", error);
    return false;
  }
};