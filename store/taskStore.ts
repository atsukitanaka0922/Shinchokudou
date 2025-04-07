/**
 * タスク管理ストア
 * 
 * Zustandを使用したタスク管理のためのグローバルステート管理
 * タスクの追加・削除・更新などの機能とFirestoreとの連携を提供
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
  writeBatch,
  onSnapshot,
  Timestamp
} from "firebase/firestore";
import { useAuthStore } from "@/store/auth";
import { usePomodoroStore } from "@/store/pomodoroStore";
import { useFeedbackStore } from "@/store/feedbackStore";
import { PriorityLevel } from "@/lib/aiPriorityAssignment";

/**
 * タスクのインターフェース定義
 */
export type Task = {
  id: string;               // タスクのユニークID
  text: string;             // タスクの内容
  completed: boolean;       // 完了状態
  completedAt?: number | null; // 完了日時のタイムスタンプ
  userId: string;           // 所有ユーザーID
  deadline?: string;        // 期限（YYYY-MM-DD形式）
  order: number;            // 表示順序
  priority: PriorityLevel;  // 優先度（high/medium/low）
  createdAt?: number;       // 作成日時のタイムスタンプ
  scheduledForDeletion?: boolean; // 削除予定フラグ
};

/**
 * タスクストアの状態とアクション定義
 */
interface TaskState {
  tasks: Task[];
  loading: boolean;
  unsubscribe: (() => void) | null;
  loadTasks: () => void;
  addTask: (text: string, deadline?: string, priority?: PriorityLevel) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
  toggleCompleteTask: (taskId: string) => Promise<void>;
  setDeadline: (taskId: string, deadline: string) => Promise<void>;
  setPriority: (taskId: string, priority: PriorityLevel) => Promise<void>;
  moveTaskUp: (taskId: string) => void;
  moveTaskDown: (taskId: string) => void;
  startPomodoro: (taskId: string) => void;
  clearTasks: () => void;
  reorderTasks: (sourceIndex: number, destinationIndex: number) => Promise<void>;
  checkAndDeleteCompletedTasks: () => Promise<void>; // 完了したタスクの削除チェック
}

// 1週間のミリ秒数
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * タスク完了時の効果音を再生
 */
const playTaskCompletionSound = () => {
  if (typeof window !== 'undefined') {
    try {
      const audio = new Audio("/sounds/task-complete.mp3");
      audio.play().catch(err => console.log("オーディオ再生エラー:", err));
    } catch (error) {
      console.log("オーディオ再生エラー:", error);
    }
  }
};

/**
 * ポモドーロタブを開くイベントを発火
 */
const openPomodoroTab = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('openPomodoroTab'));
  }
};

/**
 * Zustandを使用したタスク管理ストアの作成
 */
