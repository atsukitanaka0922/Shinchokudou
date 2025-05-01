/**
 * Firestoreエラーハンドラー
 * 
 * Firestoreの操作に関連するエラーを適切に処理し、
 * ユーザーに分かりやすいフィードバックを提供するためのユーティリティ
 */

import { FirebaseError } from "firebase/app";
import { useFeedbackStore } from "@/store/feedbackStore";
import { auth } from "@/lib/firebase";
// 循環参照を避けるため、直接refreshAuthをインポートしない

/**
 * Firestoreエラーコードに対応するユーザーフレンドリーなメッセージ
 */
const ERROR_MESSAGES = {
  // 認証関連
  "permission-denied": "データへのアクセス権限がありません。ログイン状態を確認してください。",
  "unauthenticated": "認証が必要です。再度ログインしてください。",
  
  // ネットワーク関連
  "unavailable": "サーバーに接続できません。インターネット接続を確認してください。",
  "network-request-failed": "ネットワークエラーが発生しました。インターネット接続を確認してください。",
  
  // データ関連
  "not-found": "指定されたデータが見つかりませんでした。",
  "already-exists": "このデータはすでに存在します。",
  
  // その他
  "cancelled": "操作がキャンセルされました。",
  "data-loss": "データの読み取り中にエラーが発生しました。",
  "deadline-exceeded": "サーバーからの応答がタイムアウトしました。後でもう一度お試しください。",
  "failed-precondition": "操作の前提条件が満たされていません。",
  "internal": "内部エラーが発生しました。",
  "invalid-argument": "無効な引数です。",
  "out-of-range": "値が範囲外です。",
  "resource-exhausted": "リソースが不足しています。後でもう一度お試しください。",
  "unimplemented": "この機能はまだ実装されていません。",
  "unknown": "不明なエラーが発生しました。",
};

/**
 * 認証トークンをリフレッシュする内部関数
 * 循環参照を避けるため、authStateCheckに依存せずに実装
 */
const refreshAuthToken = async () => {
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
 * Firestoreエラーを処理し、適切なメッセージを表示する
 * 
 * @param error 発生したエラー
 * @param customMessage カスタムエラーメッセージ（オプション）
 * @param showFeedback フィードバックを表示するかどうか（デフォルト: true）
 * @returns 処理されたエラー情報
 */
export const handleFirestoreError = (error: unknown, customMessage?: string, showFeedback = true): {
  message: string;
  code?: string;
  originalError: unknown;
} => {
  // Firebase固有のエラーかどうかを確認
  const isFirebaseError = error instanceof FirebaseError;
  const errorCode = isFirebaseError ? error.code.replace('firebase/', '').replace('firestore/', '') : 'unknown';
  
  // エラーをコンソールに出力
  console.error('Firestoreエラー:', error);
  
  // エラーメッセージの決定
  let message = customMessage || ERROR_MESSAGES[errorCode] || '操作中にエラーが発生しました。';
  
  // 権限エラーの場合は追加の診断情報を出力
  if (errorCode === 'permission-denied') {
    console.log('権限エラー診断情報:');
    console.log('- 現在のユーザー:', auth.currentUser?.uid);
    console.log('- ログイン状態:', !!auth.currentUser);
    
    // 認証を自動リフレッシュを試みる
    refreshAuthToken().then(user => {
      if (user) {
        console.log('認証をリフレッシュしました。再試行してください。');
      }
    });
  }
  
  // フィードバックを表示
  if (showFeedback) {
    const feedbackStore = useFeedbackStore.getState();
    feedbackStore.setMessage(message);
  }
  
  // 処理済みのエラー情報を返す
  return {
    message,
    code: isFirebaseError ? errorCode : undefined,
    originalError: error
  };
};

/**
 * Firestoreの操作を安全に実行し、エラーハンドリングを行う
 * 
 * @param operation 実行する操作（Promise）
 * @param errorMessage エラー時のカスタムメッセージ
 * @param successMessage 成功時のメッセージ（オプション）
 * @returns 操作の結果
 */
export const safeFirestoreOperation = async <T>(
  operation: () => Promise<T>,
  errorMessage: string,
  successMessage?: string
): Promise<T | null> => {
  try {
    // 操作を実行
    const result = await operation();
    
    // 成功メッセージがある場合は表示
    if (successMessage) {
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(successMessage);
    }
    
    return result;
  } catch (error) {
    // エラー処理
    handleFirestoreError(error, errorMessage);
    return null;
  }
};