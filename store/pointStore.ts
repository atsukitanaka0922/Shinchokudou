/**
 * ポイント管理ストア
 * 
 * ユーザーのポイント獲得・消費・ログインボーナスを管理するZustandストア
 * Firestoreとの連携により、ポイントデータの永続化を提供
 * v1.5.0: タスク完了取り消し時のポイント減算機能を追加
 */

import { create } from "zustand";
import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  increment,
  query,
  where,
  getDocs,
  addDoc
} from "firebase/firestore";
import { useAuthStore } from "@/store/auth";
import { useFeedbackStore } from "@/store/feedbackStore";
import { PriorityLevel } from "@/lib/aiPriorityAssignment";
import { loginBonusManager } from "@/lib/loginBonusSingleton";

/**
 * ポイント履歴のインターフェース
 */
export interface PointHistory {
  id?: string;
  userId: string;
  type: 'task_completion' | 'login_bonus' | 'daily_bonus' | 'streak_bonus';
  points: number;               // 正の値は獲得、負の値は減算
  description: string;
  taskId?: string;              // タスク完了の場合のタスクID
  date: string;                 // YYYY-MM-DD形式
  timestamp: number;            // タイムスタンプ
}

/**
 * ユーザーポイントデータのインターフェース
 */
export interface UserPoints {
  userId: string;
  totalPoints: number;           // 総獲得ポイント（生涯実績、減算されない）
  currentPoints: number;         // 現在のポイント残高（減算される）
  lastLoginDate?: string;        // 最後のログイン日（YYYY-MM-DD）
  loginStreak: number;          // 連続ログイン日数
  maxLoginStreak: number;       // 最大連続ログイン記録
  lastLoginBonusDate?: string;  // 最後にログインボーナスを受け取った日
}

/**
 * ポイントストアの状態とアクション定義
 */
interface PointState {
  userPoints: UserPoints | null;
  pointHistory: PointHistory[];
  loading: boolean;
  
  // データ取得
  loadUserPoints: () => Promise<void>;
  loadPointHistory: () => Promise<void>;
  
  // ポイント操作
  addPoints: (type: PointHistory['type'], points: number, description: string, taskId?: string) => Promise<void>;
  removePoints: (type: PointHistory['type'], points: number, description: string, taskId?: string) => Promise<void>;
  
  // タスク完了時のポイント付与
  awardTaskCompletionPoints: (taskId: string, taskText: string, priority: PriorityLevel) => Promise<number>;
  
  // タスク完了取り消し時のポイント減算
  revokeTaskCompletionPoints: (taskId: string, taskText: string) => Promise<number>;
  
  // サブタスク完了取り消し時のポイント減算
  revokeSubTaskCompletionPoints: (taskId: string, subTaskText: string) => Promise<number>;
  
  // ログインボーナス
  checkAndAwardLoginBonus: () => Promise<void>;
  
  // 統計取得
  getTodayPoints: () => number;
  getWeeklyPoints: () => number;
  getMonthlyPoints: () => number;
}

/**
 * 優先度に応じたポイント計算
 */
const getPointsForPriority = (priority: PriorityLevel): number => {
  switch (priority) {
    case 'high': return 15;
    case 'medium': return 10;
    case 'low': return 5;
    default: return 10;
  }
};

/**
 * 連続ログイン日数に応じたボーナスポイント計算
 */
const getLoginBonusPoints = (streak: number): number => {
  if (streak >= 30) return 50;  // 30日以上
  if (streak >= 14) return 30;  // 2週間以上
  if (streak >= 7) return 20;   // 1週間以上
  if (streak >= 3) return 15;   // 3日以上
  return 10; // 基本ボーナス
};

/**
 * ポイント管理Zustandストア
 */
