/**
 * 習慣管理ストア
 * 
 * 習慣の作成、更新、完了管理、統計計算を提供するZustandストア
 * v1.6.1: 習慣タスク機能の実装
 */

import { create } from "zustand";
import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { useAuthStore } from "@/store/auth";
import { useFeedbackStore } from "@/store/feedbackStore";
import { usePointStore } from "@/store/pointStore";
import { 
  Habit, 
  CreateHabitData, 
  UpdateHabitData, 
  HabitStats, 
  HabitCompletion,
  HabitUtils 
} from "@/lib/habitInterfaces";

/**
 * 習慣ストアの状態とアクション定義
 */
interface HabitState {
  habits: Habit[];
  loading: boolean;
  unsubscribe: (() => void) | null;
  
  // データ管理
  loadHabits: () => void;
  addHabit: (habitData: CreateHabitData) => Promise<string>;
  updateHabit: (habitId: string, updates: UpdateHabitData) => Promise<void>;
  removeHabit: (habitId: string) => Promise<void>;
  
  // 完了管理
  toggleHabitCompletion: (habitId: string, date?: string) => Promise<void>;
  markHabitComplete: (habitId: string, date?: string) => Promise<void>;
  markHabitIncomplete: (habitId: string, date?: string) => Promise<void>;
  
  // フィルタリング・取得
  getTodayHabits: () => Habit[];
  getOverdueHabits: () => Habit[];
  getActiveHabits: () => Habit[];
  getHabitById: (habitId: string) => Habit | undefined;
  
  // 統計
  getHabitStats: () => HabitStats;
  calculateStreak: (habitId: string) => number;
  
  // ユーティリティ
  clearHabits: () => void;
}

/**
 * 習慣完了時のポイント
 */
const HABIT_COMPLETION_POINTS = 8;

/**
 * 習慣管理Zustandストア
 */
