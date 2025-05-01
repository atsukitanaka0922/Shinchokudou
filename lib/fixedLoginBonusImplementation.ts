/**
 * ログインボーナスを付与する修正版
 * Firestoreエラー対策と認証トークン更新機能を統合
 */
import { addPointsSafely } from "./fixedPointHandler";
import { forceTokenRefresh } from "./authTokenRefresh";
import { useFeedbackStore } from "@/store/feedbackStore";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

/**
 * ログインボーナスを付与する（エラー処理強化版）
 * @param userId ユーザーID
 * @returns ボーナス情報
 */
export const giveLoginBonusSafely = async (userId: string): Promise<{
  rouletteBonus: any;
  consecutiveDays: number;
  consecutiveBonus: number;
  totalBonus: number;
} | null> => {
  try {
    // 認証状態を確認
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error("認証エラー: ユーザーIDが一致しません");
    }
    
    // ルーレットを回す
    const rouletteBonus = spinRoulette();
    
    // 連続ログイン日数を計算（認証エラー対策版）
    const consecutiveDays = await calculateConsecutiveDaysSafely(userId);
    
    // 連続ログイン特典があるかチェック
    let consecutiveBonus = 0;
    for (const [days, bonus] of Object.entries(CONSECUTIVE_LOGIN_BONUS)) {
      if (consecutiveDays === parseInt(days)) {
        consecutiveBonus = bonus;
        break;
      }
    }
    
    // 合計ボーナスを計算
    const totalBonus = rouletteBonus.points + consecutiveBonus;
    
    // ログイン記録を保存する（ポイント付与の前に記録）
    const today = getTodayDate();
    const loginRecord = {
      userId,
      date: today,
      timestamp: Date.now(),
      receivedBonus: true,
      bonusPoints: totalBonus,
      consecutiveDays
    };
    
    // ドキュメントIDを日付+ユーザーIDにする（重複防止）
    const docId = `${today}_${userId}`;
    
    try {
      // Firestoreにログイン記録を保存
      await setDoc(doc(db, "loginRecords", docId), loginRecord);
      console.log("ログイン記録を保存しました:", docId);
    } catch (error) {
      if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
        // 権限エラーの場合、トークンを更新して再試行
        await forceTokenRefresh();
        await setDoc(doc(db, "loginRecords", docId), loginRecord);
        console.log("トークン更新後、ログイン記録を保存しました:", docId);
      } else {
        throw error; // その他のエラーは上位で処理
      }
    }
    
    // ポイントを付与（安全な方法で）
    const pointsAdded = await addPointsSafely(
      userId,
      totalBonus,
      consecutiveBonus > 0 
        ? `ログインボーナス（${consecutiveDays}日連続ログイン！）` 
        : 'ログインボーナス',
      true // ポイント数を表示しない（サプライズ要素）
    );
    
    if (!pointsAdded) {
      console.warn("ポイント付与に失敗しましたが、ログイン記録は保存されました");
    }
    
    // フィードバックを表示
    const feedbackStore = useFeedbackStore.getState();
    if (consecutiveBonus > 0) {
      feedbackStore.setMessage(`${consecutiveDays}日連続ログイン達成！ボーナスポイントを獲得しました！`);
    }
    
    return {
      rouletteBonus,
      consecutiveDays,
      consecutiveBonus,
      totalBonus
    };
  } catch (error) {
    // エラーをより詳細に処理
    console.error("ログインボーナス付与エラー詳細:", error);
    
    // フィードバック表示
    const feedbackStore = useFeedbackStore.getState();
    feedbackStore.setMessage("ログインボーナスの付与に失敗しました。ページを更新してください。");
    
    return null;
  }
};