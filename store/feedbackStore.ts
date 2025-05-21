/**
 * フィードバック管理ストア
 * 
 * アプリ内で表示する通知やフィードバックメッセージを管理するZustandストア
 * 一時的なメッセージを統一的に扱うためのシンプルなインターフェースを提供
 */

import { create } from "zustand";

/**
 * フィードバック状態の型定義
 */
type FeedbackState = {
  message: string | null;                 // 表示するメッセージ（nullの場合は非表示）
  setMessage: (msg: string | null) => void; // メッセージを設定する関数
};

/**
 * フィードバック管理Zustandストア
 */
export const useFeedbackStore = create<FeedbackState>((set) => ({
  message: null,
  
  /**
   * フィードバックメッセージを設定
   * @param msg 表示するメッセージ、またはnull（非表示）
   */
  setMessage: (msg) => set({ message: msg }),
}));
