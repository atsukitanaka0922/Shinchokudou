/**
 * サブタスク Firestore サービス
 * 
 * サブタスクのFirestore操作を抽象化するサービスモジュール
 * サブタスクの作成、更新、削除などの操作を提供
 */

import { db, auth } from "@/lib/firebase";
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
  orderBy,
  getDoc
} from "firebase/firestore";
import { SubTask } from "@/store/taskStore";
import { useFeedbackStore } from "@/store/feedbackStore";
import { handleFirestoreError, safeFirestoreOperation } from "@/lib/firestoreErrorHandler";
import { checkAuthState } from "@/lib/authStateCheck";

/**
 * サブタスクをFirestoreに追加
 * @param parentId 親タスクのID
 * @param text サブタスクのテキスト
 * @returns 作成されたサブタスクの情報
 */
export const createSubTask = async (parentId: string, text: string): Promise<SubTask | null> => {
  try {
    // 認証状態を確認
    const currentUser = checkAuthState();
    if (!currentUser) {
      throw new Error("認証エラー: ログインしていません");
    }
    
    // 親タスクが存在するか、および現在のユーザーのものかを確認
    const parentTaskRef = doc(db, "tasks", parentId);
    const parentTaskDoc = await getDoc(parentTaskRef);
    
    if (!parentTaskDoc.exists()) {
      throw new Error("親タスクが存在しません");
    }
    
    const parentTaskData = parentTaskDoc.data();
    if (parentTaskData.userId !== currentUser.uid) {
      throw new Error("このタスクにサブタスクを追加する権限がありません");
    }
    
    const newSubTask = {
      text,
      completed: false,
      parentId,
      createdAt: Date.now()
    };
    
    // サブタスクコレクションに追加
    const docRef = await addDoc(collection(db, "subTasks"), newSubTask);
    
    // フィードバック表示
    const feedbackStore = useFeedbackStore.getState();
    feedbackStore.setMessage("サブタスクを追加しました");
    
    return { id: docRef.id, ...newSubTask };
  } catch (error) {
    // エラー処理
    handleFirestoreError(error, "サブタスクの追加に失敗しました");
    console.error("サブタスク作成エラー詳細:", error);
    return null;
  }
};

/**
 * 親タスクIDに関連するすべてのサブタスクを取得
 * @param parentId 親タスクのID
 * @returns サブタスクの配列
 */
export const getSubTasksByParentId = async (parentId: string): Promise<SubTask[]> => {
  try {
    // 認証状態を確認
    const currentUser = checkAuthState();
    if (!currentUser) {
      console.error("サブタスク取得エラー: ログインしていません");
      return [];
    }
    
    // 親タスクが現在のユーザーのものかを確認
    const parentTaskRef = doc(db, "tasks", parentId);
    const parentTaskDoc = await getDoc(parentTaskRef);
    
    if (!parentTaskDoc.exists()) {
      console.error("サブタスク取得エラー: 親タスクが存在しません");
      return [];
    }
    
    const parentTaskData = parentTaskDoc.data();
    if (parentTaskData.userId !== currentUser.uid) {
      console.error("サブタスク取得エラー: このタスクのサブタスクを取得する権限がありません");
      return [];
    }
    
    // サブタスククエリを実行
    const subTasksQuery = query(
      collection(db, "subTasks"),
      where("parentId", "==", parentId),
      orderBy("createdAt", "asc")
    );
    
    const snapshot = await getDocs(subTasksQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SubTask));
  } catch (error) {
    // エラー処理（より詳細な情報を出力）
    handleFirestoreError(error, "サブタスクの取得に失敗しました", false);
    console.error("サブタスク取得エラー詳細:", error);
    
    // エラーが発生しても空の配列を返す（アプリのクラッシュを防ぐ）
    return [];
  }
};

/**
 * サブタスクの完了状態を更新
 * @param subTaskId サブタスクのID
 * @param completed 完了状態
 */
export const updateSubTaskCompletion = async (subTaskId: string, completed: boolean): Promise<boolean> => {
  return await safeFirestoreOperation(
    async () => {
      // 認証状態を確認
      const currentUser = checkAuthState();
      if (!currentUser) {
        throw new Error("認証エラー: ログインしていません");
      }
      
      // サブタスクのデータを取得
      const subTaskRef = doc(db, "subTasks", subTaskId);
      const subTaskDoc = await getDoc(subTaskRef);
      
      if (!subTaskDoc.exists()) {
        throw new Error("サブタスクが存在しません");
      }
      
      const subTaskData = subTaskDoc.data();
      
      // 親タスクが現在のユーザーのものかを確認
      const parentTaskRef = doc(db, "tasks", subTaskData.parentId);
      const parentTaskDoc = await getDoc(parentTaskRef);
      
      if (!parentTaskDoc.exists()) {
        throw new Error("親タスクが存在しません");
      }
      
      const parentTaskData = parentTaskDoc.data();
      if (parentTaskData.userId !== currentUser.uid) {
        throw new Error("このサブタスクを更新する権限がありません");
      }
      
      // サブタスクを更新
      await updateDoc(subTaskRef, { completed });
      return true;
    },
    "サブタスクの更新に失敗しました",
    completed ? "サブタスクを完了しました" : "サブタスクを未完了に戻しました"
  );
};

