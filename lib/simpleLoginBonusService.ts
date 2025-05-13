/**
 * シンプルログインボーナスサービス
 * 
 * ログイン時に自動的にポイントを付与する
 * 連続ログイン日数に応じてボーナスポイントが増加する
 */

import { db, auth } from "@/lib/firebase";
import { 
  doc, 
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  collection,
  orderBy,
  limit
} from "firebase/firestore";
import { usePointsStore } from "@/store/pointsStore";
import { useFeedbackStore } from "@/store/feedbackStore";
import { forceTokenRefresh } from "@/lib/authTokenRefresh";

/**
 * 今日の日付を取得（YYYY-MM-DD形式）
 */
export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * ログイン記録の型定義
 */
interface LoginRecord {
  userId: string;
  date: string;
  timestamp: number;
  receivedBonus: boolean;
  bonusPoints: number;
  consecutiveDays: number;
}

/**
 * 連続ログイン日数に基づいたボーナスポイントを計算
 * 基本ポイント: 10pt
 * 連続ログイン日数ボーナス: +1pt/日（上限100pt）
 * 
 * @param consecutiveDays 連続ログイン日数
 * @returns ボーナスポイント
 */
const calculateLoginBonus = (consecutiveDays: number): number => {
  const basePoints = 10;
  const bonusPerDay = 1;
  const maxBonus = 100;
  
  const totalBonus = basePoints + (bonusPerDay * Math.max(0, consecutiveDays - 1));
  return Math.min(totalBonus, maxBonus);
};

/**
 * 連続ログイン日数を計算
 * @param userId ユーザーID
 * @returns 連続ログイン日数
 */
export const calculateConsecutiveDays = async (userId: string): Promise<number> => {
  try {
    const today = getTodayDate();
    
    // 過去のログイン記録を取得（日付降順）
    const loginQuery = query(
      collection(db, "loginRecords"),
      where("userId", "==", userId),
      orderBy("date", "desc"),
      limit(30) // 最新30件を取得
    );
    
    const snapshot = await getDocs(loginQuery);
    
    if (snapshot.empty) {
      return 1; // 初回ログインは1日目
    }
    
    // 日付のリストを取得（今日を除く）
    const loginDates = snapshot.docs
      .map(doc => doc.data().date)
      .filter(date => date !== today)
      .sort()
      .reverse(); // 最新から古い順
    
    // 昨日の日付を計算
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // 昨日のログインがない場合、連続ログインはリセット
    if (loginDates.length === 0 || loginDates[0] !== yesterdayStr) {
      return 1;
    }
    
    // 連続ログイン日数を計算
    let consecutiveDays = 1; // 今日分
    let checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 1); // 昨日から開始
    
    for (const loginDate of loginDates) {
      const expectedDateStr = checkDate.toISOString().split('T')[0];
      
      if (loginDate === expectedDateStr) {
        consecutiveDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
      
      // 安全のため上限を設定
      if (consecutiveDays >= 100) break;
    }
    
    return consecutiveDays;
  } catch (error) {
    console.error("連続ログイン日数計算エラー:", error);
    return 1;
  }
};

/**
 * 今日のログインボーナスを既に受け取っているかチェック
 * @param userId ユーザーID
 * @returns 受け取っているかどうか
 */
export const hasReceivedTodayBonus = async (userId: string): Promise<boolean> => {
  try {
    const today = getTodayDate();
    const docId = `${today}_${userId}`;
    
    const loginRecord = await getDoc(doc(db, "loginRecords", docId));
    return loginRecord.exists() && loginRecord.data().receivedBonus === true;
  } catch (error) {
    console.error("ログインボーナスチェックエラー:", error);
    return false;
  }
};

/**
 * ログインボーナスを付与する
 * @param userId ユーザーID
 * @returns 付与されたポイントと連続日数の情報
 */
