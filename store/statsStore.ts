import { create } from "zustand";
import { db } from "@/lib/firebase";
import { collection, doc, addDoc, deleteDoc, updateDoc, query, onSnapshot, where } from "firebase/firestore";

type PomodoroStats = {
  id: string;
  completedSessions: number;
  date: string;
};

type StatsState = {
  stats: PomodoroStats | null;
  loadStats: () => void;
  incrementPomodoro: () => void;
};

export const useStatsStore = create<StatsState>((set, get) => ({
  stats: null,

  // Firestore から今日のポモドーロ統計をロード
  loadStats: async () => {
    const today = new Date().toISOString().split("T")[0]; 
    const q = query(collection(db, "pomodoroStats"), where("date", "==", today));

    onSnapshot(q, async (querySnapshot) => {
      if (querySnapshot.empty) {
        try {
          const newStatRef = await addDoc(collection(db, "pomodoroStats"), {
            completedSessions: 0,
            date: today,
          });
          set({ stats: { id: newStatRef.id, completedSessions: 0, date: today } });
        } catch (error) {
          console.error("Firestore データ作成エラー:", error);
        }
      } else {
        const docSnap = querySnapshot.docs[0];
        if (!docSnap.exists()) {
          console.error("Firestore のデータが存在しません");
          return;
        }
        const stat = docSnap.data() as PomodoroStats;
        set({ stats: { ...stat, id: docSnap.id } });
      }
    });

    // 🔥 1日以上前のデータを削除
    const oldStatsQuery = query(collection(db, "pomodoroStats"));
    onSnapshot(oldStatsQuery, (snapshot) => {
      snapshot.docs.forEach(async (doc) => {
        const data = doc.data() as PomodoroStats;
        if (data.date !== today) {
          await deleteDoc(doc.ref);
        }
      });
    });
  },

  // ポモドーロ完了回数を増やす
  incrementPomodoro: async () => {
    const stats = get().stats;
    if (!stats) {
      console.error("🔥 `stats` が `null` です！Firestore に書き込めません！");
      return;
    }

    console.log("✅ ポモドーロ完了！Firestore を更新します:", stats);

    try {
      await updateDoc(doc(db, "pomodoroStats", stats.id), {
        completedSessions: stats.completedSessions + 1,
      });

      set({ stats: { ...stats, completedSessions: stats.completedSessions + 1 } });

      console.log("🎉 Firestore の `completedSessions` を更新しました！");
    } catch (error) {
      console.error("🔥 Firestore 更新エラー:", error);
    }
  },
}));