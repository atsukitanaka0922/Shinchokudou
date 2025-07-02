/**
 * 習慣管理ストア（エラーハンドリング強化版）
 * 
 * 習慣の作成、更新、完了管理、統計計算を提供するZustandストア
 * Firebase権限エラーの詳細なハンドリングを追加
 * v1.6.0: 習慣タスク機能の実装 + エラーハンドリング強化
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
  error: string | null;
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
  clearError: () => void;
}

/**
 * 習慣完了時のポイント
 */
const HABIT_COMPLETION_POINTS = 8;

/**
 * Firebaseエラーメッセージを日本語に変換
 */
const translateFirebaseError = (error: any): string => {
  const code = error?.code || error?.message || '';
  
  switch (code) {
    case 'permission-denied':
    case 'Missing or insufficient permissions':
      return '権限エラー: 習慣データへのアクセス権限がありません。アプリを再読み込みしてください。';
    case 'not-found':
      return '指定された習慣が見つかりません。';
    case 'already-exists':
      return '同じ名前の習慣が既に存在します。';
    case 'invalid-argument':
      return '入力データが無効です。フォームの内容を確認してください。';
    case 'unauthenticated':
      return 'ログインが必要です。再度ログインしてください。';
    case 'resource-exhausted':
      return 'サーバーが混雑しています。少し時間をおいて再試行してください。';
    case 'unavailable':
      return 'サービスが一時的に利用できません。ネットワーク接続を確認してください。';
    default:
      return `習慣操作エラー: ${error?.message || '不明なエラーが発生しました'}`;
  }
};

/**
 * 習慣管理Zustandストア（強化版）
 */