export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: true,
  unsubscribe: null,

  /**
   * ユーザーのタスクをFirestoreからリアルタイムで監視・読み込む
   */
  loadTasks: () => {
    const user = useAuthStore.getState().user;
    
    // 前回のリスナーがあれば解除
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
    }
    
    // ユーザーがログインしていない場合
    if (!user) {
      console.log("ユーザーがログインしていないため、タスクを取得できません");
      set({ tasks: [], loading: false, unsubscribe: null });
      return;
    }
    
    set({ loading: true });
    
    try {
      console.log(`Firestoreからユーザー ${user.uid} のタスクを監視開始`);
      const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
      
      // リアルタイムリスナーを設定
      const unsubscribeListener = onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as Task[];
        
        // orderフィールドで並べ替え
        tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        console.log("Firestoreからタスク取得成功:", tasks);
        set({ tasks, loading: false });
        
        // タスクを読み込んだ後、完了済みで古いタスクの削除チェック
        get().checkAndDeleteCompletedTasks();
      }, (error) => {
        console.error("Firestoreの監視エラー:", error);
        set({ loading: false });
        
        // エラーをフィードバックで表示
        const feedbackStore = useFeedbackStore.getState();
        feedbackStore.setMessage("タスクの読み込みに失敗しました");
      });
      
      // リスナー解除関数を保存
      set({ unsubscribe: unsubscribeListener });
      
    } catch (error) {
      console.error("タスク監視の設定に失敗:", error);
      set({ loading: false });
    }
  },

  /**
   * 新しいタスクを追加
   * @param text タスクの内容
   * @param deadline 期限（オプション）
   * @param priority 優先度（デフォルトはmedium）
   */
  addTask: async (text, deadline, priority = 'medium') => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const tasks = get().tasks;
    const newTask = {
      text,
      completed: false,
      completedAt: null,
      userId: user.uid,
      order: tasks.length + 1,
      priority,
      createdAt: Date.now(),
      scheduledForDeletion: false,
      ...(deadline ? { deadline } : {}),
    };

    try {
      const docRef = await addDoc(collection(db, "tasks"), newTask);
      // リアルタイムリスナーで自動更新されるので、手動で状態を更新する必要はない
      
      // フィードバック表示
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(`タスク「${text}」を追加しました`);
      
    } catch (error) {
      console.error("タスク追加エラー:", error);
      
      // エラーをフィードバックで表示
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage("タスクの追加に失敗しました");
    }
  },

  /**
   * タスクを削除
   * @param taskId 削除するタスクのID
   */
  removeTask: async (taskId) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;
    
    try {
      await deleteDoc(doc(db, "tasks", taskId));
      // リアルタイムリスナーで自動更新
      
      // フィードバック表示
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(`タスク「${task.text}」を削除しました`);
      
    } catch (error) {
      console.error("タスク削除エラー:", error);
      
      // エラーをフィードバックで表示
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage("タスクの削除に失敗しました");
    }
  },

  /**
   * タスクの完了状態を切り替え
   * @param taskId 対象のタスクID
   */
  toggleCompleteTask: async (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newCompleted = !task.completed;
    const completedAt = newCompleted ? Date.now() : null;
    
    try {
      // 完了状態、完了日時、削除予定フラグを更新
      // 完了する場合は1週間後の自動削除予定としてフラグを設定
      await updateDoc(doc(db, "tasks", taskId), { 
        completed: newCompleted, 
        completedAt, 
        scheduledForDeletion: newCompleted 
      });
      // リアルタイムリスナーで自動更新
      
      // タスクが完了に変更された場合
      if (newCompleted) {
        // 効果音を再生
        playTaskCompletionSound();
        
        // フィードバック表示
        const feedbackStore = useFeedbackStore.getState();
        feedbackStore.setMessage(`🎉 タスク「${task.text}」を完了しました！ (1週間後に自動的に削除されます)`);
      }
    } catch (error) {
      console.error("タスク状態変更エラー:", error);
      
      // エラーをフィードバックで表示
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage("タスク状態の変更に失敗しました");
    }
  },

  /**
   * タスクの期限を設定
   * @param taskId 対象のタスクID
   * @param deadline 期限（YYYY-MM-DD形式）
   */
  setDeadline: async (taskId, deadline) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      await updateDoc(doc(db, "tasks", taskId), { deadline });
      // リアルタイムリスナーで自動更新
      
      // フィードバック表示
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(`タスク「${task.text}」の期限を設定しました`);
    } catch (error) {
      console.error("期限設定エラー:", error);
      
      // エラーをフィードバックで表示
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage("期限の設定に失敗しました");
    }
  },

  /**
   * タスクの優先度を設定
   * @param taskId 対象のタスクID
   * @param priority 優先度（high/medium/low）
   */
  setPriority: async (taskId, priority) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      await updateDoc(doc(db, "tasks", taskId), { priority });
      // リアルタイムリスナーで自動更新
      
      // フィードバック表示
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(`タスク「${task.text}」の優先度を「${priority}」に設定しました`);
    } catch (error) {
      console.error("優先度設定エラー:", error);
      
      // エラーをフィードバックで表示
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage("優先度の設定に失敗しました");
    }
  },

  /**
   * タスクを上に移動（表示順を上げる）
   * @param taskId 対象のタスクID
   */
  moveTaskUp: (taskId) => {
    set((state) => {
      const index = state.tasks.findIndex((task) => task.id === taskId);
      if (index <= 0) return state;

      const tasks = [...state.tasks];
      [tasks[index], tasks[index - 1]] = [tasks[index - 1], tasks[index]];

      // order フィールドも更新
      tasks[index].order = index;
      tasks[index - 1].order = index - 1;

      // Firestore も更新
      try {
        updateDoc(doc(db, "tasks", tasks[index].id), { order: tasks[index].order });
        updateDoc(doc(db, "tasks", tasks[index - 1].id), { order: tasks[index - 1].order });
      } catch (error) {
        console.error("タスク移動エラー:", error);
      }

      return { tasks };
    });
  },

  /**
   * タスクを下に移動（表示順を下げる）
   * @param taskId 対象のタスクID
   */
  moveTaskDown: (taskId) => {
    set((state) => {
      const index = state.tasks.findIndex((task) => task.id === taskId);
      if (index < 0 || index >= state.tasks.length - 1) return state;

      const tasks = [...state.tasks];
      [tasks[index], tasks[index + 1]] = [tasks[index + 1], tasks[index]];

      // order フィールドも更新
      tasks[index].order = index;
      tasks[index + 1].order = index + 1;

      // Firestore も更新
      try {
        updateDoc(doc(db, "tasks", tasks[index].id), { order: tasks[index].order });
        updateDoc(doc(db, "tasks", tasks[index + 1].id), { order: tasks[index + 1].order });
      } catch (error) {
        console.error("タスク移動エラー:", error);
      }

      return { tasks };
    });
  },

  /**
   * タスクのポモドーロタイマーを開始
   * @param taskId 対象のタスクID
   */
  startPomodoro: (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    
    // PomodoroStore の startPomodoro メソッドを呼び出し
    const pomodoroStore = usePomodoroStore.getState();
    pomodoroStore.startPomodoro(taskId);
    
    // ポモドーロタブを開くイベントを発火
    openPomodoroTab();
  },

  /**
   * タスクリストをクリア（主にログアウト時に使用）
   */
  clearTasks: () => {
    // リスナーを解除
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
    }
    
    set({ tasks: [], unsubscribe: null });
  },
  
  /**
   * ドラッグ&ドロップ機能は削除 - 将来の拡張のための参考として残しておく
   */
  reorderTasks: async (sourceIndex, destinationIndex) => {
    console.log("ドラッグ&ドロップ機能は現在無効化されています");
    // 何もしないダミー関数
    return;
  },

  /**
   * 完了から1週間経過したタスクを削除する
   * 定期的に呼び出されて、削除条件を満たすタスクをチェック
   */
  checkAndDeleteCompletedTasks: async () => {
    const tasks = get().tasks;
    const now = Date.now();
    const tasksToDelete = tasks.filter(task => {
      // 完了していて、completedAtが存在し、1週間以上経過しているものを対象
      return task.completed && 
             task.completedAt && 
             (now - task.completedAt > ONE_WEEK_MS) &&
             task.scheduledForDeletion;
    });
    
    if (tasksToDelete.length === 0) return;
    
    try {
      // 削除対象のタスクがある場合、バッチ処理で一括削除
      const batch = writeBatch(db);
      tasksToDelete.forEach(task => {
        const taskRef = doc(db, "tasks", task.id);
        batch.delete(taskRef);
      });
      
      await batch.commit();
      
      // 削除完了のフィードバック
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(`完了から1週間経過した${tasksToDelete.length}件のタスクを自動的に削除しました`);
      
      console.log(`${tasksToDelete.length}件の古い完了済みタスクを削除しました`);
    } catch (error) {
      console.error("古いタスクの削除に失敗:", error);
    }
  }
}));

// アプリ起動時に定期的なタスクチェック処理をセットアップ
if (typeof window !== 'undefined') {
  // 1時間ごとに自動削除チェックを実行
  setInterval(() => {
    const { checkAndDeleteCompletedTasks } = useTaskStore.getState();
    const user = useAuthStore.getState().user;
    
    if (user) {
      checkAndDeleteCompletedTasks();
    }
  }, 60 * 60 * 1000); // 1時間ごと
}