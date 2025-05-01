/**
 * 認証状態の確認と診断ユーティリティ
 * 
 * Firebase認証関連の問題をデバッグするためのヘルパー関数
 */

import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, getIdToken } from "firebase/auth";
// firestoreErrorHandlerへの依存を削除

/**
 * 現在の認証状態を確認してログに出力する
 * エラー時のデバッグに役立つ
 */
export const checkAuthState = () => {
  const currentUser = auth.currentUser;
  
  console.log("=== 認証状態診断 ===");
  console.log("認証済みユーザー:", currentUser ? "あり" : "なし");
  
  if (currentUser) {
    console.log("ユーザーID:", currentUser.uid);
    console.log("表示名:", currentUser.displayName);
    console.log("メールアドレス:", currentUser.email);
    console.log("メール検証済み:", currentUser.emailVerified);
    console.log("最終ログイン時間:", new Date(currentUser.metadata.lastSignInTime || Date.now()).toLocaleString());
    
    // トークンの有効期限を確認
    currentUser.getIdTokenResult()
      .then((idTokenResult) => {
        console.log("トークン発行時間:", new Date(idTokenResult.issuedAtTime).toLocaleString());
        console.log("トークン有効期限:", new Date(idTokenResult.expirationTime).toLocaleString());
        const now = new Date();
        const expTime = new Date(idTokenResult.expirationTime);
        console.log("トークン有効期限まで:", Math.round((expTime.getTime() - now.getTime()) / 1000 / 60), "分");
      })
      .catch(error => {
        console.error("トークン取得エラー:", error);
      });
  }
  
  return currentUser;
};

/**
 * 認証リスナーを設定する
 * 認証状態の変化を監視し、問題が発生した場合に対応する
 */
export const setupAuthListener = (callback) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("認証状態変更: ログイン済み", user.uid);
    } else {
      console.log("認証状態変更: 未ログイン");
    }
    
    if (callback && typeof callback === 'function') {
      callback(user);
    }
  });
  
  return unsubscribe;
};

/**
 * 認証をリフレッシュする
 * トークンの再取得を強制し、認証の問題を解決する場合がある
 */
export const refreshAuth = async () => {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.log("認証リフレッシュ: ユーザーがログインしていません");
    return null;
  }
  
  try {
    // 強制的にトークンをリフレッシュ
    await currentUser.getIdToken(true);
    console.log("認証リフレッシュ: トークンを更新しました");
    return currentUser;
  } catch (error) {
    console.error("認証リフレッシュエラー:", error);
    return null;
  }
};

/**
 * 認証エラーをフィードバックに表示する
 * firestoreErrorHandlerに依存せずに実装
 */
export const showAuthError = (message: string) => {
  console.error("認証エラー:", message);
  // 必要に応じてフィードバックストアを直接使用する実装に変更可能
};

/**
 * 再認証を試みる
 * ログアウト後に自動的に再ログインさせる必要がある場合に使用
 */
export const reauthenticate = async () => {
  // 現在のユーザー情報を保存
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.log("再認証: ユーザーがログインしていません");
    return false;
  }
  
  try {
    // 一旦ログアウト
    await signOut(auth);
    console.log("再認証: 一時的にログアウトしました");
    
    // ここで再ログインのUIを表示する必要がある
    console.log("再認証: ユーザーの再ログインが必要です");
    
    return true;
  } catch (error) {
    console.error("再認証エラー:", error);
    return false;
  }
};