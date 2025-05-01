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
  Timestamp,
  orderBy
} from "firebase/firestore";
import { useAuthStore } from "@/store/auth";
import { usePomodoroStore } from "@/store/pomodoroStore";
import { useFeedbackStore } from "@/store/feedbackStore";
import { usePointsStore } from "@/store/pointsStore";
import { PriorityLevel } from "@/lib/aiPriorityAssignment";
import { 
  getSubTasksByParentId, 
  completeAllSubTasksByParentId,
  deleteAllSubTasksByParentId 
} from "@/lib/subtaskService";

/**
 * サブタスクのインターフェース定義
 */
export type SubTask = {
  id: string;               // サブタスクのユニークID
  text: string;             // サブタスクの内容
  completed: boolean;       // 完了状態
  parentId: string;         // 親タスクのID
  createdAt?: number;       // 作成日時のタイムスタンプ
};

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
  memo?: string;            // タスクに関するメモ
  subTasks?: SubTask[];     // サブタスク配列
  points?: number;          // タスク完了時に獲得できるポイント
};

/**
 * タスクソートの種類
 */
export type SortType = 'deadline' | 'priority' | 'createdAt' | 'alphabetical';

/**
 * タスクストアの状態とアクション定義
 */
interface TaskState {
  tasks: Task[];
  loading: boolean;
  unsubscribe: (() => void) | null;
  sortType: SortType;
  
  // 基本的なタスク操作
  loadTasks: () => void;
  addTask: (text: string, deadline?: string, priority?: PriorityLevel, memo?: string, points?: number) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
  toggleCompleteTask: (taskId: string) => Promise<void>;
  
  // タスク属性の更新
  setDeadline: (taskId: string, deadline: string) => Promise<void>;
  setPriority: (taskId: string, priority: PriorityLevel) => Promise<void>;
  setMemo: (taskId: string, memo: string) => Promise<void>;
  setPoints: (taskId: string, points: number) => Promise<void>;
  
  // タスク順序の管理
  moveTaskUp: (taskId: string) => void;
  moveTaskDown: (taskId: string) => void;
  setSortType: (type: SortType) => void;
  
  // サブタスク管理
  addSubTask: (parentId: string, text: string) => Promise<void>;
  removeSubTask: (parentId: string, subTaskId: string) => Promise<void>;
  toggleSubTaskComplete: (parentId: string, subTaskId: string) => Promise<void>;
  
  // その他の機能
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
 * タスクを指定した条件でソートする関数
 */
const sortTasks = (tasks: Task[], sortType: SortType): Task[] => {
  const sortedTasks = [...tasks];
  
  switch (sortType) {
    case 'deadline':
      // 期限でソート、期限なしタスクは後ろに
      return sortedTasks.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
      });
      
    case 'priority':
      // 優先度でソート（high > medium > low）
      return sortedTasks.sort((a, b) => {
        const priorityValue = { 'high': 0, 'medium': 1, 'low': 2 };
        return priorityValue[a.priority] - priorityValue[b.priority];
      });
      
    case 'createdAt':
      // 作成日時でソート（新しいものが上）
      return sortedTasks.sort((a, b) => {
        const aTime = a.createdAt || 0;
        const bTime = b.createdAt || 0;
        return bTime - aTime;
      });
      
    case 'alphabetical':
      // アルファベット/文字順でソート
      return sortedTasks.sort((a, b) => a.text.localeCompare(b.text));
      
    default:
      // デフォルトは order フィールドでソート
      return sortedTasks.sort((a, b) => (a.order || 0) - (b.order || 0));
  }
};
/**
 * Zustandを使用したタスク管理ストアの作成
 */
