import { create } from "zustand";
import { db } from "@/lib/firebase";
import { collection, doc, addDoc, updateDoc, query, onSnapshot, where, getDocs } from "firebase/firestore";
import { useAuthStore } from "@/store/auth";

type PomodoroStats = {
  completedSessions: number;
  userId: string;
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
      console.log("🚨 ユーザーがログインしていません");
      return;
    }

    console.log(`🔍 Firestore からデータを取得: userId = ${user.uid}`);

    const today = new Date().toISOString().split("T")[0];
    const q = query(collection(db, "stats"), where("userId", "==", user.uid), where("date", "==", today));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docData = snapshot.docs[0].data() as PomodoroStats;
      console.log("✅ Firestore から取得成功:", docData);
      set({ stats: docData, loading: false });
    } else {
      console.log("🆕 Firestore にデータがなかったため、新規作成");
      const newStat = { userId: user.uid, completedSessions: 0, date: today };
      const docRef = await addDoc(collection(db, "stats"), newStat);
      set({ stats: { ...newStat, id: docRef.id }, loading: false });
    }
  },

  incrementPomodoro: async () => {
    const { stats } = get();
    if (!stats) {
      console.log("🚨 stats が null のため、カウントを増やせません");
      return;
    }

    const user = useAuthStore.getState().user;
    if (!user) {
      console.log("🚨 ユーザーが未ログインのため、更新できません");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const q = query(collection(db, "stats"), where("userId", "==", user.uid), where("date", "==", today));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      const newCount = stats.completedSessions + 1;
      await updateDoc(docRef, { completedSessions: newCount });
      set({ stats: { ...stats, completedSessions: newCount } });
      console.log(`✅ ポモドーロ完了回数を更新: ${newCount}`);
    } else {
      console.log("🚨 Firestore にデータが見つからず、カウントを増やせません");
    }
  }
})); // 🔥 ✅ `}))` で正しく閉じる
