/**
 * BGM（バックグラウンドミュージック）管理ストア
 * 
 * アプリケーションでのBGM再生を管理するZustandストア
 * 音楽の再生/停止制御や音量調整機能を提供
 */

import { create } from "zustand";

/**
 * BGM状態の型定義
 */
interface BGMState {
  isPlaying: boolean;           // 再生中かどうか
  volume: number;               // 音量（0.0〜1.0）
  audioElement: HTMLAudioElement | null;  // オーディオ要素
  
  // アクション
  initialize: () => void;       // 初期化
  togglePlay: () => void;       // 再生/停止切り替え
  setVolume: (volume: number) => void;  // 音量設定
  cleanup: () => void;          // リソース解放
}

// シングルトンのオーディオインスタンス
let audioInstance: HTMLAudioElement | null = null;

/**
 * BGM管理Zustandストア
 */
export const useBGMStore = create<BGMState>((set, get) => ({
  isPlaying: false,
  volume: 0.5,
  audioElement: null,
  
  /**
   * BGM機能の初期化
   * ローカルストレージから設定を読み込み、オーディオインスタンスを作成
   */
  initialize: () => {
    // すでに初期化済みならスキップ
    if (get().audioElement) return;
    
    // ブラウザ環境でなければスキップ
    if (typeof window === 'undefined') return;
    
    // ローカルストレージから設定を読み込む
    const storedVolume = localStorage.getItem("bgmVolume");
    const storedPlaying = localStorage.getItem("bgmPlaying");
    
    // グローバルオーディオインスタンスを作成
    if (!audioInstance) {
      audioInstance = new Audio("https://radio.plaza.one/mp3");
      audioInstance.loop = true;
      
      // 音量設定を適用
      if (storedVolume) {
        audioInstance.volume = parseFloat(storedVolume);
      } else {
        audioInstance.volume = 0.5;
      }
      
      // 再生状態を適用
      if (storedPlaying === "true") {
        audioInstance.play().catch(err => {
          console.error("オーディオ再生エラー:", err);
        });
      }
    }
    
    // ストアを更新
    set({
      audioElement: audioInstance,
      volume: storedVolume ? parseFloat(storedVolume) : 0.5,
      isPlaying: storedPlaying === "true"
    });
  },
  
  /**
   * 再生/停止を切り替え
   */
  togglePlay: () => {
    const { audioElement, isPlaying } = get();
    if (!audioElement) return;
    
    const newPlayingState = !isPlaying;
    
    if (newPlayingState) {
      audioElement.play().catch(err => {
        console.error("オーディオ再生エラー:", err);
        set({ isPlaying: false });
      });
    } else {
      audioElement.pause();
    }
    
    // 状態を更新
    set({ isPlaying: newPlayingState });
    
    // ローカルストレージに保存
    localStorage.setItem("bgmPlaying", String(newPlayingState));
  },
  
  /**
   * 音量を設定
   * @param volume 音量（0.0〜1.0）
   */
  setVolume: (volume: number) => {
    const { audioElement } = get();
    if (!audioElement) return;
    
    audioElement.volume = volume;
    set({ volume });
    
    // ローカルストレージに保存
    localStorage.setItem("bgmVolume", String(volume));
  },
  
  /**
   * リソースを解放（主にテスト用）
   */
  cleanup: () => {
    const { audioElement } = get();
    if (audioElement) {
      audioElement.pause();
      audioElement.src = "";
    }
    
    audioInstance = null;
    set({ audioElement: null });
  }
}));

// ブラウザ環境でのみ初期化処理を実行
if (typeof window !== 'undefined') {
  // アプリの初期化後に実行するために小さな遅延を設定
  setTimeout(() => {
    useBGMStore.getState().initialize();
  }, 100);
}