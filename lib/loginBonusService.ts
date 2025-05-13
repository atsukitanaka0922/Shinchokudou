/**
 * ログインボーナスサービス（順序修正版）
 * 
 * UIコンポーネントとの完全な同期を実現
 * 
 * 修正内容：
 * - ROULETTE_OPTIONSの順序をLoginBonusRoulette.tsxと完全に一致させた
 * - インデックスとポイントの対応を確実に保証
 */

import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs,
  query, 
  where, 
  orderBy, 
  limit,
  setDoc
} from "firebase/firestore";
import { usePointsStore } from "@/store/pointsStore";
import { useFeedbackStore } from "@/store/feedbackStore";
import { handleFirestoreError, safeFirestoreOperation } from "@/lib/firestoreErrorHandler";
import { checkAuthState } from "@/lib/authStateCheck";

/**
 * ログインボーナスの種類と確率
 */
interface BonusOption {
  points: number;      // ポイント数
  label: string;       // 表示名
  probability: number; // 出現確率（0～100の数値）
  color: string;       // 表示色（CSS色名またはHEX）
}

/**
 * ログイン記録データの型
 */
interface LoginRecord {
  userId: string;                 // ユーザーID
  date: string;                   // ログインした日付（YYYY-MM-DD形式）
  timestamp: number;              // ログインした時刻のタイムスタンプ
  receivedBonus: boolean;         // ボーナスを受け取ったかどうか
  bonusPoints?: number;           // 受け取ったボーナスポイント
  consecutiveDays?: number;       // 連続ログイン日数
}

/**
 * ルーレットオプションの設定（LoginBonusRoulette.tsxと完全同期）
 * 重要: この順序を変更する場合は、必ずLoginBonusRoulette.tsxも同様に変更すること
 */
const ROULETTE_OPTIONS: BonusOption[] = [
  { points: 10, label: '10', probability: 30, color: '#FFE0E6' },    // インデックス 0
  { points: 20, label: '20', probability: 30, color: '#E6F7FF' },    // インデックス 1
  { points: 30, label: '30', probability: 20, color: '#F6FFED' },    // インデックス 2
  { points: 50, label: '50', probability: 15, color: '#FFF7E6' },    // インデックス 3
  { points: 100, label: '100', probability: 5, color: '#FFF1F0' }    // インデックス 4
];

/**
 * 連続ログイン特典の設定値
 */
export const CONSECUTIVE_LOGIN_BONUS = {
  3: 15,   // 3日連続: 15ポイント追加
  7: 50,   // 7日連続: 50ポイント追加
  14: 100, // 14日連続: 100ポイント追加
  30: 300  // 30日連続: 300ポイント追加
};

/**
 * 今日の日付を取得（YYYY-MM-DD形式）
 */
export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * ランダムなボーナスを確率に基づいて選択（完全同期版）
 * @returns 選択されたボーナスオプションとそのインデックス
 */
export const spinRouletteWithIndex = (): { option: BonusOption, index: number } => {
  // 乱数を生成（0～100）
  const random = Math.random() * 100;
  
  console.log('=== spinRouletteWithIndex ログ ===');
  console.log('生成された乱数:', random);
  console.log('ROULETTE_OPTIONS配列:', ROULETTE_OPTIONS);
  
  // 累積確率を計算してボーナスを選択
  let cumulativeProbability = 0;
  
  for (let i = 0; i < ROULETTE_OPTIONS.length; i++) {
    cumulativeProbability += ROULETTE_OPTIONS[i].probability;
    console.log(`インデックス ${i}: ${ROULETTE_OPTIONS[i].points}pt, 累積確率: ${cumulativeProbability}`);
    
    if (random <= cumulativeProbability) {
      console.log(`選択結果 - インデックス: ${i}, ポイント: ${ROULETTE_OPTIONS[i].points}`);
      console.log('選択されたオプション:', ROULETTE_OPTIONS[i]);
      console.log('=== spinRouletteWithIndex 終了 ===');
      return { option: ROULETTE_OPTIONS[i], index: i };
    }
  }
  
  // 万が一の場合のフォールバック
  console.error('WARNING: フォールバック - インデックス 0が選択されました');
  console.log('=== spinRouletteWithIndex 終了（フォールバック） ===');
  return { option: ROULETTE_OPTIONS[0], index: 0 };
};

/**
 * 既存のspinRoulette関数（互換性のために残しておく）
 * @returns 選択されたボーナスオプション
 */
export const spinRoulette = (): BonusOption => {
  return spinRouletteWithIndex().option;
};

/**
 * ユーザーが今日すでにログインボーナスを受け取ったかチェック
 * @param userId ユーザーID
 * @returns ボーナスを受け取ったかどうか
 */
export const hasReceivedTodayBonus = async (userId: string): Promise<boolean> => {
  try {
    const today = getTodayDate();
    
    const loginQuery = query(
      collection(db, "loginRecords"),
      where("userId", "==", userId),
      where("date", "==", today)
    );
    
    const snapshot = await getDocs(loginQuery);
    
    // 今日のログイン記録があり、ボーナスを受け取っている場合
    return !snapshot.empty && snapshot.docs[0].data().receivedBonus === true;
  } catch (error) {
    console.error("ログインボーナスチェックエラー:", error);
    return false;
  }
};