export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: true,
  unsubscribe: null,
  sortType: 'createdAt', // デフォルトのソートタイプ

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
        let tasks = snapshot.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data(),
          subTasks: [] // サブタスクの初期化
        })) as Task[];
        
        // サブタスクを読み込む
        const loadSubTasks = async () => {
          for (const task of tasks) {
            try {
              const subTasks = await getSubTasksByParentId(task.id);
              // サブタスクをタスクに関連付け
              task.subTasks = subTasks;
            } catch (error) {
              console.error(`サブタスクの読み込みエラー(タスクID: ${task.id}):`, error);
              task.subTasks = [];
            }
          }
          
          // 現在のソートタイプでタスクをソート
          const sortedTasks = sortTasks(tasks, get().sortType);
          
          // ストアの状態を更新
          set({ tasks: sortedTasks, loading: false });
          
          // タスクを読み込んだ後、完了済みで古いタスクの削除チェック
          get().checkAndDeleteCompletedTasks();
        };
        
        // サブタスクを読み込む
        loadSubTasks();
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
   * @param memo メモ（オプション）
   * @param points 獲得ポイント（オプション）
   */
  addTask: async (text, deadline, priority = 'medium', memo = '', points) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const tasks = get().tasks;
    // 優先度に応じたデフォルトポイントを設定（指定がなければ）
    const pointsStore = usePointsStore.getState();
    const taskPoints = points !== undefined ? points : pointsStore.calculateTaskPoints(priority);
    
    const newTask = {
      text,
      completed: false,
      completedAt: null,
      userId: user.uid,
      order: tasks.length + 1,
      priority,
      createdAt: Date.now(),
      scheduledForDeletion: false,
      memo,
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
      // まず関連するサブタスクを削除
      await deleteAllSubTasksByParentId(taskId);
      
      // 次にメインタスクを削除
      await deleteDoc(doc(db, "tasks", taskId));
      
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
      
      // タスクが完了に変更された場合
      if (newCompleted) {
        // 効果音を再生
        playTaskCompletionSound();
        
        // サブタスクも全て完了にする
        if (task.subTasks && task.subTasks.some(st => !st.completed)) {
          await completeAllSubTasksByParentId(taskId);
        }
        
        // ポイントを加算（ポイント値は透明化）
        const pointsStore = usePointsStore.getState();
        const calculatedPoints = pointsStore.calculateTaskPoints(task.priority);
        await pointsStore.addPoints(calculatedPoints, `タスク完了: ${task.text}`);
        
        // フィードバック表示（ポイント値は非表示）
        const feedbackStore = useFeedbackStore.getState();
        feedbackStore.setMessage(`🎉 タスク「${task.text}」を完了しました！ ポイントを獲得しました！ (1週間後に自動的に削除されます)`);
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
   * タスクのメモを設定
   * @param taskId 対象のタスクID
   * @param memo メモ内容
   */
  setMemo: async (taskId, memo) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      await updateDoc(doc(db, "tasks", taskId), { memo });
      
      // フィードバック表示
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(`タスク「${task.text}」のメモを更新しました`);
    } catch (error) {
      console.error("メモ設定エラー:", error);
      
      // エラーをフィードバックで表示
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage("メモの設定に失敗しました");
    }
  },

  /**
   * タスクのポイントを設定
   * @param taskId 対象のタスクID
   * @param points ポイント値
   */
  setPoints: async (taskId, points) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      await updateDoc(doc(db, "tasks", taskId), { points });
      
      // フィードバック表示
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(`タスク「${task.text}」のポイントを更新しました`);
    } catch (error) {
      console.error("ポイント設定エラー:", error);
      
      // エラーをフィードバックで表示
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage("ポイントの設定に失敗しました");
    }
  },
  /**
   * ソートタイプを設定
   * @param type ソートタイプ
   */
  setSortType: (type) => {
    // 現在のタスクを新しいソートタイプでソート
    const sortedTasks = sortTasks(get().tasks, type);
    set({ sortType: type, tasks: sortedTasks });
    
    // フィードバック表示
    const feedbackStore = useFeedbackStore.getState();
    const sortTypeNames = {
      'deadline': '期限',
      'priority': '優先度',
      'createdAt': '作成日時',
      'alphabetical': '名前'
    };
    feedbackStore.setMessage(`タスクを${sortTypeNames[type]}順にソートしました`);
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
   * サブタスクを追加
   * @param parentId 親タスクのID
   * @param text サブタスクの内容
   */
  addSubTask: async (parentId, text) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    // 親タスクが存在するか確認
    const task = get().tasks.find(t => t.id === parentId);
    if (!task) {
      console.error("親タスクが見つかりません");
      return;
    }

    const newSubTask = {
      text,
      completed: false,
      parentId,
      createdAt: Date.now(),
    };

    try {
      // サブタスクをFirestoreに追加
      const docRef = await addDoc(collection(db, "subTasks"), newSubTask);
      
      // フィードバック表示
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(`サブタスクを追加しました`);
      
      // 即時UI更新のためにストア内のタスクも更新
      set(state => {
        const updatedTasks = state.tasks.map(t => {
          if (t.id === parentId) {
            return {
              ...t,
              subTasks: [
                ...(t.subTasks || []),
                { id: docRef.id, ...newSubTask }
              ]
            };
          }
          return t;
        });
        return { tasks: updatedTasks };
      });
    } catch (error) {
      console.error("サブタスク追加エラー:", error);
      
      // エラーをフィードバックで表示
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage("サブタスクの追加に失敗しました");
    }
  },

  /**
   * サブタスクを削除
   * @param parentId 親タスクのID
   * @param subTaskId サブタスクのID
   */
  removeSubTask: async (parentId, subTaskId) => {
    try {
      // Firestoreからサブタスクを削除
      await deleteDoc(doc(db, "subTasks", subTaskId));
      
      // 即時UI更新のためにストア内のタスクも更新
      set(state => {
        const updatedTasks = state.tasks.map(t => {
          if (t.id === parentId && t.subTasks) {
            return {
              ...t,
              subTasks: t.subTasks.filter(st => st.id !== subTaskId)
            };
          }
          return t;
        });
        return { tasks: updatedTasks };
      });
      
      // フィードバック表示
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(`サブタスクを削除しました`);
    } catch (error) {
      console.error("サブタスク削除エラー:", error);
      
      // エラーをフィードバックで表示
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage("サブタスクの削除に失敗しました");
    }
  },

  /**
   * サブタスクの完了状態を切り替え
   * @param parentId 親タスクのID
   * @param subTaskId サブタスクのID
   */
  toggleSubTaskComplete: async (parentId, subTaskId) => {
    const tasks = get().tasks;
    const task = tasks.find(t => t.id === parentId);
    if (!task || !task.subTasks) return;
    
    const subTask = task.subTasks.find(st => st.id === subTaskId);
    if (!subTask) return;
    
    const newCompleted = !subTask.completed;
    
    try {
      // Firestoreのサブタスクを更新
      await updateDoc(doc(db, "subTasks", subTaskId), { completed: newCompleted });
      
      // 即時UI更新のためにストア内のタスクも更新
      set(state => {
        const updatedTasks = state.tasks.map(t => {
          if (t.id === parentId && t.subTasks) {
            return {
              ...t,
              subTasks: t.subTasks.map(st => 
                st.id === subTaskId ? { ...st, completed: newCompleted } : st
              )
            };
          }
          return t;
        });
        return { tasks: updatedTasks };
      });
      
      // サブタスク完了時の音を再生
      if (newCompleted) {
        playTaskCompletionSound();
      }
      
      // 全てのサブタスクが完了したかチェック
      const updatedTask = get().tasks.find(t => t.id === parentId);
      if (updatedTask && updatedTask.subTasks && 
          updatedTask.subTasks.every(st => st.completed) &&
          !updatedTask.completed) {
        // 全サブタスクが完了したら親タスクも自動で完了にする提案
        const feedbackStore = useFeedbackStore.getState();
        feedbackStore.setMessage(`全サブタスクが完了しました！親タスクも完了にしますか？`);
      }
    } catch (error) {
      console.error("サブタスク更新エラー:", error);
      
      // エラーをフィードバックで表示
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage("サブタスクの更新に失敗しました");
    }
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
   * ドラッグ&ドロップ機能（現在は無効）
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
      
      for (const task of tasksToDelete) {
        // タスク本体の削除
        const taskRef = doc(db, "tasks", task.id);
        batch.delete(taskRef);
        
        // サブタスクも削除
        await deleteAllSubTasksByParentId(task.id);
      }
      
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