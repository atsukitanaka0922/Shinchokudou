import { create } from "zustand";
import { db } from "@/firebase";
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

type Task = {
  id: string;
  text: string;
  completed: boolean;
  order: number;
};

type TaskState = {
  tasks: Task[];
  addTask: (text: string) => void;
  removeTask: (taskId: string) => void;
  toggleTask: (taskId: string) => void;
  reorderTasks: (sourceIndex: number, destinationIndex: number) => void;
  loadTasks: () => void;
};

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],

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

  // タスクを追加
  addTask: async (text) => {
    await addDoc(collection(db, "tasks"), {
      text,
      completed: false,
      order: Date.now(), // Firestore の並び順が正しく反映されるようにタイムスタンプを使用
    });
  },

  // タスクを削除
  removeTask: async (taskId) => {
    await deleteDoc(doc(db, "tasks", taskId));
  },

  // タスクの完了状態を切り替え
  toggleTask: async (taskId) => {
    const taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, { completed: true });
  },

  // タスクの順番を変更
  reorderTasks: async (sourceIndex, destinationIndex) => {
    const tasks = [...get().tasks];
    const [movedTask] = tasks.splice(sourceIndex, 1);
    tasks.splice(destinationIndex, 0, movedTask);

    // Firestore の順番を更新
    for (let i = 0; i < tasks.length; i++) {
      const taskRef = doc(db, "tasks", tasks[i].id);
      await updateDoc(taskRef, { order: i });
    }

    set({ tasks });
  },
}));