export const usePointStore = create<PointState>((set, get) => ({
  userPoints: null,
  pointHistory: [],
  loading: false,

  /**
   * ユーザーのポイントデータを読み込む
   */
  loadUserPoints: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      console.log("ユーザーがログインしていないため、ポイントデータを取得できません");
      set({ userPoints: null, loading: false });
      return;
    }

    // 重複読み込み防止
    if (get().loading) {
      console.log("既にポイントデータを読み込み中です");
      return;
    }

    set({ loading: true });
    
    try {
      const userPointsRef = doc(db, "userPoints", user.uid);
      const userPointsSnap = await getDoc(userPointsRef);
      
      if (userPointsSnap.exists()) {
        const data = userPointsSnap.data() as UserPoints;
        set({ userPoints: data });
        console.log("ユーザーポイントデータを取得:", data);
      } else {
        // 初回ユーザーの場合、初期データを作成
        console.log("初回ユーザーのため、初期ポイントデータを作成");
        const initialPoints: UserPoints = {
          userId: user.uid,
          totalPoints: 0,
          currentPoints: 0,
          loginStreak: 0,
          maxLoginStreak: 0
        };
        
        await setDoc(userPointsRef, initialPoints);
        set({ userPoints: initialPoints });
        console.log("初期ポイントデータを作成:", initialPoints);
      }
    } catch (error) {
      console.error("ポイントデータの読み込みエラー:", error);
      
      // エラー時はデフォルトデータを設定
      const defaultPoints: UserPoints = {
        userId: user.uid,
        totalPoints: 0,
        currentPoints: 0,
        loginStreak: 0,
        maxLoginStreak: 0
      };
      set({ userPoints: defaultPoints });
    } finally {
      set({ loading: false });
    }
  },

  /**
   * ポイント履歴を読み込む
   */
  loadPointHistory: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      console.log("ユーザーがログインしていないため、ポイント履歴を取得できません");
      set({ pointHistory: [] });
      return;
    }

    try {
      // orderByを使わないクエリに変更（インデックス不要）
      const historyQuery = query(
        collection(db, "pointHistory"),
        where("userId", "==", user.uid)
      );
      
      const snapshot = await getDocs(historyQuery);
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PointHistory[];
      
      // クライアントサイドでソート
      history.sort((a, b) => b.timestamp - a.timestamp);
      
      // 最大50件に制限
      const limitedHistory = history.slice(0, 50);
      
      set({ pointHistory: limitedHistory });
      console.log("ポイント履歴を取得:", limitedHistory.length, "件");
    } catch (error) {
      console.error("ポイント履歴の読み込みエラー:", error);
      set({ pointHistory: [] });
    }
  },

  /**
   * ポイントを追加する
   */
  addPoints: async (type, points, description, taskId) => {
    const user = useAuthStore.getState().user;
    if (!user || points <= 0) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // ポイント履歴を追加
      const historyData: PointHistory = {
        userId: user.uid,
        type,
        points,
        description,
        date: today,
        timestamp: Date.now(),
        ...(taskId ? { taskId } : {})
      };
      
      await addDoc(collection(db, "pointHistory"), historyData);
      
      // ユーザーポイントを更新
      const userPointsRef = doc(db, "userPoints", user.uid);
      await updateDoc(userPointsRef, {
        totalPoints: increment(points),
        currentPoints: increment(points)
      });
      
      // ローカル状態を更新
      const currentUserPoints = get().userPoints;
      if (currentUserPoints) {
        set({
          userPoints: {
            ...currentUserPoints,
            totalPoints: currentUserPoints.totalPoints + points,
            currentPoints: currentUserPoints.currentPoints + points
          }
        });
      }
      
      // ポイント履歴を再読み込み
      get().loadPointHistory();
      
    } catch (error) {
      console.error("ポイント追加エラー:", error);
    }
  },

  /**
   * ポイントを減算する
   */
  removePoints: async (type, points, description, taskId) => {
    const user = useAuthStore.getState().user;
    if (!user || points <= 0) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // ポイント履歴を追加（負のポイント）
      const historyData: PointHistory = {
        userId: user.uid,
        type,
        points: -points, // 負の値で記録
        description,
        date: today,
        timestamp: Date.now(),
        ...(taskId ? { taskId } : {})
      };
      
      await addDoc(collection(db, "pointHistory"), historyData);
      
      // ユーザーポイントを減算
      const userPointsRef = doc(db, "userPoints", user.uid);
      const currentUserPoints = get().userPoints;
      
      if (currentUserPoints) {
        // 現在のポイントが減算分より少ない場合は0にする
        const newCurrentPoints = Math.max(0, currentUserPoints.currentPoints - points);
        
        await updateDoc(userPointsRef, {
          currentPoints: newCurrentPoints
          // totalPointsは変更しない（生涯獲得ポイントとして保持）
        });
        
        // ローカル状態を更新
        set({
          userPoints: {
            ...currentUserPoints,
            currentPoints: newCurrentPoints
          }
        });
      }
      
      // ポイント履歴を再読み込み
      get().loadPointHistory();
      
    } catch (error) {
      console.error("ポイント減算エラー:", error);
    }
  },

  /**
   * タスク完了時のポイント付与
   */
  awardTaskCompletionPoints: async (taskId, taskText, priority) => {
    const basePoints = getPointsForPriority(priority);
    const description = `タスク完了: ${taskText.substring(0, 20)}${taskText.length > 20 ? '...' : ''}`;
    
    await get().addPoints('task_completion', basePoints, description, taskId);
    
    // フィードバック表示
    const feedbackStore = useFeedbackStore.getState();
    feedbackStore.setMessage(`🎉 ${basePoints}ポイント獲得！`);
    
    return basePoints;
  },

  /**
   * タスク完了取り消し時のポイント減算
   */
  revokeTaskCompletionPoints: async (taskId, taskText) => {
    const user = useAuthStore.getState().user;
    if (!user) return 0;

    try {
      // 該当タスクのポイント履歴を検索
      const historyQuery = query(
        collection(db, "pointHistory"),
        where("userId", "==", user.uid),
        where("taskId", "==", taskId),
        where("type", "==", "task_completion")
      );
      
      const snapshot = await getDocs(historyQuery);
      let totalRevokedPoints = 0;
      
      // 該当するポイント履歴を見つけて減算
      for (const doc of snapshot.docs) {
        const historyData = doc.data() as PointHistory;
        if (historyData.points > 0) { // 正のポイントのみ（既に取り消し済みを除外）
          totalRevokedPoints += historyData.points;
        }
      }
      
      if (totalRevokedPoints > 0) {
        const description = `タスク完了取り消し: ${taskText.substring(0, 20)}${taskText.length > 20 ? '...' : ''}`;
        await get().removePoints('task_completion', totalRevokedPoints, description, taskId);
        
        // フィードバック表示
        const feedbackStore = useFeedbackStore.getState();
        feedbackStore.setMessage(`📤 ${totalRevokedPoints}ポイント減算`);
        
        console.log(`タスク完了取り消しで${totalRevokedPoints}ポイントを減算しました`);
      }
      
      return totalRevokedPoints;
    } catch (error) {
      console.error("タスク完了取り消しポイント減算エラー:", error);
      return 0;
    }
  },

  /**
   * サブタスク完了取り消し時のポイント減算
   */
  revokeSubTaskCompletionPoints: async (taskId, subTaskText) => {
    const user = useAuthStore.getState().user;
    if (!user) return 0;

    try {
      // サブタスクのポイント履歴を検索（descriptionで判定）
      const historyQuery = query(
        collection(db, "pointHistory"),
        where("userId", "==", user.uid),
        where("taskId", "==", taskId),
        where("type", "==", "task_completion")
      );
      
      const snapshot = await getDocs(historyQuery);
      let revokedPoints = 0;
      
      // サブタスクに関連する履歴を検索
      for (const doc of snapshot.docs) {
        const historyData = doc.data() as PointHistory;
        
        // サブタスクの説明文に含まれているかチェック
        if (historyData.description.includes("サブタスク完了") && 
            historyData.description.includes(subTaskText.substring(0, 15)) &&
            historyData.points > 0) {
          revokedPoints = 3; // サブタスクのポイントは固定3ポイント
          break;
        }
      }
      
      if (revokedPoints > 0) {
        const description = `サブタスク完了取り消し: ${subTaskText.substring(0, 15)}...`;
        await get().removePoints('task_completion', revokedPoints, description, taskId);
        
        // フィードバック表示
        const feedbackStore = useFeedbackStore.getState();
        feedbackStore.setMessage(`📤 サブタスク取り消し: ${revokedPoints}ポイント減算`);
        
        console.log(`サブタスク完了取り消しで${revokedPoints}ポイントを減算しました`);
      }
      
      return revokedPoints;
    } catch (error) {
      console.error("サブタスク完了取り消しポイント減算エラー:", error);
      return 0;
    }
  },

  /**
   * ログインボーナスの確認と付与
   */
  checkAndAwardLoginBonus: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    // シングルトンマネージャーで重複チェック
    if (loginBonusManager.hasProcessedToday(user.uid)) {
      console.log("今日は既にログインボーナスを受け取り済みです（シングルトン管理）");
      return;
    }

    if (!loginBonusManager.startProcessing(user.uid)) {
      console.log("ログインボーナス処理を開始できませんでした（重複防止）");
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const currentUserPoints = get().userPoints;
    
    if (!currentUserPoints) {
      console.log("ユーザーポイントデータが未読み込みのため、ログインボーナスをスキップします");
      loginBonusManager.completeProcessing(user.uid, false);
      return;
    }
    
    // Firestoreでも再度チェック（他のデバイスでの処理を考慮）
    if (currentUserPoints.lastLoginBonusDate === today) {
      console.log("Firestoreで今日は既にログインボーナスを受け取り済みです");
      loginBonusManager.completeProcessing(user.uid, true);
      return;
    }
    
    try {
      // 前回のログイン日から連続ログイン日数を計算
      let newStreak = 1;
      if (currentUserPoints.lastLoginDate) {
        const lastLogin = new Date(currentUserPoints.lastLoginDate);
        const todayDate = new Date(today);
        const diffTime = todayDate.getTime() - lastLogin.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // 昨日ログインしていた場合、連続ログイン継続
          newStreak = currentUserPoints.loginStreak + 1;
        } else if (diffDays === 0) {
          // 同じ日（既にボーナス受取済みの可能性）
          console.log("同じ日の処理です。スキップします。");
          loginBonusManager.completeProcessing(user.uid, true);
          return;
        } else {
          // 連続ログインが途切れた
          newStreak = 1;
        }
      }
      
      const bonusPoints = getLoginBonusPoints(newStreak);
      const maxStreak = Math.max(newStreak, currentUserPoints.maxLoginStreak || 0);
      
      // ユーザーポイント情報を更新
      const userPointsRef = doc(db, "userPoints", user.uid);
      await updateDoc(userPointsRef, {
        lastLoginDate: today,
        lastLoginBonusDate: today,
        loginStreak: newStreak,
        maxLoginStreak: maxStreak,
        totalPoints: increment(bonusPoints),
        currentPoints: increment(bonusPoints)
      });
      
      // ポイント履歴を追加
      const description = `ログインボーナス (${newStreak}日連続)`;
      await addDoc(collection(db, "pointHistory"), {
        userId: user.uid,
        type: 'login_bonus',
        points: bonusPoints,
        description,
        date: today,
        timestamp: Date.now()
      });
      
      // ローカル状態を更新
      set({
        userPoints: {
          ...currentUserPoints,
          lastLoginDate: today,
          lastLoginBonusDate: today,
          loginStreak: newStreak,
          maxLoginStreak: maxStreak,
          totalPoints: currentUserPoints.totalPoints + bonusPoints,
          currentPoints: currentUserPoints.currentPoints + bonusPoints
        }
      });
      
      // ポイント履歴を再読み込み
      get().loadPointHistory();
      
      // 処理成功をマーク
      loginBonusManager.completeProcessing(user.uid, true);
      
      // フィードバック表示
      const feedbackStore = useFeedbackStore.getState();
      if (newStreak === 1) {
        feedbackStore.setMessage(`🎁 ログインボーナス ${bonusPoints}ポイント獲得！`);
      } else {
        feedbackStore.setMessage(`🔥 ${newStreak}日連続ログイン！ボーナス ${bonusPoints}ポイント獲得！`);
      }
      
      console.log(`ログインボーナス付与完了: ${bonusPoints}ポイント, ${newStreak}日連続`);
      
    } catch (error) {
      console.error("ログインボーナス付与エラー:", error);
      
      // 処理失敗をマーク
      loginBonusManager.completeProcessing(user.uid, false);
      
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage("ログインボーナスの取得に失敗しました");
    }
  },

  /**
   * 今日獲得したポイントを計算（純増減）
   */
  getTodayPoints: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().pointHistory
      .filter(h => h.date === today)
      .reduce((total, h) => total + h.points, 0); // 負のポイントも含めて計算
  },

  /**
   * 今週獲得したポイントを計算（純増減）
   */
  getWeeklyPoints: () => {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return get().pointHistory
      .filter(h => h.timestamp >= oneWeekAgo)
      .reduce((total, h) => total + h.points, 0); // 負のポイントも含めて計算
  },

  /**
   * 今月獲得したポイントを計算（純増減）
   */
  getMonthlyPoints: () => {
    const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    return get().pointHistory
      .filter(h => h.timestamp >= oneMonthAgo)
      .reduce((total, h) => total + h.points, 0); // 負のポイントも含めて計算
  }
}));