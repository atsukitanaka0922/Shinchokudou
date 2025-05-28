/**
 * 拡張タスク管理ストア（ソート機能付き）
 * 
 * サブタスク、メモ、ポイント機能を含む拡張されたタスク管理
 * v1.6.0: タスクソート機能とゲーム中ポモドーロ継続機能を追加
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  getDoc
} from "firebase/firestore";
import { useAuthStore } from "@/store/auth";
import { usePointStore } from "@/store/pointStore";
import { useFeedbackStore } from "@/store/feedbackStore";
import { usePomodoroStore } from "@/store/pomodoroStore";
import { PriorityLevel } from "@/lib/aiPriorityAssignment";
import { 
  EnhancedTask, 
  SubTask, 
  CreateSubTaskData, 
  UpdateSubTaskData,
  UpdateTaskMemoData,
  SubTaskUtils,
  TaskUtils,
  TaskAnalytics,
  SubTaskFilter,
  TaskSortBy,
  SortOrder,
  TaskSortConfig
} from "@/lib/taskInterfaces";

/**
 * 拡張タスクストアの状態とアクション定義
 */
interface EnhancedTaskState {
  tasks: EnhancedTask[];
  loading: boolean;
  unsubscribe: (() => void) | null;
  
  // 🔥 追加: ソート設定
  sortConfig: TaskSortConfig;
  setSortConfig: (config: TaskSortConfig) => void;
  
  // 基本のタスク操作
  loadTasks: () => void;
  addTask: (text: string, deadline?: string, priority?: PriorityLevel, memo?: string) => Promise<string>;
  removeTask: (taskId: string) => Promise<void>;
  toggleCompleteTask: (taskId: string) => Promise<void>;
  setDeadline: (taskId: string, deadline: string) => Promise<void>;
  setPriority: (taskId: string, priority: PriorityLevel) => Promise<void>;
  updateTaskMemo: (taskId: string, memo: string) => Promise<void>;
  setEstimatedTime: (taskId: string, minutes: number) => Promise<void>;
  
  // サブタスク操作
  addSubTask: (data: CreateSubTaskData) => Promise<string>;
  updateSubTask: (taskId: string, subTaskId: string, data: UpdateSubTaskData) => Promise<void>;
  removeSubTask: (taskId: string, subTaskId: string) => Promise<void>;
  toggleCompleteSubTask: (taskId: string, subTaskId: string) => Promise<void>;
  reorderSubTasks: (taskId: string, newOrder: string[]) => Promise<void>;
  
  // ポモドーロ連携
  startPomodoro: (taskId: string) => void;
  
  // 🔥 追加: ソート・フィルター機能
  getSortedTasks: (filter?: SubTaskFilter) => EnhancedTask[];
  getTasksByFilter: (filter: SubTaskFilter) => EnhancedTask[];
  getTasksByPriority: (priority: PriorityLevel) => EnhancedTask[];
  getOverdueTasks: () => EnhancedTask[];
  getTasksDueToday: () => EnhancedTask[];
  getTasksDueSoon: (days?: number) => EnhancedTask[];
  
  // ユーティリティ
  getTaskById: (taskId: string) => EnhancedTask | undefined;
  getTaskAnalytics: () => TaskAnalytics;
  clearTasks: () => void;
  checkAndDeleteCompletedTasks: () => Promise<void>;
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
 * サブタスク完了時の効果音を再生
 */
const playSubTaskCompletionSound = () => {
  if (typeof window !== 'undefined') {
    try {
      const audio = new Audio("/sounds/subtask-complete.mp3");
      audio.volume = 0.7; // 少し音量を下げる
      audio.play().catch(err => console.log("オーディオ再生エラー:", err));
    } catch (error) {
      console.log("オーディオ再生エラー:", error);
    }
  }
};

/**
 * 拡張タスク管理Zustandストア（永続化対応）
 */
export const useEnhancedTaskStore = create<EnhancedTaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      loading: true,
      unsubscribe: null,
      
