/**
 * ポイント管理ストア
 * 
 * タスク完了時のポイント管理を行うZustandストア
 * ユーザーごとのポイント累積と、履歴の管理を提供
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp 
} from "firebase/firestore";
import { useAuthStore } from "@/store/auth";
import { useFeedbackStore } from "@/store/feedbackStore";
import { PriorityLevel } from "@/lib/aiPriorityAssignment";

/**
 * ポイント履歴のインターフェース定義
 */
export type PointHistory = {
  id?: string;          // 履歴ID
  userId: string;       // ユーザーID
  points: number;       // 獲得/消費したポイント
  description: string;  // 説明（どこで獲得/消費したか）
  timestamp: number;    // 獲得/消費した日時のタイムスタンプ
  isHidden?: boolean;   // ポイント数を表示するかどうか（サプライズボーナス用）
};

/**
 * ポイント状態の型定義
 */
interface PointsState {
  totalPoints: number;      // 合計ポイント
  history: PointHistory[];  // ポイント履歴
  loading: boolean;         // 読み込み中フラグ
  
  // アクション
  loadPoints: () => Promise<void>;     // ポイントをロード
  addPoints: (points: number, description?: string, isHidden?: boolean) => Promise<void>;  // ポイントを追加
  usePoints: (points: number, description: string) => Promise<boolean>;  // ポイントを使用
  resetPoints: () => Promise<void>;    // ポイントをリセット
  
  // ポイント計算ヘルパー（内部利用）
  calculateTaskPoints: (priority: PriorityLevel) => number; // 優先度からポイントを計算
}

/**
 * ポイント基本値（非公開）
 * 優先度に応じた基本ポイント + ランダム要素
 */
const BASE_POINTS = {
  high: { min: 25, max: 35 },
  medium: { min: 15, max: 25 },
  low: { min: 8, max: 15 }
};

/**
 * ポイント管理Zustandストア
 * persist ミドルウェアでローカルストレージにもバックアップ保存
 */
export const usePointsStore = create<PointsState>()(
  persist(
    (set, get) => ({
      totalPoints: 0,
      history: [],
      loading: false,

      /**
       * ポイントデータをFirestoreから読み込む
       */
      loadPoints: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ loading: true });

        try {
          // ユーザーのポイント履歴を取得
          const historyQuery = query(
            collection(db, "pointHistory"),
            where("userId", "==", user.uid),
            orderBy("timestamp", "desc"),
            limit(50) // 最新50件のみ取得
          );
          
          const historySnapshot = await getDocs(historyQuery);
          const history = historySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as PointHistory[];
          
          // 合計ポイントを計算
          const total = history.reduce((sum, item) => sum + item.points, 0);
          
          set({ 
            totalPoints: total,
            history,
            loading: false
          });
        } catch (error) {
          console.error('ポイントデータ読み込みエラー:', error);
          set({ loading: false });
        }
      },

      /**
       * ポイントを追加
       * @param points 追加するポイント量
       * @param description 説明（省略時は「タスク完了」）
       * @param isHidden ポイント数を表示するかどうか（デフォルトは表示する）
       */
      addPoints: async (points, description = "タスク完了", isHidden = false) => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        
        // 負の値は処理しない
        if (points <= 0) return;

        try {
          // 新しいポイント履歴を作成
          const newHistory: PointHistory = {
            userId: user.uid,
            points: points,
            description,
            timestamp: Date.now(),
            isHidden
          };
          
          // Firestoreに保存
          const docRef = await addDoc(collection(db, "pointHistory"), newHistory);
          
          // ローカルの状態を更新
          set(state => ({
            totalPoints: state.totalPoints + points,
            history: [
              { ...newHistory, id: docRef.id },
              ...state.history
            ]
          }));
          
          // フィードバック表示
          const feedbackStore = useFeedbackStore.getState();
          if (isHidden) {
            feedbackStore.setMessage(`ボーナスポイントを獲得しました！（${description}）`);
          } else {
            feedbackStore.setMessage(`+${points} ポイントを獲得しました！（${description}）`);
          }
        } catch (error) {
          console.error('ポイント追加エラー:', error);
          
          // エラーをフィードバックで表示
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage('ポイントの追加に失敗しました');
        }
      },

      /**
       * ポイントを使用（消費）
       * @param points 使用するポイント量
       * @param description 使用目的の説明
       * @returns 使用が成功したかどうか
       */
      usePoints: async (points, description) => {
        const user = useAuthStore.getState().user;
        if (!user) return false;
        
        // 負の値は処理しない
        if (points <= 0) return false;
        
        // 残高が足りるか確認
        const { totalPoints } = get();
        if (totalPoints < points) {
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage(`ポイントが足りません（必要: ${points}、現在: ${totalPoints}）`);
          return false;
        }

        try {
          // 新しいポイント履歴を作成（負の値で記録）
          const newHistory: PointHistory = {
            userId: user.uid,
            points: -points, // 消費したので負の値
            description,
            timestamp: Date.now()
          };
          
          // Firestoreに保存
          const docRef = await addDoc(collection(db, "pointHistory"), newHistory);
          
          // ローカルの状態を更新
          set(state => ({
            totalPoints: state.totalPoints - points,
            history: [
              { ...newHistory, id: docRef.id },
              ...state.history
            ]
          }));
          
          // フィードバック表示
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage(`${points}ポイントを使用しました（${description}）`);
          
          return true;
        } catch (error) {
          console.error('ポイント使用エラー:', error);
          
          // エラーをフィードバックで表示
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage('ポイントの使用に失敗しました');
          
          return false;
        }
      },

      /**
       * ポイントをリセット（デバッグ・テスト用）
       */
      resetPoints: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        try {
          // 新しいポイント履歴を作成（リセット記録）
          const resetHistory: PointHistory = {
            userId: user.uid,
            points: -get().totalPoints, // 現在の合計を負の値で相殺
            description: "ポイントリセット",
            timestamp: Date.now()
          };
          
          // Firestoreに保存
          await addDoc(collection(db, "pointHistory"), resetHistory);
          
          // ローカルの状態をリセット
          set({ totalPoints: 0, history: [] });
          
          // 最新の履歴を再読み込み
          await get().loadPoints();
          
          // フィードバック表示
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage('ポイントをリセットしました');
        } catch (error) {
          console.error('ポイントリセットエラー:', error);
          
          // エラーをフィードバックで表示
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage('ポイントのリセットに失敗しました');
        }
      },

      /**
       * タスクの優先度からポイントを計算（透明化のため内部のみで使用）
       * 基本値 + ランダム要素で計算
       * @param priority 優先度
       * @returns 計算されたポイント値
       */
      calculateTaskPoints: (priority) => {
        const range = BASE_POINTS[priority];
        return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
      }
    }),
    {
      name: "points-storage", // ローカルストレージのキー名
      // ローカルストレージに保存する状態の選択（ロード中フラグは保存しない）
      partialize: (state) => ({ 
        totalPoints: state.totalPoints,
        history: state.history.slice(0, 10) // 最新10件だけローカルに保存
      }),
    }
  )
);

// ユーザーがログインしたときにポイントを自動的に読み込む
useAuthStore.subscribe(
  (state) => state.user,
  (user) => {
    if (user) {
      usePointsStore.getState().loadPoints();
    }
  }
);