/**
 * サブタスクを削除
 * @param subTaskId サブタスクのID
 */
export const deleteSubTask = async (subTaskId: string): Promise<boolean> => {
  return await safeFirestoreOperation(
    async () => {
      // 認証状態を確認
      const currentUser = checkAuthState();
      if (!currentUser) {
        throw new Error("認証エラー: ログインしていません");
      }
      
      // サブタスクのデータを取得
      const subTaskRef = doc(db, "subTasks", subTaskId);
      const subTaskDoc = await getDoc(subTaskRef);
      
      if (!subTaskDoc.exists()) {
        throw new Error("サブタスクが存在しません");
      }
      
      const subTaskData = subTaskDoc.data();
      
      // 親タスクが現在のユーザーのものかを確認
      const parentTaskRef = doc(db, "tasks", subTaskData.parentId);
      const parentTaskDoc = await getDoc(parentTaskRef);
      
      if (!parentTaskDoc.exists()) {
        throw new Error("親タスクが存在しません");
      }
      
      const parentTaskData = parentTaskDoc.data();
      if (parentTaskData.userId !== currentUser.uid) {
        throw new Error("このサブタスクを削除する権限がありません");
      }
      
      // サブタスクを削除
      await deleteDoc(subTaskRef);
      return true;
    },
    "サブタスクの削除に失敗しました",
    "サブタスクを削除しました"
  );
};

/**
 * 親タスクに関連するすべてのサブタスクを削除
 * @param parentId 親タスクのID
 */
export const deleteAllSubTasksByParentId = async (parentId: string): Promise<boolean> => {
  return await safeFirestoreOperation(
    async () => {
      // 認証状態を確認
      const currentUser = checkAuthState();
      if (!currentUser) {
        throw new Error("認証エラー: ログインしていません");
      }
      
      // 親タスクが現在のユーザーのものかを確認
      const parentTaskRef = doc(db, "tasks", parentId);
      const parentTaskDoc = await getDoc(parentTaskRef);
      
      if (parentTaskDoc.exists()) {
        const parentTaskData = parentTaskDoc.data();
        if (parentTaskData.userId !== currentUser.uid) {
          throw new Error("このタスクのサブタスクを削除する権限がありません");
        }
      }
      
      // サブタスクを検索
      const subTasksQuery = query(
        collection(db, "subTasks"),
        where("parentId", "==", parentId)
      );
      
      const snapshot = await getDocs(subTasksQuery);
      
      // サブタスクが見つからない場合は成功とみなす
      if (snapshot.empty) {
        return true;
      }
      
      // 一括削除
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      return true;
    },
    "サブタスクの一括削除に失敗しました",
    null // 成功メッセージは表示しない
  );
};

/**
 * 親タスクに関連するすべてのサブタスクを一括で完了にする
 * @param parentId 親タスクのID
 */
export const completeAllSubTasksByParentId = async (parentId: string): Promise<boolean> => {
  return await safeFirestoreOperation(
    async () => {
      // 認証状態を確認
      const currentUser = checkAuthState();
      if (!currentUser) {
        throw new Error("認証エラー: ログインしていません");
      }
      
      // 親タスクが現在のユーザーのものかを確認
      const parentTaskRef = doc(db, "tasks", parentId);
      const parentTaskDoc = await getDoc(parentTaskRef);
      
      if (!parentTaskDoc.exists()) {
        throw new Error("親タスクが存在しません");
      }
      
      const parentTaskData = parentTaskDoc.data();
      if (parentTaskData.userId !== currentUser.uid) {
        throw new Error("このタスクのサブタスクを更新する権限がありません");
      }
      
      // サブタスクを検索
      const subTasksQuery = query(
        collection(db, "subTasks"),
        where("parentId", "==", parentId),
        where("completed", "==", false)
      );
      
      const snapshot = await getDocs(subTasksQuery);
      
      // 未完了のサブタスクが見つからない場合は成功とみなす
      if (snapshot.empty) {
        return true;
      }
      
      // 一括更新
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { completed: true });
      });
      
      await batch.commit();
      return true;
    },
    "サブタスクの一括完了に失敗しました",
    "すべてのサブタスクを完了しました"
  );
};