      // 🔥 追加: デフォルトソート設定
      sortConfig: {
        sortBy: 'priority',
        sortOrder: 'desc'
      },
      
      /**
       * 🔥 追加: ソート設定を更新
       */
      setSortConfig: (config) => {
        set({ sortConfig: config });
      },

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
          const q = query(collection(db, "enhancedTasks"), where("userId", "==", user.uid));
          
          // リアルタイムリスナーを設定
          const unsubscribeListener = onSnapshot(q, 
            (snapshot) => {
              const tasks = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                  id: doc.id,
                  ...data,
                  subTasks: data.subTasks || [],
                  subTasksCount: data.subTasks?.length || 0,
                  completedSubTasksCount: data.subTasks?.filter((st: SubTask) => st.completed).length || 0
                };
              }) as EnhancedTask[];
              
              console.log("Firestoreから拡張タスク取得成功:", tasks.length, "件");
              set({ tasks, loading: false });
              
              // タスクを読み込んだ後、完了済みで古いタスクの削除チェック
              get().checkAndDeleteCompletedTasks();
            },
            (error) => {
              console.error("Firestoreの監視エラー:", error);
              
              // エラーの詳細を確認
              if (error.code === 'permission-denied') {
                console.error("権限エラー: Firestoreのセキュリティルールを確認してください");
              } else if (error.code === 'failed-precondition') {
                console.error("インデックスエラー: Firestoreのインデックスを作成してください");
              }
              
              set({ loading: false });
              
              // エラーをフィードバックで表示
              const feedbackStore = useFeedbackStore.getState();
              feedbackStore.setMessage("タスクの読み込みに失敗しました。ページを再読み込みしてください。");
            }
          );
          
          // リスナー解除関数を保存
          set({ unsubscribe: unsubscribeListener });
          
        } catch (error) {
          console.error("タスク監視の設定に失敗:", error);
          set({ loading: false });
          
          // エラーをフィードバックで表示
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage("タスクの監視設定に失敗しました");
        }
      },

      /**
       * 新しいタスクを追加
       */
      addTask: async (text, deadline, priority = 'medium', memo = '') => {
        const user = useAuthStore.getState().user;
        if (!user) throw new Error("ユーザーがログインしていません");

        const tasks = get().tasks;
        const newTask: any = {
          text,
          completed: false,
          completedAt: null,
          userId: user.uid,
          order: tasks.length + 1,
          priority,
          createdAt: Date.now(),
          scheduledForDeletion: false,
          subTasks: [],
          subTasksCount: 0,
          completedSubTasksCount: 0
        };

        // 条件付きでフィールドを追加（undefinedを避ける）
        if (deadline && deadline.trim()) {
          newTask.deadline = deadline;
        }
        
        if (memo && memo.trim()) {
          newTask.memo = memo;
        }

        try {
          const docRef = await addDoc(collection(db, "enhancedTasks"), newTask);
          
          // フィードバック表示
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage(`タスク「${text}」を追加しました`);
          
          return docRef.id;
        } catch (error) {
          console.error("タスク追加エラー:", error);
          
          // エラーをフィードバックで表示
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage("タスクの追加に失敗しました");
          throw error;
        }
      },

      /**
       * タスクを削除
       */
      removeTask: async (taskId) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task) return;
        
        try {
          await deleteDoc(doc(db, "enhancedTasks", taskId));
          
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
       */
      toggleCompleteTask: async (taskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;

        const newCompleted = !task.completed;
        const completedAt = newCompleted ? Date.now() : null;
        
        try {
          // 完了状態、完了日時、削除予定フラグを更新
          await updateDoc(doc(db, "enhancedTasks", taskId), { 
            completed: newCompleted, 
            completedAt, 
            scheduledForDeletion: newCompleted 
          });
          
          // タスクが完了に変更された場合
          if (newCompleted) {
            // 効果音を再生
            playTaskCompletionSound();
            
            // ポイントを付与
            const pointStore = usePointStore.getState();
            const pointsAwarded = await pointStore.awardTaskCompletionPoints(taskId, task.text, task.priority);
            
            // フィードバック表示
            const feedbackStore = useFeedbackStore.getState();
            feedbackStore.setMessage(`🎉 タスク「${task.text}」を完了！ +${pointsAwarded}ポイント獲得！`);
          } else {
            // タスクが完了から未完了に変更された場合（取り消し）
            const pointStore = usePointStore.getState();
            const pointsRevoked = await pointStore.revokeTaskCompletionPoints(taskId, task.text);
            
            if (pointsRevoked > 0) {
              // フィードバック表示
              const feedbackStore = useFeedbackStore.getState();
              feedbackStore.setMessage(`📤 タスク完了を取り消しました。${pointsRevoked}ポイント減算`);
            } else {
              // フィードバック表示
              const feedbackStore = useFeedbackStore.getState();
              feedbackStore.setMessage(`📝 タスク「${task.text}」を未完了に戻しました`);
            }
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
       */
      setDeadline: async (taskId, deadline) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;

        try {
          await updateDoc(doc(db, "enhancedTasks", taskId), { deadline });
          
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
       */
      setPriority: async (taskId, priority) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;

        try {
          await updateDoc(doc(db, "enhancedTasks", taskId), { priority });
          
          // フィードバック表示
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage(`タスク「${task.text}」の優先度を「${priority}」に設定しました`);
        } catch (error) {
          console.error("優先度設定エラー:", error);
        }
      },

      /**
       * タスクのメモを更新
       */
      updateTaskMemo: async (taskId, memo) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;

        try {
          await updateDoc(doc(db, "enhancedTasks", taskId), { memo });
          
          // フィードバック表示
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage("メモを更新しました");
        } catch (error) {
          console.error("メモ更新エラー:", error);
          
          // エラーをフィードバックで表示
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage("メモの更新に失敗しました");
        }
      },

      /**
       * タスクの見積もり時間を設定
       */
      setEstimatedTime: async (taskId, minutes) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;

        try {
          await updateDoc(doc(db, "enhancedTasks", taskId), { estimatedMinutes: minutes });
          
          // フィードバック表示
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage(`見積もり時間を${minutes}分に設定しました`);
        } catch (error) {
          console.error("見積もり時間設定エラー:", error);
        }
      },

      /**
       * サブタスクを追加
       */
      addSubTask: async (data) => {
        const task = get().tasks.find((t) => t.id === data.parentTaskId);
        if (!task) throw new Error("親タスクが見つかりません");

        const newSubTask: SubTask = {
          id: SubTaskUtils.generateSubTaskId(),
          text: data.text,
          completed: false,
          order: task.subTasks.length + 1,
          createdAt: Date.now()
        };

        const updatedSubTasks = [...task.subTasks, newSubTask];

        try {
          await updateDoc(doc(db, "enhancedTasks", data.parentTaskId), {
            subTasks: updatedSubTasks,
            subTasksCount: updatedSubTasks.length,
            completedSubTasksCount: updatedSubTasks.filter(st => st.completed).length
          });
          
          // フィードバック表示
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage(`サブタスク「${data.text}」を追加しました`);
          
          return newSubTask.id;
        } catch (error) {
          console.error("サブタスク追加エラー:", error);
          throw error;
        }
      },

      /**
       * サブタスクを更新
       */
      updateSubTask: async (taskId, subTaskId, data) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;

        const updatedSubTasks = task.subTasks.map(subTask => {
          if (subTask.id === subTaskId) {
            return {
              ...subTask,
              ...data,
              ...(data.completed !== undefined && data.completed ? { completedAt: Date.now() } : {})
            };
          }
          return subTask;
        });

        try {
          await updateDoc(doc(db, "enhancedTasks", taskId), {
            subTasks: updatedSubTasks,
            completedSubTasksCount: updatedSubTasks.filter(st => st.completed).length
          });
        } catch (error) {
          console.error("サブタスク更新エラー:", error);
        }
      },

      /**
       * サブタスクを削除
       */
      removeSubTask: async (taskId, subTaskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;

        const subTask = task.subTasks.find(st => st.id === subTaskId);
        const updatedSubTasks = task.subTasks.filter(st => st.id !== subTaskId);

        try {
          await updateDoc(doc(db, "enhancedTasks", taskId), {
            subTasks: SubTaskUtils.reorderSubTasks(updatedSubTasks),
            subTasksCount: updatedSubTasks.length,
            completedSubTasksCount: updatedSubTasks.filter(st => st.completed).length
          });
          
          // フィードバック表示
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage(`サブタスク「${subTask?.text}」を削除しました`);
        } catch (error) {
          console.error("サブタスク削除エラー:", error);
        }
      },

      /**
       * サブタスクの完了状態を切り替え
       */
      toggleCompleteSubTask: async (taskId, subTaskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;

        const subTask = task.subTasks.find(st => st.id === subTaskId);
        if (!subTask) return;

        const newCompleted = !subTask.completed;
        
        // サブタスクの状態を更新
        await get().updateSubTask(taskId, subTaskId, { completed: newCompleted });
        
        if (newCompleted) {
          // サブタスク完了時の効果音
          playSubTaskCompletionSound();
          
          // 小さなポイントを付与（サブタスクなので少なめ）
          const pointStore = usePointStore.getState();
          await pointStore.addPoints('task_completion', 3, `サブタスク完了: ${subTask.text.substring(0, 15)}...`, taskId);
          
          // フィードバック表示
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage(`✅ サブタスク完了！ +3ポイント`);
        } else {
          // サブタスク完了取り消し時
          const pointStore = usePointStore.getState();
          const pointsRevoked = await pointStore.revokeSubTaskCompletionPoints(taskId, subTask.text);
          
          if (pointsRevoked > 0) {
            // フィードバック表示
            const feedbackStore = useFeedbackStore.getState();
            feedbackStore.setMessage(`📤 サブタスク取り消し: ${pointsRevoked}ポイント減算`);
          } else {
            // フィードバック表示
            const feedbackStore = useFeedbackStore.getState();
            feedbackStore.setMessage(`📝 サブタスクを未完了に戻しました`);
          }
        }
      },

      /**
       * サブタスクの順序を変更
       */
      reorderSubTasks: async (taskId, newOrder) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;

        const reorderedSubTasks = newOrder.map((subTaskId, index) => {
          const subTask = task.subTasks.find(st => st.id === subTaskId);
          if (subTask) {
            return { ...subTask, order: index + 1 };
          }
          return null;
        }).filter(Boolean) as SubTask[];

        try {
          await updateDoc(doc(db, "enhancedTasks", taskId), {
            subTasks: reorderedSubTasks
          });
        } catch (error) {
          console.error("サブタスク順序変更エラー:", error);
        }
      },

      /**
       * タスクのポモドーロタイマーを開始
       */
      startPomodoro: (taskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;
        
        // PomodoroStore の startPomodoro メソッドを呼び出し
        const pomodoroStore = usePomodoroStore.getState();
        pomodoroStore.startPomodoro(taskId);
      },

      /**
       * 🔥 追加: ソートされたタスクを取得
       */
      getSortedTasks: (filter) => {
        const { tasks, sortConfig } = get();
        
        // フィルター適用
        let filteredTasks = tasks;
        if (filter) {
          filteredTasks = get().getTasksByFilter(filter);
        }
        
        // ソート適用
        return TaskUtils.sortTasks(filteredTasks, sortConfig);
      },

      /**
       * フィルター条件でタスクを取得
       */
      getTasksByFilter: (filter) => {
        const tasks = get().tasks;
        switch (filter) {
          case 'active':
            return tasks.filter(task => !task.completed);
          case 'completed':
            return tasks.filter(task => task.completed);
          case 'all':
          default:
            return tasks;
        }
      },

      /**
       * 🔥 追加: 優先度でタスクを取得
       */
      getTasksByPriority: (priority) => {
        return get().tasks.filter(task => task.priority === priority);
      },

      /**
       * 🔥 追加: 期限切れタスクを取得
       */
      getOverdueTasks: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().tasks.filter(task => 
          !task.completed && 
          task.deadline && 
          task.deadline < today
        );
      },

      /**
       * 🔥 追加: 今日が期限のタスクを取得
       */
      getTasksDueToday: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().tasks.filter(task => 
          !task.completed && 
          task.deadline === today
        );
      },

      /**
       * 🔥 追加: 期限間近のタスクを取得
       */
      getTasksDueSoon: (days = 3) => {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);
        
        const todayStr = today.toISOString().split('T')[0];
        const futureDateStr = futureDate.toISOString().split('T')[0];
        
        return get().tasks.filter(task => 
          !task.completed && 
          task.deadline && 
          task.deadline >= todayStr && 
          task.deadline <= futureDateStr
        );
      },

      /**
       * IDでタスクを取得
       */
      getTaskById: (taskId) => {
        return get().tasks.find(task => task.id === taskId);
      },

      /**
       * タスクの分析情報を取得
       */
      getTaskAnalytics: () => {
        const tasks = get().tasks;
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.completed).length;
        const totalSubTasks = tasks.reduce((sum, t) => sum + t.subTasks.length, 0);
        const completedSubTasks = tasks.reduce((sum, t) => sum + t.subTasks.filter(st => st.completed).length, 0);
        const tasksWithMemo = tasks.filter(t => t.memo && t.memo.length > 0).length;
        const tasksWithSubTasks = tasks.filter(t => t.subTasks.length > 0).length;
        const estimatedTotalMinutes = tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
        const actualTotalMinutes = tasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0);

        return {
          totalTasks,
          completedTasks,
          totalSubTasks,
          completedSubTasks,
          averageSubTasksPerTask: totalTasks > 0 ? totalSubTasks / totalTasks : 0,
          tasksWithMemo,
          tasksWithSubTasks,
          estimatedTotalMinutes,
          actualTotalMinutes
        };
      },

      /**
       * タスクリストをクリア
       */
      clearTasks: () => {
        const { unsubscribe } = get();
        if (unsubscribe) {
          unsubscribe();
        }
        
        set({ tasks: [], unsubscribe: null });
      },

      /**
       * 完了から1週間経過したタスクを削除する
       */
      checkAndDeleteCompletedTasks: async () => {
        const tasks = get().tasks;
        const now = Date.now();
        const tasksToDelete = tasks.filter(task => {
          return task.completed && 
                 task.completedAt && 
                 (now - task.completedAt > ONE_WEEK_MS) &&
                 task.scheduledForDeletion;
        });
        
        if (tasksToDelete.length === 0) return;
        
        try {
          const batch = writeBatch(db);
          tasksToDelete.forEach(task => {
            const taskRef = doc(db, "enhancedTasks", task.id);
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
    }),
    {
      name: "enhanced-task-storage", // ローカルストレージのキー名
      partialize: (state) => ({
        sortConfig: state.sortConfig // ソート設定のみ永続化
      })
    }
  )
);

// アプリ起動時に定期的なタスクチェック処理をセットアップ
if (typeof window !== 'undefined') {
  // 1時間ごとに自動削除チェックを実行
  setInterval(() => {
    const { checkAndDeleteCompletedTasks } = useEnhancedTaskStore.getState();
    const user = useAuthStore.getState().user;
    
    if (user) {
      checkAndDeleteCompletedTasks();
    }
  }, 60 * 60 * 1000); // 1時間ごと
}