import { create } from "zustand";
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc, deleteDoc, getDocs } from "firebase/firestore";

type Task = {
  id: string;
  text: string;
  completed: boolean;
};

type TaskState = {
  tasks: Task[];
  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  loadTasks: () => void;
};

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  addTask: async (text) => {
    const docRef = await addDoc(collection(db, "tasks"), { text, completed: false });
    set({ tasks: [...get().tasks, { id: docRef.id, text, completed: false }] });
  },
  toggleTask: async (id) => {
    const task = get().tasks.find((task) => task.id === id);
    if (!task) return;

    await updateDoc(doc(db, "tasks", id), { completed: !task.completed });

    set({
      tasks: get().tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      ),
    });
  },
  removeTask: async (id) => {
    await deleteDoc(doc(db, "tasks", id));
    set({ tasks: get().tasks.filter((task) => task.id !== id) });
  },
  loadTasks: async () => {
    const querySnapshot = await getDocs(collection(db, "tasks"));
    const tasks = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      text: doc.data().text,
      completed: doc.data().completed,
    })) as Task[];
    set({ tasks });
  },
}));
