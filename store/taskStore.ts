import { create } from "zustand";
import { db } from "@/lib/firebase";
import { collection, doc, addDoc, deleteDoc, updateDoc, query, orderBy, onSnapshot } from "firebase/firestore";

type Task = {
  id: string;
  text: string;
  completed: boolean;
  order: number;
  deadline?: string;
  completedAt?: number | null; // 🔥 `null` も許容
};

type TaskState = {
  tasks: Task[];
  message: string | null;
  addTask: (text: string, deadline?: string) => void;
  removeTask: (taskId: string) => void;
  toggleCompleteTask: (taskId: string) => void;
  moveTaskUp: (index: number) => void;
  moveTaskDown: (index: number) => void;
  setDeadline: (taskId: string, deadline: string) => void;
  startPomodoro: (taskId: string) => void;
  loadTasks: () => void;
};

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  message: null,

  // Firestore からタスクを取得し、1 週間以上前の完了タスクを削除
  loadTasks: () => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000; // 🔥 1週間前のタイムスタンプ
    const q = query(collection(db, "tasks"), orderBy("order"));

    onSnapshot(q, async (querySnapshot) => {
      const tasks = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];

      // 🔥 1 週間以上前に完了したタスクを削除
      tasks.forEach(async (task) => {
        if (task.completed && task.completedAt && task.completedAt < oneWeekAgo) {
          await deleteDoc(doc(db, "tasks", task.id));
        }
      });

      set({ tasks });
    });
  },

  // タスクを追加
  addTask: async (text, deadline) => {
    await addDoc(collection(db, "tasks"), {
      text,
      completed: false,
      order: Date.now(),
      deadline: deadline || null,
    });
  },

  // タスクを削除
  removeTask: async (taskId) => {
    await deleteDoc(doc(db, "tasks", taskId));
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
    }));
  },

  // タスク完了 / 取り消し
  toggleCompleteTask: async (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newCompleted = !task.completed;
    const completedAt = newCompleted ? Date.now() : null; // 🔥 完了時にタイムスタンプを保存
    await updateDoc(doc(db, "tasks", taskId), { completed: newCompleted, completedAt });

    const messages = newCompleted
      ? ["🎉 よくやった！", "💪 素晴らしい進捗！", "🚀 次のステップへ進もう！"]
      : ["↩️ タスクを未完了に戻しました", "📌 もう一度チャレンジ！", "🔄 進捗を調整しました"];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    set({
      tasks: get().tasks.map((t) => (t.id === taskId ? { ...t, completed: newCompleted, completedAt } : t)),
      message: randomMessage,
    });

    setTimeout(() => set({ message: null }), 3000);
  },

  // タスクを上に移動
  moveTaskUp: async (index) => {
    if (index === 0) return;
    const tasks = [...get().tasks];
    [tasks[index], tasks[index - 1]] = [tasks[index - 1], tasks[index]];
    set({ tasks });

    await updateDoc(doc(db, "tasks", tasks[index].id), { order: index - 1 });
    await updateDoc(doc(db, "tasks", tasks[index - 1].id), { order: index });
  },

  // タスクを下に移動
  moveTaskDown: async (index) => {
    const tasks = [...get().tasks];
    if (index === tasks.length - 1) return;
    [tasks[index], tasks[index + 1]] = [tasks[index + 1], tasks[index]];
    set({ tasks });

    await updateDoc(doc(db, "tasks", tasks[index].id), { order: index + 1 });
    await updateDoc(doc(db, "tasks", tasks[index + 1].id), { order: index });
  },

  // 締め切りを設定
  setDeadline: async (taskId, deadline) => {
    await updateDoc(doc(db, "tasks", taskId), { deadline });
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, deadline } : task
      ),
    }));
  },

  // ポモドーロ開始
  startPomodoro: async (taskId) => {
    await updateDoc(doc(db, "tasks", taskId), { isPomodoroActive: true });
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, isPomodoroActive: true } : t
      ),
    }));
  },
}));