export const giveLoginBonus = async (userId: string): Promise<{
  points: number;
  consecutiveDays: number;
  isNewRecord: boolean;
} | null> => {
  try {
    // 認証確認
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      console.error("認証エラー: ユーザーIDが一致しません");
      return null;
    }
    
    // 既に受け取っているかチェック
    const alreadyReceived = await hasReceivedTodayBonus(userId);
    if (alreadyReceived) {
      console.log("今日のログインボーナスは既に受け取り済みです");
      return null;
    }
    
    // 連続ログイン日数を計算
    const consecutiveDays = await calculateConsecutiveDays(userId);
    
    // ボーナスポイントを計算
    const bonusPoints = calculateLoginBonus(consecutiveDays);
    
    // ログイン記録を保存
    const today = getTodayDate();
    const docId = `${today}_${userId}`;
    const loginRecord: LoginRecord = {
      userId,
      date: today,
      timestamp: Date.now(),
      receivedBonus: true,
      bonusPoints,
      consecutiveDays
    };
    
    try {
      await setDoc(doc(db, "loginRecords", docId), loginRecord);
      console.log("ログイン記録を保存:", docId);
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        await forceTokenRefresh();
        await setDoc(doc(db, "loginRecords", docId), loginRecord);
        console.log("トークン更新後、ログイン記録を保存:", docId);
      } else {
        throw error;
      }
    }
    
    // ポイントを付与
    const pointsStore = usePointsStore.getState();
    const description = consecutiveDays > 1 
      ? `ログインボーナス（${consecutiveDays}日連続！）`
      : 'ログインボーナス';
    
    await pointsStore.addPoints(bonusPoints, description, false);
    
    // フィードバック表示
    const feedbackStore = useFeedbackStore.getState();
    const isNewRecord = consecutiveDays > 1 && consecutiveDays % 10 === 0; // 10の倍数で新記録とする
    
    if (isNewRecord) {
      feedbackStore.setMessage(`🎉 ${consecutiveDays}日連続ログイン達成！新記録です！+${bonusPoints}ポイント`);
    } else if (consecutiveDays > 1) {
      feedbackStore.setMessage(`✨ ${consecutiveDays}日連続ログイン！+${bonusPoints}ポイント獲得`);
    } else {
      feedbackStore.setMessage(`🔥 ログインボーナス！+${bonusPoints}ポイント獲得`);
    }
    
    return {
      points: bonusPoints,
      consecutiveDays,
      isNewRecord
    };
  } catch (error) {
    console.error("ログインボーナス付与エラー:", error);
    
    const feedbackStore = useFeedbackStore.getState();
    feedbackStore.setMessage("ログインボーナスの付与に失敗しました");
    
    return null;
  }
};

/**
 * ユーザーの統計情報を取得
 * @param userId ユーザーID
 * @returns 統計情報
 */
export const getLoginStats = async (userId: string): Promise<{
  totalLogins: number;
  currentStreak: number;
  longestStreak: number;
  totalBonusPoints: number;
} | null> => {
  try {
    const query_ = query(
      collection(db, "loginRecords"),
      where("userId", "==", userId),
      orderBy("date", "desc")
    );
    
    const snapshot = await getDocs(query_);
    const records = snapshot.docs.map(doc => doc.data() as LoginRecord);
    
    if (records.length === 0) {
      return {
        totalLogins: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalBonusPoints: 0
      };
    }
    
    // 統計を計算
    const totalLogins = records.length;
    const currentStreak = await calculateConsecutiveDays(userId);
    let longestStreak = 0;
    let currentTempStreak = 0;
    let totalBonusPoints = 0;
    
    // 最長ストリークを計算
    const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));
    let checkDate = new Date(sortedRecords[0].date);
    
    for (const record of sortedRecords) {
      const recordDate = new Date(record.date);
      const diff = Math.abs(recordDate.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diff <= 1) {
        currentTempStreak++;
        longestStreak = Math.max(longestStreak, currentTempStreak);
      } else {
        currentTempStreak = 1;
      }
      
      checkDate = recordDate;
      totalBonusPoints += record.bonusPoints || 0;
    }
    
    return {
      totalLogins,
      currentStreak,
      longestStreak,
      totalBonusPoints
    };
  } catch (error) {
    console.error("統計取得エラー:", error);
    return null;
  }
};