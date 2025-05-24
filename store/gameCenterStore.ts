/**
 * ゲームセンター管理ストア
 * 
 * ポイント消費型ゲーム機能を管理するZustandストア
 * ディノランとフラッピーバードのプレイ履歴とスコア管理
 * v1.6.2: リトライ時のポイント消費問題を完全修正
 */

import { create } from "zustand";
import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  orderBy,
  limit
} from "firebase/firestore";
import { useAuthStore } from "@/store/auth";
import { usePointStore } from "@/store/pointStore";
import { useFeedbackStore } from "@/store/feedbackStore";

/**
 * ゲームタイプ
 */
export type GameType = 'dino' | 'flappy';

/**
 * ゲームプレイ履歴の型定義
 */
export interface GameHistory {
  id?: string;
  userId: string;
  gameType: GameType;
  score: number;
  pointsSpent: number;
  duration: number;        // プレイ時間（秒）
  timestamp: number;
  date: string;           // YYYY-MM-DD形式
}

/**
 * ゲーム統計の型定義
 */
export interface GameStats {
  gameType: GameType;
  totalPlays: number;
  bestScore: number;
  totalPointsSpent: number;
  averageScore: number;
  lastPlayed?: string;
}

/**
 * ゲームセンターストアの状態とアクション定義
 */
interface GameCenterState {
  gameHistory: GameHistory[];
  gameStats: { [key in GameType]: GameStats };
  loading: boolean;
  currentGame: GameType | null;
  isPlaying: boolean;
  gameStartTime: number | null;
  
  // データ取得
  loadGameHistory: () => Promise<void>;
  loadGameStats: () => Promise<void>;
  
  // ゲーム操作
  startGame: (gameType: GameType) => Promise<boolean>;
  endGame: (score: number, duration?: number) => Promise<void>;
  canPlayGame: () => boolean;
  
  // 統計
  getBestScore: (gameType: GameType) => number;
  getTotalPlays: (gameType: GameType) => number;
  getTodayPlays: () => number;
}

// ゲーム1回のコスト
const GAME_COST = 5;

/**
 * ゲームセンター管理Zustandストア
 */
