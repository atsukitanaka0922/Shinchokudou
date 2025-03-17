/**
 * Firebase設定モジュール
 * 
 * Firebase認証とFirestoreデータベース接続を初期化・設定するモジュール
 * アプリケーション全体でFirebase機能を利用するための基盤を提供します
 */

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebaseの設定
 * 環境変数から読み込む（.env.localファイルに定義）
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Firebase アプリインスタンスの取得または初期化
// すでに初期化されているアプリがあれば再利用し、なければ新しく初期化
let app: FirebaseApp;

// getApps() は初期化済みのFirebaseアプリの配列を返す
if (getApps().length === 0) {
  // 初期化済みのアプリがない場合は新規作成
  app = initializeApp(firebaseConfig);
} else {
  // すでに初期化済みのアプリがある場合は最初のものを使用
  app = getApps()[0];
}

// Firebase Authentication
export const auth = getAuth(app);

// Firestore Database
export const db = getFirestore(app);

export default app;