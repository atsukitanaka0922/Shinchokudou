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

type Task = {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: number | null;
  userId: string;
  deadline?: string;
  order: number;
};

interface TaskState {
  tasks: Task[];
  loadTasks: () => void;
  addTask: (text: string, deadline?: string) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
  toggleCompleteTask: (taskId: string) => Promise<void>;
  setDeadline: (taskId: string, deadline: string) => Promise<void>;
  moveTaskUp: (taskId: string) => void;
  moveTaskDown: (taskId: string) => void;
  startPomodoro: (taskId: string) => void;
  clearTasks: () => void; // ログアウト時にタスクをリセット
  reorderTasks: (sourceIndex: number, destinationIndex: number) => Promise<void>; // ドラッグ&ドロップ用
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],

  loadTasks: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      console.log("🚨 ユーザーがログインしていないため、タスクを取得できません");
      set({ tasks: [] });
      return;
    }

    console.log(`🔍 Firestore からユーザー ${user.uid} のタスクを取得`);
    const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
    const snapshot = await getDocs(q);

    const tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Task[];
    
    // orderフィールドで並べ替え
    tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    console.log("✅ Firestore からタスク取得成功:", tasks);
    set({ tasks });
  },

  addTask: async (text, deadline) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const tasks = get().tasks;
    const newTask = {
      text,
      completed: false,
      completedAt: null,
      userId: user.uid,
      order: tasks.length + 1,
      ...(deadline ? { deadline } : {}),
    };

    const docRef = await addDoc(collection(db, "tasks"), newTask);
    set((state) => ({ tasks: [...state.tasks, { id: docRef.id, ...newTask }] }));
    console.log("✅ Firestore にタスク追加:", newTask);
  },

  removeTask: async (taskId) => {
    await deleteDoc(doc(db, "tasks", taskId));
    set((state) => ({ tasks: state.tasks.filter((task) => task.id !== taskId) }));
    console.log("🗑️ タスク削除:", taskId);
  },

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

    console.log(`✅ タスク ${taskId} を ${newCompleted ? "完了" : "未完了"} に変更`);
  },

  setDeadline: async (taskId, deadline) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    await updateDoc(doc(db, "tasks", taskId), { deadline });
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, deadline } : t
      ),
    }));
    console.log(`📅 タスク ${taskId} の締め切りを更新: ${deadline}`);
  },

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
    console.log(`🔼 タスク ${taskId} を上に移動`);
  },

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
    console.log(`🔽 タスク ${taskId} を下に移動`);
  },

  startPomodoro: (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    console.log(`⏳ ポモドーロ開始: ${task.text}`);
    
    // PomodoroStore の startPomodoro メソッドを呼び出し
    const pomodoroStore = usePomodoroStore.getState();
    pomodoroStore.startPomodoro(taskId);
  },

  clearTasks: () => {
    set({ tasks: [] });
    console.log("🚪 ログアウトしたため、タスクをリセット");
  },
  
  // ドラッグ&ドロップによるタスクの並べ替え
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
    console.log("✅ タスクの並び順を更新しました");
  }
}));