export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  loading: true,
  error: null,
  unsubscribe: null,

  /**
   * エラーをクリア
   */
  clearError: () => {
    set({ error: null });
  },

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
      set({ habits: [], loading: false, unsubscribe: null, error: null });
      return;
    }
    
    set({ loading: true, error: null });
    
    try {
      console.log(`Firestoreからユーザー ${user.uid} の習慣を監視開始`);
      
      // クエリを作成
      const q = query(
        collection(db, "habits"), 
        where("userId", "==", user.uid)
      );
      
      // リアルタイムリスナーを設定
      const unsubscribeListener = onSnapshot(q, 
        (snapshot) => {
          try {
            const habits = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data()
            })) as Habit[];
            
            console.log("Firestoreから習慣取得成功:", habits.length, "件");
            set({ habits, loading: false, error: null });
          } catch (parseError) {
            console.error("習慣データの解析エラー:", parseError);
            set({ 
              loading: false, 
              error: "習慣データの読み込み中にエラーが発生しました。" 
            });
          }
        },
        (error) => {
          console.error("Firestoreの習慣監視エラー:", error);
          const errorMessage = translateFirebaseError(error);
          set({ loading: false, error: errorMessage });
          
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage(errorMessage);
        }
      );
      
      set({ unsubscribe: unsubscribeListener });
      
    } catch (error) {
      console.error("習慣監視の設定に失敗:", error);
      const errorMessage = translateFirebaseError(error);
      set({ loading: false, error: errorMessage });
      
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(errorMessage);
    }
  },

  /**
   * 新しい習慣を追加
   */
  addHabit: async (habitData) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error("ユーザーがログインしていません");
    }

    // データ検証
    if (!habitData.title || habitData.title.trim().length === 0) {
      throw new Error("習慣名は必須です");
    }

    if (!['daily', 'weekly', 'monthly'].includes(habitData.frequency)) {
      throw new Error("無効な頻度が指定されました");
    }

    const newHabit: Omit<Habit, 'id'> = {
      ...habitData,
      userId: user.uid,
      createdAt: Date.now(),
      completionHistory: [],
      // デフォルト値の設定
      description: habitData.description || '',
      targetDays: habitData.targetDays || [],
      reminderTime: habitData.reminderTime || '20:00',
      isActive: habitData.isActive !== undefined ? habitData.isActive : true
    };

    try {
      console.log("新しい習慣を追加中:", newHabit);
      
      const docRef = await addDoc(collection(db, "habits"), newHabit);
      
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(`🎉 習慣「${habitData.title}」を追加しました`);
      
      console.log("習慣追加成功:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("習慣追加エラー:", error);
      const errorMessage = translateFirebaseError(error);
      
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(errorMessage);
      
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  /**
   * 習慣を更新
   */
  updateHabit: async (habitId, updates) => {
    if (!habitId) {
      throw new Error("習慣IDが指定されていません");
    }

    try {
      const updateData = {
        ...updates,
        updatedAt: Date.now()
      };
      
      console.log("習慣を更新中:", habitId, updateData);
      
      await updateDoc(doc(db, "habits", habitId), updateData);
      
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage("✅ 習慣を更新しました");
      
      console.log("習慣更新成功:", habitId);
    } catch (error) {
      console.error("習慣更新エラー:", error);
      const errorMessage = translateFirebaseError(error);
      
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(errorMessage);
      
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  /**
   * 習慣を削除
   */
  removeHabit: async (habitId) => {
    if (!habitId) {
      throw new Error("習慣IDが指定されていません");
    }

    const habit = get().habits.find(h => h.id === habitId);
    if (!habit) {
      throw new Error("指定された習慣が見つかりません");
    }
    
    try {
      console.log("習慣を削除中:", habitId);
      
      await deleteDoc(doc(db, "habits", habitId));
      
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(`🗑️ 習慣「${habit.title}」を削除しました`);
      
      console.log("習慣削除成功:", habitId);
    } catch (error) {
      console.error("習慣削除エラー:", error);
      const errorMessage = translateFirebaseError(error);
      
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(errorMessage);
      
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  /**
   * 習慣の完了状態を切り替え
   */
  toggleHabitCompletion: async (habitId, date) => {
    const habit = get().habits.find(h => h.id === habitId);
    if (!habit) {
      throw new Error("指定された習慣が見つかりません");
    }
    
    const targetDate = date || new Date().toISOString().split('T')[0];
    const existingCompletion = habit.completionHistory.find(
      completion => completion.date === targetDate
    );
    
    try {
      if (existingCompletion?.completed) {
        await get().markHabitIncomplete(habitId, targetDate);
      } else {
        await get().markHabitComplete(habitId, targetDate);
      }
    } catch (error) {
      console.error("習慣完了状態切り替えエラー:", error);
      throw error;
    }
  },

  /**
   * 習慣を完了としてマーク
   */
  markHabitComplete: async (habitId, date) => {
    const habit = get().habits.find(h => h.id === habitId);
    if (!habit) {
      throw new Error("指定された習慣が見つかりません");
    }
    
    const targetDate = date || new Date().toISOString().split('T')[0];
    const completionRecord: HabitCompletion = {
      date: targetDate,
      completed: true,
      completedAt: Date.now()
    };
    
    try {
      console.log("習慣完了をマーク中:", habitId, targetDate);
      
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
      
      console.log("習慣完了マーク成功:", habitId);
      
    } catch (error) {
      console.error("習慣完了エラー:", error);
      const errorMessage = translateFirebaseError(error);
      
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(errorMessage);
      
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  /**
   * 習慣を未完了としてマーク
   */
  markHabitIncomplete: async (habitId, date) => {
    const habit = get().habits.find(h => h.id === habitId);
    if (!habit) {
      throw new Error("指定された習慣が見つかりません");
    }
    
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    try {
      console.log("習慣完了を取り消し中:", habitId, targetDate);
      
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
      
      console.log("習慣完了取り消し成功:", habitId);
      
    } catch (error) {
      console.error("習慣完了取り消しエラー:", error);
      const errorMessage = translateFirebaseError(error);
      
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(errorMessage);
      
      set({ error: errorMessage });
      throw new Error(errorMessage);
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
    
    // 平均完了率を計算（過去30日間）
    let totalCompletionRate = 0;
    let habitsWithHistory = 0;
    
    activeHabits.forEach(habit => {
      // 過去30日間の完了率を計算
      const rate = HabitUtils.calculateCompletionRate(habit, 30);
      totalCompletionRate += rate;
      habitsWithHistory++;
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
    
    set({ habits: [], unsubscribe: null, error: null });
  }
}));