/**
 * ゲーム管理ストア
 * 
 * ミニゲームの実行、スコア管理、プレイ権購入を管理する
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { usePointsStore } from "./pointsStore";
import { useUserPurchasesStore } from "./userPurchasesStore";
import { useFeedbackStore } from "@/store/feedbackStore";

/**
 * ゲームの種類
 */
type GameType = 'dinosaur' | 'flappy';

/**
 * ゲームスコアのRecord
 */
interface GameScore {
  gameType: GameType;
  score: number;
  timestamp: number;
  date: string;
}

/**
 * ゲーム管理状態の型定義
 */
interface GameState {
  isGameOpen: boolean;           // ゲームが開いているかどうか
  currentGame: GameType | null;  // 現在プレイ中のゲーム
  gameUrl: string | null;        // ゲームのURL
  
  // スコア管理
  highScores: { [key in GameType]: number };    // 最高スコア
  playCount: { [key in GameType]: number };     // プレイ回数
  totalPlayTime: { [key in GameType]: number }; // 総プレイ時間（秒）
  recentScores: GameScore[];                    // 最近のスコア
  
  // アクション
  openGame: (gameType: GameType, gameUrl: string) => void;    // ゲームを開く
  closeGame: () => void;                                       // ゲームを閉じる
  recordScore: (gameType: GameType, score: number) => void;   // スコアを記録
  getStats: (gameType: GameType) => any;                      // ゲーム統計を取得
  purchaseGamePlay: (gameType: GameType) => Promise<boolean>; // プレイ権を購入
}

/**
 * ゲーム管理ストア
 */
export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      isGameOpen: false,
      currentGame: null,
      gameUrl: null,
      
      highScores: {
        dinosaur: 0,
        flappy: 0
      },
      playCount: {
        dinosaur: 0,
        flappy: 0
      },
      totalPlayTime: {
        dinosaur: 0,
        flappy: 0
      },
      recentScores: [],
      
      /**
       * ゲームを開く
       * @param gameType ゲームタイプ
       * @param gameUrl ゲームのURL
       */
      openGame: (gameType, gameUrl) => {
        const { hasItem } = useUserPurchasesStore.getState();
        const gameItemId = gameType === 'dinosaur' ? 'game-dino' : 'game-flappy';
        
        // ゲームを購入しているかチェック
        if (!hasItem(gameItemId)) {
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage('このゲームを購入してください');
          return;
        }
        
        set({
          isGameOpen: true,
          currentGame: gameType,
          gameUrl
        });
        
        console.log(`ゲーム開始: ${gameType}`);
      },
      
      /**
       * ゲームを閉じる
       */
      closeGame: () => {
        const { currentGame } = get();
        
        if (currentGame) {
          console.log(`ゲーム終了: ${currentGame}`);
        }
        
        set({
          isGameOpen: false,
          currentGame: null,
          gameUrl: null
        });
      },
      
      /**
       * スコアを記録
       * @param gameType ゲームタイプ
       * @param score スコア
       */
      recordScore: (gameType, score) => {
        const state = get();
        const newHighScore = Math.max(state.highScores[gameType], score);
        const newPlayCount = state.playCount[gameType] + 1;
        
        const scoreRecord: GameScore = {
          gameType,
          score,
          timestamp: Date.now(),
          date: new Date().toISOString().split('T')[0]
        };
        
        set({
          highScores: {
            ...state.highScores,
            [gameType]: newHighScore
          },
          playCount: {
            ...state.playCount,
            [gameType]: newPlayCount
          },
          recentScores: [scoreRecord, ...state.recentScores.slice(0, 49)] // 最新50件のみ保持
        });
        
        console.log(`スコア記録: ${gameType} - ${score}`);
        
        // ハイスコア更新の通知
        if (score > state.highScores[gameType]) {
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage(`🎉 新記録！ ${gameType}: ${score}点`);
        }
      },
      
      /**
       * ゲーム統計を取得
       * @param gameType ゲームタイプ
       * @returns 統計情報
       */
      getStats: (gameType) => {
        const state = get();
        const gameScores = state.recentScores.filter(s => s.gameType === gameType);
        
        const averageScore = gameScores.length > 0
          ? Math.round(gameScores.reduce((sum, s) => sum + s.score, 0) / gameScores.length)
          : 0;
        
        // 今日のスコア
        const today = new Date().toISOString().split('T')[0];
        const todayScores = gameScores.filter(s => s.date === today);
        const todayBest = todayScores.length > 0
          ? Math.max(...todayScores.map(s => s.score))
          : 0;
        
        return {
          gameType,
          highScore: state.highScores[gameType],
          playCount: state.playCount[gameType],
          averageScore,
          todayBest,
          todayGames: todayScores.length,
          totalPlayTime: state.totalPlayTime[gameType],
          recentScores: gameScores.slice(0, 10) // 最新10件
        };
      },
      
      /**
       * プレイ権を購入（1プレイ5ポイント）
       * @param gameType ゲームタイプ
       * @returns 購入成功したかどうか
       */
      purchaseGamePlay: async (gameType) => {
        const { totalPoints, usePoints } = usePointsStore.getState();
        const playPrice = 5;
        
        if (totalPoints < playPrice) {
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage(`ポイントが不足しています（必要: ${playPrice}、現在: ${totalPoints}）`);
          return false;
        }
        
        // 1プレイ分の料金を支払い
        const success = await usePoints(playPrice, `${gameType} 1プレイ`);
        if (success) {
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage(`${gameType} を開始します！頑張ってください！`);
          return true;
        }
        
        return false;
      }
    }),
    {
      name: "game-stats-storage",
      partialize: (state) => ({
        highScores: state.highScores,
        playCount: state.playCount,
        totalPlayTime: state.totalPlayTime,
        recentScores: state.recentScores.slice(0, 50) // 最新50件のみローカル保存
      })
    }
  )
);