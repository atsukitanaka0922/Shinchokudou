/**
 * ポイント管理ストア
 * 
 * タスク完了時のポイント管理を行うZustandストア
 * ユーザーごとのポイント累積と、履歴の管理を提供
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { db, auth } from "@/lib/firebase";
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
  getDoc
} from "firebase/firestore";
import { useAuthStore } from "@/store/auth";
import { useFeedbackStore } from "@/store/feedbackStore";
import { PriorityLevel } from "@/lib/aiPriorityAssignment";
import { handleFirestoreError, safeFirestoreOperation } from "@/lib/firestoreErrorHandler";
import { checkAuthState } from "@/lib/authStateCheck";

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
 * v1.5.0: より単純な固定値に変更
 */
const BASE_POINTS = {
  high: 30,    // 高優先度: 30ポイント
  medium: 20,  // 中優先度: 20ポイント
  low: 10      // 低優先度: 10ポイント
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
        // 現在のユーザーと認証状態を確認
        const currentUser = checkAuthState();
        if (!currentUser) {
          console.log("ポイントロード: ユーザーがログインしていません");
          set({ totalPoints: 0, history: [], loading: false });
          return;
        }

        set({ loading: true });

        try {
          console.log("ポイント履歴のロード開始:", currentUser.uid);
          
          // ユーザーのポイント履歴を取得するクエリ
          const historyQuery = query(
            collection(db, "pointHistory"),
            where("userId", "==", currentUser.uid),
            orderBy("timestamp", "desc"),
            limit(50) // 最新50件のみ取得
          );
          
          const historySnapshot = await getDocs(historyQuery);
          
          if (historySnapshot.empty) {
            console.log("ポイント履歴が存在しません");
            set({ totalPoints: 0, history: [], loading: false });
            return;
          }
          
          // ログと履歴データの変換
          console.log(`取得したポイント履歴: ${historySnapshot.docs.length}件`);
          
          const history = historySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as PointHistory[];
          
          // 合計ポイントを計算
          const total = history.reduce((sum, item) => sum + item.points, 0);
          
          console.log(`合計ポイント: ${total}ポイント, 履歴: ${history.length}件`);
          
          set({ 
            totalPoints: total,
            history,
            loading: false
          });
        } catch (error) {
          // エラー処理を強化
          handleFirestoreError(error, "ポイントデータの読み込みに失敗しました");
          console.error('ポイントデータ読み込みエラー詳細:', error);
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
        // 現在のユーザーと認証状態を確認
        const currentUser = checkAuthState();
        if (!currentUser) {
          console.error("ポイント追加: ユーザーがログインしていません");
          return;
        }
        
        // 負の値は処理しない
        if (points <= 0) {
          console.error("ポイント追加: 無効なポイント値（0以下）");
          return;
        }

        try {
          console.log(`ポイント追加開始: ${points}ポイント, 説明: ${description}`);
          
          // 新しいポイント履歴を作成
          const newHistory: PointHistory = {
            userId: currentUser.uid,
            points: points,
            description,
            timestamp: Date.now(),
            isHidden
          };
          
          // Firestoreに保存
          const docRef = await addDoc(collection(db, "pointHistory"), newHistory);
          console.log(`ポイント履歴保存完了: ドキュメントID ${docRef.id}`);
          
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
          
          console.log(`ポイント追加完了: 合計 ${get().totalPoints}ポイント`);
        } catch (error) {
          // エラー処理を強化
          handleFirestoreError(error, "ポイントの追加に失敗しました");
          console.error('ポイント追加エラー詳細:', error);
        }
      },

      /**
       * ポイントを使用（消費）
       * @param points 使用するポイント量
       * @param description 使用目的の説明
       * @returns 使用が成功したかどうか
       */
      usePoints: async (points, description) => {
        // 現在のユーザーと認証状態を確認
        const currentUser = checkAuthState();
        if (!currentUser) {
          console.error("ポイント使用: ユーザーがログインしていません");
          return false;
        }
        
        // 負の値は処理しない
        if (points <= 0) {
          console.error("ポイント使用: 無効なポイント値（0以下）");
          return false;
        }
        
        // 残高が足りるか確認
        const { totalPoints } = get();
        if (totalPoints < points) {
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage(`ポイントが足りません（必要: ${points}、現在: ${totalPoints}）`);
          return false;
        }

        try {
          console.log(`ポイント使用開始: ${points}ポイント, 説明: ${description}`);
          
          // 新しいポイント履歴を作成（負の値で記録）
          const newHistory: PointHistory = {
            userId: currentUser.uid,
            points: -points, // 消費したので負の値
            description,
            timestamp: Date.now()
          };
          
          // Firestoreに保存
          const docRef = await addDoc(collection(db, "pointHistory"), newHistory);
          console.log(`ポイント使用履歴保存完了: ドキュメントID ${docRef.id}`);
          
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
          
          console.log(`ポイント使用完了: 残り ${get().totalPoints}ポイント`);
          return true;
        } catch (error) {
          // エラー処理を強化
          handleFirestoreError(error, "ポイントの使用に失敗しました");
          console.error('ポイント使用エラー詳細:', error);
          return false;
        }
      },

      /**
       * ポイントをリセット（デバッグ・テスト用）
       */
      resetPoints: async () => {
        // 現在のユーザーと認証状態を確認
        const currentUser = checkAuthState();
        if (!currentUser) {
          console.error("ポイントリセット: ユーザーがログインしていません");
          return;
        }

        try {
          console.log("ポイントリセット開始");
          
          // 新しいポイント履歴を作成（リセット記録）
          const resetHistory: PointHistory = {
            userId: currentUser.uid,
            points: -get().totalPoints, // 現在の合計を負の値で相殺
            description: "ポイントリセット",
            timestamp: Date.now()
          };
          
          // Firestoreに保存
          const docRef = await addDoc(collection(db, "pointHistory"), resetHistory);
          console.log(`ポイントリセット履歴保存完了: ドキュメントID ${docRef.id}`);
          
          // ローカルの状態をリセット
          set({ totalPoints: 0, history: [] });
          
          // 最新の履歴を再読み込み
          await get().loadPoints();
          
          // フィードバック表示
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage('ポイントをリセットしました');
          
          console.log("ポイントリセット完了");
        } catch (error) {
          // エラー処理を強化
          handleFirestoreError(error, "ポイントのリセットに失敗しました");
          console.error('ポイントリセットエラー詳細:', error);
        }
      },

      /**
       * タスクの優先度からポイントを計算
       * v1.5.0: 単純な固定値に変更
       * @param priority 優先度
       * @returns 計算されたポイント値
       */
      calculateTaskPoints: (priority) => {
        return BASE_POINTS[priority];
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
      console.log("ユーザーログイン検出: ポイントデータを読み込みます");
      usePointsStore.getState().loadPoints();
    } else {
      console.log("ユーザーログアウト検出: ポイントデータをクリア");
      // ユーザーがログアウトした場合はポイントをクリア
      usePointsStore.setState({ totalPoints: 0, history: [] });
    }
  }
);