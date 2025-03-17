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
  writeBatch 
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
};

/**
 * タスクストアの状態とアクション定義
 */
interface TaskState {
  tasks: Task[];
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
}

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

  /**
   * ユーザーのタスクをFirestoreから読み込む
   */
  loadTasks: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      console.log("ユーザーがログインしていないため、タスクを取得できません");
      set({ tasks: [] });
      return;
    }

    const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
    const snapshot = await getDocs(q);

    const tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Task[];
    
    // orderフィールドで並べ替え
    tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    set({ tasks });
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
      ...(deadline ? { deadline } : {}),
    };

    const docRef = await addDoc(collection(db, "tasks"), newTask);
    set((state) => ({ tasks: [...state.tasks, { id: docRef.id, ...newTask }] }));
    
    // フィードバック表示
    const feedbackStore = useFeedbackStore.getState();
    feedbackStore.setMessage(`タスク「${text}」を追加しました`);
  },

  /**
   * タスクを削除
   * @param taskId 削除するタスクのID
   */
  removeTask: async (taskId) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;
    
    await deleteDoc(doc(db, "tasks", taskId));
    set((state) => ({ tasks: state.tasks.filter((task) => task.id !== taskId) }));
    
    // フィードバック表示
    const feedbackStore = useFeedbackStore.getState();
    feedbackStore.setMessage(`タスク「${task.text}」を削除しました`);
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
    await updateDoc(doc(db, "tasks", taskId), { completed: newCompleted, completedAt });

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: newCompleted, completedAt } : t
      ),
    }));

    // タスクが完了に変更された場合
    if (newCompleted) {
      // 効果音を再生
      playTaskCompletionSound();
      
      // フィードバック表示
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(`🎉 タスク「${task.text}」を完了しました！`);
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

    await updateDoc(doc(db, "tasks", taskId), { deadline });
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, deadline } : t
      ),
    }));
    
    // フィードバック表示
    const feedbackStore = useFeedbackStore.getState();
    feedbackStore.setMessage(`タスク「${task.text}」の期限を設定しました`);
  },

  /**
   * タスクの優先度を設定
   * @param taskId 対象のタスクID
   * @param priority 優先度（high/medium/low）
   */
  setPriority: async (taskId, priority) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    await updateDoc(doc(db, "tasks", taskId), { priority });
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, priority } : t
      ),
    }));
    
    // フィードバック表示
    const feedbackStore = useFeedbackStore.getState();
    feedbackStore.setMessage(`タスク「${task.text}」の優先度を「${priority}」に設定しました`);
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
      updateDoc(doc(db, "tasks", tasks[index].id), { order: tasks[index].order });
      updateDoc(doc(db, "tasks", tasks[index - 1].id), { order: tasks[index - 1].order });

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
      updateDoc(doc(db, "tasks", tasks[index].id), { order: tasks[index].order });
      updateDoc(doc(db, "tasks", tasks[index + 1].id), { order: tasks[index + 1].order });

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
    set({ tasks: [] });
  },
  
  /**
   * ドラッグ&ドロップによるタスクの並べ替え
   * @param sourceIndex 元の位置のインデックス
   * @param destinationIndex 移動先のインデックス
   */
  reorderTasks: async (sourceIndex, destinationIndex) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    set((state) => {
      const result = [...state.tasks];
      const [removed] = result.splice(sourceIndex, 1);
      result.splice(destinationIndex, 0, removed);
      
      // order フィールドを更新
      const updatedTasks = result.map((task, index) => ({
        ...task,
        order: index
      }));
      
      return { tasks: updatedTasks };
    });
    
    // Firestore のバッチ更新
    const batch = writeBatch(db);
    get().tasks.forEach((task) => {
      const taskRef = doc(db, "tasks", task.id);
      batch.update(taskRef, { order: task.order });
    });
    
    await batch.commit();
  }
}));