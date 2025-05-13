/**
 * ポイント追加処理の修正版
 * Firestoreエラー対策と認証トークン更新機能を統合
 * 重複処理防止機能を追加
 */

import { db, auth } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { useFeedbackStore } from "@/store/feedbackStore";
import { forceTokenRefresh } from "@/lib/authTokenRefresh";

// 処理中のポイント追加を追跡
const processingPoints = new Set<string>();

/**
 * ポイントを追加する（エラー処理強化版 + 重複防止）
 * @param userId ユーザーID
 * @param points 追加するポイント量
 * @param description 説明（省略時は「タスク完了」）
 * @param isHidden ポイント数を表示するかどうか（デフォルトは表示する）
 * @returns 成功したかどうか
 */
export const addPointsSafely = async (
  userId: string,
  points: number,
  description: string = "タスク完了",
  isHidden: boolean = false
): Promise<boolean> => {
  // 重複処理防止用のキーを生成
  const processKey = `${userId}_${points}_${description}_${Date.now()}`;
  
  // 既に処理中かチェック
  if (processingPoints.has(processKey)) {
    console.log("ポイント追加: 既に処理中です", processKey);
    return false;
  }
  
  // 処理開始をマーク
  processingPoints.add(processKey);
  
  try {
    // 負の値は処理しない
    if (points <= 0) {
      console.error("ポイント追加: 無効なポイント値（0以下）");
      return false;
    }

    // 認証状態を確認
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("ポイント追加: ユーザーがログインしていません");
      
      // フィードバック表示
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage("ログイン状態が変更されました。再ログインしてください。");
      
      return false;
    }
    
    // 認証ユーザーとポイント追加対象ユーザーが一致するか確認
    if (currentUser.uid !== userId) {
      console.error("ポイント追加: ユーザーIDが一致しません");
      return false;
    }
    
    // 同じポイント付与が既に存在するかチェック（重複防止）
    const recentPointsQuery = query(
      collection(db, "pointHistory"),
      where("userId", "==", userId),
      where("points", "==", points),
      where("description", "==", description)
    );
    
    const recentSnapshot = await getDocs(recentPointsQuery);
    const now = Date.now();
    
    // 過去1分以内に同じポイント付与があるかチェック
    const recentDuplicate = recentSnapshot.docs.find(doc => {
      const data = doc.data();
      return (now - (data.timestamp || 0)) < 60000; // 1分 = 60,000ミリ秒
    });
    
    if (recentDuplicate) {
      console.log("ポイント追加: 過去1分以内に同じポイント付与が存在します", processKey);
      return false;
    }
    
    console.log(`ポイント追加開始: ${points}ポイント, 説明: ${description}`);
    
    // 新しいポイント履歴を作成
    const newHistory = {
      userId: userId,
      points: points,
      description,
      timestamp: Date.now(),
      isHidden
    };
    
    // Firestoreに保存
    const docRef = await addDoc(collection(db, "pointHistory"), newHistory);
    console.log(`ポイント履歴保存完了: ドキュメントID ${docRef.id}`);
    
    // フィードバック表示
    const feedbackStore = useFeedbackStore.getState();
    if (isHidden) {
      feedbackStore.setMessage(`ボーナスポイントを獲得しました！（${description}）`);
    } else {
      feedbackStore.setMessage(`+${points} ポイントを獲得しました！（${description}）`);
    }
    
    return true;
  } catch (error: any) {
    // エラーコードを確認
    if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
      console.error("ポイント追加権限エラー:", error);
      
      // 認証トークンを更新して再試行
      const refreshed = await forceTokenRefresh();
      if (refreshed) {
        try {
          console.log("トークン更新後、ポイント追加を再試行...");
          
          // 新しいポイント履歴を作成
          const newHistory = {
            userId: userId,
            points: points,
            description,
            timestamp: Date.now(),
            isHidden
          };
          
          // Firestoreに保存（2回目の試行）
          const docRef = await addDoc(collection(db, "pointHistory"), newHistory);
          console.log(`ポイント履歴保存完了(再試行): ドキュメントID ${docRef.id}`);
          
          // フィードバック表示
          const feedbackStore = useFeedbackStore.getState();
          if (isHidden) {
            feedbackStore.setMessage(`ボーナスポイントを獲得しました！（${description}）`);
          } else {
            feedbackStore.setMessage(`+${points} ポイントを獲得しました！（${description}）`);
          }
          
          return true;
        } catch (retryError) {
          console.error("ポイント追加再試行エラー:", retryError);
          
          // フィードバックメッセージ
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage("ポイントの追加に失敗しました。ページを更新してください。");
          
          return false;
        }
      } else {
        // トークン更新に失敗した場合
        const feedbackStore = useFeedbackStore.getState();
        feedbackStore.setMessage("ログイン状態を確認できません。再ログインしてください。");
        return false;
      }
    }
    
    // その他のエラー
    console.error("ポイント追加エラー:", error);
    
    // フィードバックメッセージ
    const feedbackStore = useFeedbackStore.getState();
    feedbackStore.setMessage("ポイントの追加に失敗しました。");
    
    return false;
  } finally {
    // 処理完了をマーク
    processingPoints.delete(processKey);
  }
};