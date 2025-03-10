import { create } from "zustand";
import { db } from "@/lib/firebase";
import { collection, doc, addDoc, getDocs, query, where, updateDoc } from "firebase/firestore";
import { useAuthStore } from "@/store/auth";

type PomodoroStats = {
  id?: string; // ✅ `id` をオプショナルプロパティとして追加
  userId: string;
  completedSessions: number;
  date: string;
};

interface StatsState {
  stats: PomodoroStats | null;
  loading: boolean;
  loadStats: () => void;
  incrementPomodoro: () => void;
}

export const useStatsStore = create<StatsState>((set, get) => ({
  stats: null,
  loading: true,

  loadStats: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      console.log("🚨 ユーザーがログインしていないため、統計データを取得できません");
      set({ stats: null, loading: false });
      return;
    }

    const today = new Date().toISOString().split("T")[0]; // 今日の日付
    const q = query(collection(db, "stats"), where("userId", "==", user.uid), where("date", "==", today));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docData = snapshot.docs[0].data() as PomodoroStats;
      set({ stats: { ...docData, id: snapshot.docs[0].id }, loading: false }); // ✅ `id` を追加
      console.log("✅ Firestore からポモドーロ統計を取得:", docData);
    } else {
      set({ stats: null, loading: false });
      console.log("📊 Firestore に今日の統計データがありません");
    }
  },

  incrementPomodoro: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    const stats = get().stats;

    if (stats && stats.id) {
      // ✅ 既存データを更新
      const statsRef = doc(db, "stats", stats.id);
      await updateDoc(statsRef, { completedSessions: stats.completedSessions + 1 });

      set({ stats: { ...stats, completedSessions: stats.completedSessions + 1 } });
      console.log("📈 ポモドーロ回数を更新:", stats.completedSessions + 1);
    } else {
      // ✅ Firestore に新しい統計データを作成
      const newStat: PomodoroStats = {
        userId: user.uid,
        completedSessions: 0,
        date: today,
      };
      const docRef = await addDoc(collection(db, "stats"), newStat);
      set({ stats: { ...newStat, id: docRef.id }, loading: false }); // ✅ `id` を追加
      console.log("✅ Firestore に新しい統計データを作成:", newStat);
    }
  },
}));
