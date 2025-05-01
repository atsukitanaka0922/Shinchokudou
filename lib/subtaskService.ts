/**
 * サブタスク Firestore サービス
 * 
 * サブタスクのFirestore操作を抽象化するサービスモジュール
 * サブタスクの作成、更新、削除などの操作を提供
 */

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
  orderBy,
  Timestamp 
} from "firebase/firestore";
import { SubTask } from "@/store/taskStore";

/**
 * サブタスクをFirestoreに追加
 * @param parentId 親タスクのID
 * @param text サブタスクのテキスト
 * @returns 作成されたサブタスクの情報
 */
export const createSubTask = async (parentId: string, text: string): Promise<SubTask> => {
  try {
    const newSubTask = {
      text,
      completed: false,
      parentId,
      createdAt: Date.now()
    };
    
    const docRef = await addDoc(collection(db, "subTasks"), newSubTask);
    return { id: docRef.id, ...newSubTask };
  } catch (error) {
    console.error("サブタスク作成エラー:", error);
    throw new Error("サブタスクの作成に失敗しました");
  }
};

/**
 * 親タスクIDに関連するすべてのサブタスクを取得
 * @param parentId 親タスクのID
 * @returns サブタスクの配列
 */
export const getSubTasksByParentId = async (parentId: string): Promise<SubTask[]> => {
  try {
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
    console.error("サブタスク取得エラー:", error);
    throw new Error("サブタスクの取得に失敗しました");
  }
};

/**
 * サブタスクの完了状態を更新
 * @param subTaskId サブタスクのID
 * @param completed 完了状態
 */
export const updateSubTaskCompletion = async (subTaskId: string, completed: boolean): Promise<void> => {
  try {
    await updateDoc(doc(db, "subTasks", subTaskId), { completed });
  } catch (error) {
    console.error("サブタスク更新エラー:", error);
    throw new Error("サブタスクの更新に失敗しました");
  }
};

/**
 * サブタスクを削除
 * @param subTaskId サブタスクのID
 */
export const deleteSubTask = async (subTaskId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "subTasks", subTaskId));
  } catch (error) {
    console.error("サブタスク削除エラー:", error);
    throw new Error("サブタスクの削除に失敗しました");
  }
};

/**
 * 親タスクに関連するすべてのサブタスクを削除
 * @param parentId 親タスクのID
 */
export const deleteAllSubTasksByParentId = async (parentId: string): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    // サブタスクを検索
    const subTasksQuery = query(
      collection(db, "subTasks"),
      where("parentId", "==", parentId)
    );
    
    const snapshot = await getDocs(subTasksQuery);
    
    // 一括削除
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  } catch (error) {
    console.error("サブタスク一括削除エラー:", error);
    throw new Error("サブタスクの一括削除に失敗しました");
  }
};

/**
 * 親タスクに関連するすべてのサブタスクを一括で完了にする
 * @param parentId 親タスクのID
 */
export const completeAllSubTasksByParentId = async (parentId: string): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    // サブタスクを検索
    const subTasksQuery = query(
      collection(db, "subTasks"),
      where("parentId", "==", parentId),
      where("completed", "==", false)
    );
    
    const snapshot = await getDocs(subTasksQuery);
    
    // 一括更新
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { completed: true });
    });
    
    await batch.commit();
  } catch (error) {
    console.error("サブタスク一括完了エラー:", error);
    throw new Error("サブタスクの一括完了に失敗しました");
  }
};