export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  loading: true,
  unsubscribe: null,

  /**
   * ユーザーの習慣をFirestoreからリアルタイムで監視・読み込み
   */
  loadHabits: () => {
    const user = useAuthStore.getState().user;
    
    // 前回のリスナーがあれば解除
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
    }
    
    if (!user) {
      console.log("ユーザーがログインしていないため、習慣を取得できません");
      set({ habits: [], loading: false, unsubscribe: null });
      return;
    }
    
    set({ loading: true });
    
    try {
      console.log(`Firestoreからユーザー ${user.uid} の習慣を監視開始`);
      const q = query(collection(db, "habits"), where("userId", "==", user.uid));
      
      // リアルタイムリスナーを設定
      const unsubscribeListener = onSnapshot(q, 
        (snapshot) => {
          const habits = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          })) as Habit[];
          
          console.log("Firestoreから習慣取得成功:", habits.length, "件");
          set({ habits, loading: false });
        },
        (error) => {
          console.error("Firestoreの習慣監視エラー:", error);
          set({ loading: false });
          
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage("習慣の読み込みに失敗しました");
        }
      );
      
      set({ unsubscribe: unsubscribeListener });
      
    } catch (error) {
      console.error("習慣監視の設定に失敗:", error);
      set({ loading: false });
    }
  },

  /**
   * 新しい習慣を追加
   */
  addHabit: async (habitData) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error("ユーザーがログインしていません");

    const newHabit: Omit<Habit, 'id'> = {
      ...habitData,
      userId: user.uid,
      createdAt: Date.now(),
      completionHistory: []
    };

    try {
      const docRef = await addDoc(collection(db, "habits"), newHabit);
      
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(`習慣「${habitData.title}」を追加しました`);
      
      return docRef.id;
    } catch (error) {
      console.error("習慣追加エラー:", error);
      
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage("習慣の追加に失敗しました");
      throw error;
    }
  },

  /**
   * 習慣を更新
   */
  updateHabit: async (habitId, updates) => {
    try {
      const updateData = {
        ...updates,
        updatedAt: Date.now()
      };
      
      await updateDoc(doc(db, "habits", habitId), updateData);
      
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage("習慣を更新しました");
    } catch (error) {
      console.error("習慣更新エラー:", error);
      
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage("習慣の更新に失敗しました");
    }
  },

  /**
   * 習慣を削除
   */
  removeHabit: async (habitId) => {
    const habit = get().habits.find(h => h.id === habitId);
    if (!habit) return;
    
    try {
      await deleteDoc(doc(db, "habits", habitId));
      
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(`習慣「${habit.title}」を削除しました`);
    } catch (error) {
      console.error("習慣削除エラー:", error);
      
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage("習慣の削除に失敗しました");
    }
  },

  /**
   * 習慣の完了状態を切り替え
   */
  toggleHabitCompletion: async (habitId, date) => {
    const habit = get().habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const targetDate = date || new Date().toISOString().split('T')[0];
    const existingCompletion = habit.completionHistory.find(
      completion => completion.date === targetDate
    );
    
    if (existingCompletion?.completed) {
      await get().markHabitIncomplete(habitId, targetDate);
    } else {
      await get().markHabitComplete(habitId, targetDate);
    }
  },

  /**
   * 習慣を完了としてマーク
   */
  markHabitComplete: async (habitId, date) => {
    const habit = get().habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const targetDate = date || new Date().toISOString().split('T')[0];
    const completionRecord: HabitCompletion = {
      date: targetDate,
      completed: true,
      completedAt: Date.now()
    };
    
    try {
      // 既存の同日の記録を削除してから新しい記録を追加
      const updatedHistory = habit.completionHistory.filter(
        completion => completion.date !== targetDate
      );
      updatedHistory.push(completionRecord);
      
      await updateDoc(doc(db, "habits", habitId), {
        completionHistory: updatedHistory
      });
      
      // ポイントを付与
      const pointStore = usePointStore.getState();
      await pointStore.addPoints(
        'task_completion',
        HABIT_COMPLETION_POINTS,
        `習慣完了: ${habit.title}`,
        habitId
      );
      
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(`🎉 習慣「${habit.title}」完了！ +${HABIT_COMPLETION_POINTS}ポイント`);
      
    } catch (error) {
      console.error("習慣完了エラー:", error);
      
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage("習慣の完了記録に失敗しました");
    }
  },

  /**
   * 習慣を未完了としてマーク
   */
  markHabitIncomplete: async (habitId, date) => {
    const habit = get().habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    try {
      // 該当日の完了記録を削除
      const updatedHistory = habit.completionHistory.filter(
        completion => completion.date !== targetDate
      );
      
      await updateDoc(doc(db, "habits", habitId), {
        completionHistory: updatedHistory
      });
      
      // ポイントを減算
      const pointStore = usePointStore.getState();
      await pointStore.removePoints(
        'task_completion',
        HABIT_COMPLETION_POINTS,
        `習慣完了取り消し: ${habit.title}`,
        habitId,
        true // 総獲得ポイントからも減算
      );
      
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(`📤 習慣完了を取り消しました。${HABIT_COMPLETION_POINTS}ポイント減算`);
      
    } catch (error) {
      console.error("習慣完了取り消しエラー:", error);
      
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage("習慣の完了取り消しに失敗しました");
    }
  },

  /**
   * 今日実行すべき習慣を取得
   */
  getTodayHabits: () => {
    const today = new Date();
    return get().habits.filter(habit => 
      HabitUtils.shouldExecuteToday(habit, today)
    );
  },

  /**
   * 期限切れの習慣を取得（リマインダー時間を過ぎた未完了習慣）
   */
  getOverdueHabits: () => {
    const now = new Date();
    return get().habits.filter(habit => 
      HabitUtils.isOverdue(habit, now)
    );
  },

  /**
   * アクティブな習慣を取得
   */
  getActiveHabits: () => {
    return get().habits.filter(habit => habit.isActive);
  },

  /**
   * IDで習慣を取得
   */
  getHabitById: (habitId) => {
    return get().habits.find(habit => habit.id === habitId);
  },

  /**
   * 習慣統計を計算
   */
  getHabitStats: () => {
    const habits = get().habits;
    const todayHabits = get().getTodayHabits();
    const activeHabits = get().getActiveHabits();
    
    const completedToday = todayHabits.filter(habit => 
      HabitUtils.isCompletedToday(habit)
    ).length;
    
    // 平均完了率を計算
    let totalCompletionRate = 0;
    let habitsWithHistory = 0;
    
    habits.forEach(habit => {
      if (habit.completionHistory.length > 0) {
        const rate = HabitUtils.calculateCompletionRate(habit);
        totalCompletionRate += rate;
        habitsWithHistory++;
      }
    });
    
    const averageCompletionRate = habitsWithHistory > 0 
      ? Math.round(totalCompletionRate / habitsWithHistory) 
      : 0;
    
    // 最長ストリークを計算
    const longestStreak = Math.max(
      0,
      ...habits.map(habit => HabitUtils.calculateCurrentStreak(habit))
    );
    
    // 現在のストリークを計算
    const currentStreaks: { [habitId: string]: number } = {};
    habits.forEach(habit => {
      currentStreaks[habit.id] = HabitUtils.calculateCurrentStreak(habit);
    });
    
    return {
      totalHabits: habits.length,
      activeHabits: activeHabits.length,
      completedToday,
      averageCompletionRate,
      longestStreak,
      currentStreaks
    };
  },

  /**
   * 指定した習慣のストリークを計算
   */
  calculateStreak: (habitId) => {
    const habit = get().getHabitById(habitId);
    if (!habit) return 0;
    
    return HabitUtils.calculateCurrentStreak(habit);
  },

  /**
   * 習慣リストをクリア
   */
  clearHabits: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
    }
    
    set({ habits: [], unsubscribe: null });
  }
}));