export const useGameCenterStore = create<GameCenterState>((set, get) => ({
  gameHistory: [],
  gameStats: {
    dino: {
      gameType: 'dino',
      totalPlays: 0,
      bestScore: 0,
      totalPointsSpent: 0,
      averageScore: 0
    },
    flappy: {
      gameType: 'flappy',
      totalPlays: 0,
      bestScore: 0,
      totalPointsSpent: 0,
      averageScore: 0
    }
  },
  loading: false,
  currentGame: null,
  isPlaying: false,
  gameStartTime: null,

  /**
   * ゲームプレイ履歴を読み込む
   */
  loadGameHistory: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ gameHistory: [] });
      return;
    }

    set({ loading: true });
    try {
      const historyQuery = query(
        collection(db, "gameHistory"),
        where("userId", "==", user.uid)
      );
      
      const snapshot = await getDocs(historyQuery);
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GameHistory[];
      
      // タイムスタンプでソート（新しい順）
      history.sort((a, b) => b.timestamp - a.timestamp);
      
      set({ gameHistory: history.slice(0, 100) }); // 最新100件まで
      console.log("ゲーム履歴を取得:", history.length, "件");
      
      // 履歴読み込み後に統計を更新
      await get().loadGameStats();
    } catch (error) {
      console.error("ゲーム履歴読み込みエラー:", error);
      set({ gameHistory: [] });
    } finally {
      set({ loading: false });
    }
  },

  /**
   * ゲーム統計を計算・更新
   */
  loadGameStats: async () => {
    const history = get().gameHistory;
    
    const dinoHistory = history.filter(h => h.gameType === 'dino');
    const flappyHistory = history.filter(h => h.gameType === 'flappy');
    
    const calculateStats = (gameHistory: GameHistory[], gameType: GameType): GameStats => {
      if (gameHistory.length === 0) {
        return {
          gameType,
          totalPlays: 0,
          bestScore: 0,
          totalPointsSpent: 0,
          averageScore: 0
        };
      }
      
      const bestScore = Math.max(...gameHistory.map(h => h.score));
      const totalPointsSpent = gameHistory.reduce((sum, h) => sum + h.pointsSpent, 0);
      const averageScore = Math.round(
        gameHistory.reduce((sum, h) => sum + h.score, 0) / gameHistory.length
      );
      const lastPlayed = gameHistory[0]?.date; // 最新のプレイ日
      
      return {
        gameType,
        totalPlays: gameHistory.length,
        bestScore,
        totalPointsSpent,
        averageScore,
        lastPlayed
      };
    };
    
    const newStats = {
      dino: calculateStats(dinoHistory, 'dino'),
      flappy: calculateStats(flappyHistory, 'flappy')
    };
    
    set({ gameStats: newStats });
    console.log("ゲーム統計を更新:", newStats);
  },

  /**
   * ゲームをプレイできるかチェック
   */
  canPlayGame: () => {
    const pointStore = usePointStore.getState();
    return (pointStore.userPoints?.currentPoints || 0) >= GAME_COST;
  },

  /**
   * 🔥 修正: ゲームを開始（常にポイント消費）
   */
  startGame: async (gameType) => {
    const user = useAuthStore.getState().user;
    const pointStore = usePointStore.getState();
    
    if (!user) {
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage("ログインが必要です");
      return false;
    }

    if (!get().canPlayGame()) {
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(`ゲームプレイには${GAME_COST}ポイント必要です`);
      return false;
    }

    try {
      // 🔥 重要な修正: 毎回ポイントを消費（リトライも含む）
      console.log(`ゲーム開始: ${gameType} - ${GAME_COST}ポイント消費`);
      
      await pointStore.removePoints(
        'game_play', 
        GAME_COST, 
        `ゲームプレイ (${gameType === 'dino' ? 'ディノラン' : 'フラッピーバード'})`,
        undefined, // taskId
        false, // affectTotal
        gameType // gameType
      );
      
      // ゲーム状態を設定
      set({ 
        currentGame: gameType, 
        isPlaying: true,
        gameStartTime: Date.now()
      });
      
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(`🎮 ${GAME_COST}ポイント消費してゲーム開始！`);
      
      console.log(`ゲーム開始完了: ${gameType}, ポイント消費: ${GAME_COST}`);
      return true;
    } catch (error) {
      console.error("ゲーム開始エラー:", error);
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage("ゲーム開始に失敗しました");
      return false;
    }
  },

  /**
   * ゲームを終了してスコアを記録
   */
  endGame: async (score, duration) => {
    const user = useAuthStore.getState().user;
    const { currentGame, gameStartTime } = get();
    
    if (!user || !currentGame) {
      console.log("ゲーム終了: ユーザーまたはゲームが未設定");
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 実際の経過時間を計算
      const actualDuration = duration || (gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0);
      
      // ゲーム履歴を記録
      const historyData: Omit<GameHistory, 'id'> = {
        userId: user.uid,
        gameType: currentGame,
        score,
        pointsSpent: GAME_COST,
        duration: actualDuration,
        timestamp: Date.now(),
        date: today
      };
      
      console.log("ゲーム履歴を保存:", historyData);
      await addDoc(collection(db, "gameHistory"), historyData);
      
      // ローカル状態をリセット
      set({ 
        currentGame: null, 
        isPlaying: false,
        gameStartTime: null
      });
      
      // データを強制的に再読み込み
      await get().loadGameHistory(); // 履歴を再読み込み（統計も自動更新される）
      
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage(`🎯 スコア: ${score}点 記録しました！`);
      
      console.log(`ゲーム終了記録完了: ${currentGame}, スコア: ${score}, 時間: ${actualDuration}秒`);
    } catch (error) {
      console.error("ゲーム終了処理エラー:", error);
      const feedbackStore = useFeedbackStore.getState();
      feedbackStore.setMessage("スコアの記録に失敗しました");
    }
  },

  /**
   * 指定ゲームの最高スコアを取得
   */
  getBestScore: (gameType) => {
    return get().gameStats[gameType].bestScore;
  },

  /**
   * 指定ゲームの総プレイ回数を取得
   */
  getTotalPlays: (gameType) => {
    return get().gameStats[gameType].totalPlays;
  },

  /**
   * 今日のプレイ回数を取得
   */
  getTodayPlays: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().gameHistory.filter(h => h.date === today).length;
  }
}));