/**
 * 連続ログイン日数を計算（エラー処理強化版）
 * @param userId ユーザーID
 * @returns 連続ログイン日数
 */
export const calculateConsecutiveDaysSafely = async (userId: string): Promise<number> => {
  try {
    // 今日の日付
    const today = getTodayDate();
    
    // 認証状態確認
    if (!userId) {
      console.error("連続ログイン計算: ユーザーIDがありません");
      return 1;
    }
    
    // 過去のログイン記録を取得
    const loginQuery = query(
      collection(db, "loginRecords"),
      where("userId", "==", userId)
    );
    
    const snapshot = await getDocs(loginQuery);
    
    // ログイン記録がない場合は連続日数は1（今日が初日）
    if (snapshot.empty) {
      return 1;
    }
    
    // 日付でソート（降順）
    const loginRecords = snapshot.docs
      .map(doc => ({
        date: doc.data().date,
        timestamp: doc.data().timestamp || 0
      }))
      .sort((a, b) => {
        // 日付の降順でソート
        if (a.date > b.date) return -1;
        if (a.date < b.date) return 1;
        // 同じ日付の場合はタイムスタンプの降順でソート
        return b.timestamp - a.timestamp;
      });
    
    // 今日を除く過去のログイン記録
    const previousLoginDates = loginRecords
      .map(record => record.date)
      .filter(date => date !== today);
    
    // 昨日の日付
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    console.log("連続ログイン計算: 昨日=", yesterdayStr, "最新ログイン=", previousLoginDates[0] || "なし");
    
    // 昨日のログイン記録がなければ連続ログインはリセット
    if (previousLoginDates.length === 0 || previousLoginDates[0] !== yesterdayStr) {
      return 1;
    }
    
    // 連続ログイン日数を計算
    let consecutiveDays = 1; // 今日で1日
    
    for (let i = 0; i < previousLoginDates.length - 1; i++) {
      const currentDate = new Date(previousLoginDates[i]);
      const nextDate = new Date(previousLoginDates[i + 1]);
      
      // 日付の差が1日であるか確認
      const diffTime = currentDate.getTime() - nextDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      if (Math.round(diffDays) === 1) {
        consecutiveDays++;
      } else {
        break;
      }
    }
    
    console.log("連続ログイン日数:", consecutiveDays);
    return consecutiveDays;
  } catch (error) {
    // エラー発生時は詳細をログ出力
    console.error("連続ログイン計算エラー詳細:", error);
    return 1;
  }
};

/**
 * ログインボーナスを付与する
 * @param userId ユーザーID
 * @returns ボーナス情報
 */
export const giveLoginBonus = async (userId: string): Promise<{
  rouletteBonus: BonusOption;
  consecutiveDays: number;
  consecutiveBonus: number;
  totalBonus: number;
}> => {
  try {
    // すでに今日のボーナスを受け取っていないか確認
    const alreadyReceived = await hasReceivedTodayBonus(userId);
    if (alreadyReceived) {
      throw new Error("今日のログインボーナスはすでに受け取っています");
    }
    
    // ルーレットを回す
    const rouletteBonus = spinRoulette();
    
    // 連続ログイン日数を計算
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
    
    // ポイントを付与
    const pointsStore = usePointsStore.getState();
    await pointsStore.addPoints(
      totalBonus,
      consecutiveBonus > 0 
        ? `ログインボーナス（${consecutiveDays}日連続ログイン！）` 
        : 'ログインボーナス',
      true // ポイント数を表示しない（サプライズ要素）
    );
    
    // ログイン記録を保存
    const today = getTodayDate();
    const loginRecord: LoginRecord = {
      userId,
      date: today,
      timestamp: Date.now(),
      receivedBonus: true,
      bonusPoints: totalBonus,
      consecutiveDays
    };
    
    // ドキュメントIDを日付+ユーザーIDにする（重複防止）
    const docId = `${today}_${userId}`;
    await setDoc(doc(db, "loginRecords", docId), loginRecord);
    
    return {
      rouletteBonus,
      consecutiveDays,
      consecutiveBonus,
      totalBonus
    };
  } catch (error) {
    console.error("ログインボーナス付与エラー:", error);
    throw error;
  }
};

/**
 * ルーレットオプションを取得
 * @returns ルーレットのオプション配列
 */
export const getRouletteOptions = (): BonusOption[] => {
  return ROULETTE_OPTIONS;
};

/**
 * デバッグ用: インデックスとポイントの対応を確認
 */
export const debugIndexMapping = () => {
  console.log('=== デバッグ: インデックス-ポイント対応表 ===');
  ROULETTE_OPTIONS.forEach((option, index) => {
    console.log(`インデックス ${index}: ${option.points}pt`);
  });
  console.log('====================================');
};