import { create } from "zustand";
import { db } from "@/lib/firebase";
import { collection, doc, addDoc, deleteDoc, updateDoc, query, orderBy, onSnapshot } from "firebase/firestore";

type Task = {
  id: string;
  text: string;
  completed: boolean;
  order: number;
  deadline?: string; // 締め切り日
};

type TaskState = {
  tasks: Task[];
  message: string | null;
  addTask: (text: string, deadline?: string) => void;
  removeTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  moveTaskUp: (index: number) => void;
  moveTaskDown: (index: number) => void;
  setDeadline: (taskId: string, deadline: string) => void;
  loadTasks: () => void;
};

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  message: null,

  // Firestore からタスクを取得
  loadTasks: () => {
    const q = query(collection(db, "tasks"), orderBy("order"));
    onSnapshot(q, (querySnapshot) => {
      const tasks = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      set({ tasks });
    });
  },

  // タスクを追加（締め切り日を設定可能）
  addTask: async (text, deadline) => {
    const newTaskRef = await addDoc(collection(db, "tasks"), {
      text,
      completed: false,
      order: Date.now(),
      deadline: deadline || null,
    });

    set((state) => ({
      tasks: [...state.tasks, { id: newTaskRef.id, text, completed: false, order: Date.now(), deadline }],
    }));
  },

  // タスクを削除
  removeTask: async (taskId) => {
    await deleteDoc(doc(db, "tasks", taskId));
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
    }));
  },

  // タスク完了
  completeTask: async (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    await updateDoc(doc(db, "tasks", taskId), { completed: true });

    const messages = [
      "🎉 よくやった！",
      "💪 素晴らしい進捗！",
      "🚀 次のステップへ進もう！",
      "🌟 最高の仕事だね！",
      "👏 目標達成おめでとう！",
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    new Audio("/sounds/task-complete.mp3").play();

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, completed: true } : t)),
      message: randomMessage,
    }));

    setTimeout(() => set({ message: null }), 3000);
  },

  // タスクを上に移動
  moveTaskUp: async (index) => {
    if (index === 0) return; // 先頭なら何もしない

    const tasks = [...get().tasks];
    [tasks[index], tasks[index - 1]] = [tasks[index - 1], tasks[index]];

    const batchUpdates = tasks.map((task, i) => {
      const taskRef = doc(db, "tasks", task.id);
      return updateDoc(taskRef, { order: i });
    });

    await Promise.all(batchUpdates);
    set({ tasks });
  },

  // タスクを下に移動
  moveTaskDown: async (index) => {
    const tasks = [...get().tasks];
    if (index === tasks.length - 1) return; // 最後なら何もしない

    [tasks[index], tasks[index + 1]] = [tasks[index + 1], tasks[index]];

    const batchUpdates = tasks.map((task, i) => {
      const taskRef = doc(db, "tasks", task.id);
      return updateDoc(taskRef, { order: i });
    });

    await Promise.all(batchUpdates);
    set({ tasks });
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
}));
