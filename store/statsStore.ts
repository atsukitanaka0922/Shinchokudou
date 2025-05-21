/**
 * 統計情報管理ストア
 * 
 * ポモドーロセッション等の統計情報を管理するZustandストア
 * Firestoreとの連携により、統計データの永続化を提供
 */

import { create } from "zustand";
import { db } from "@/lib/firebase";
import { collection, doc, addDoc, getDocs, query, where, updateDoc } from "firebase/firestore";
import { useAuthStore } from "@/store/auth";

/**
 * ポモドーロ統計データの型定義
 */
type PomodoroStats = {
  id?: string;              // Firestoreドキュメントのid（オプショナル）
  userId: string;           // ユーザーID
  completedSessions: number; // 完了したポモドーロセッション数
  date: string;             // 日付（YYYY-MM-DD形式）
};

/**
 * 統計ストアの状態とアクション定義
 */
interface StatsState {
  stats: PomodoroStats | null;  // 現在の統計データ
  loading: boolean;             // データ読み込み中フラグ
  loadStats: () => void;        // 統計データをロードする関数
  incrementPomodoro: () => void; // ポモドーロカウントを増加させる関数
}

/**
 * 統計管理Zustandストア
 */
export const useStatsStore = create<StatsState>((set, get) => ({
  stats: null,
  loading: true,

  /**
   * 現在のユーザーの今日の統計データをFirestoreから読み込む
   */
  loadStats: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      console.log("ユーザーがログインしていないため、統計データを取得できません");
      set({ stats: null, loading: false });
      return;
    }

    const today = new Date().toISOString().split("T")[0]; // 今日の日付（YYYY-MM-DD）
    const q = query(collection(db, "stats"), where("userId", "==", user.uid), where("date", "==", today));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // 既存の統計データが見つかった場合
      const docData = snapshot.docs[0].data() as PomodoroStats;
      set({ stats: { ...docData, id: snapshot.docs[0].id }, loading: false });
      console.log("Firestoreからポモドーロ統計を取得:", docData);
    } else {
      // 今日の統計データがまだない場合
      set({ stats: null, loading: false });
      console.log("Firestoreに今日の統計データがありません");
    }
  },

  /**
   * ポモドーロセッションのカウントを増加させる
   * 今日の統計データがなければ新規作成し、あれば更新する
   */
  incrementPomodoro: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    const stats = get().stats;

    if (stats && stats.id) {
      // 既存の統計データを更新
      const statsRef = doc(db, "stats", stats.id);
      await updateDoc(statsRef, { completedSessions: stats.completedSessions + 1 });

      set({ stats: { ...stats, completedSessions: stats.completedSessions + 1 } });
      console.log("ポモドーロ回数を更新:", stats.completedSessions + 1);
    } else {
      // 新しい統計データを作成
      const newStat: PomodoroStats = {
        userId: user.uid,
        completedSessions: 1, // 初回なので1から開始
        date: today,
      };
      const docRef = await addDoc(collection(db, "stats"), newStat);
      set({ stats: { ...newStat, id: docRef.id }, loading: false });
      console.log("Firestoreに新しい統計データを作成:", newStat);
    }
  },
}));
