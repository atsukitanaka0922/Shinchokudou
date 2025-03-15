import { create } from "zustand";

// BGMの状態管理ストア
interface BGMState {
  isPlaying: boolean;
  volume: number;
  audioElement: HTMLAudioElement | null;
  
  // アクション
  initialize: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  cleanup: () => void;
}

// シングルトンのオーディオインスタンスを作成
let audioInstance: HTMLAudioElement | null = null;

export const useBGMStore = create<BGMState>((set, get) => ({
  isPlaying: false,
  volume: 0.5,
  audioElement: null,
  
  // 初期化処理
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
  
  // 再生/停止を切り替え
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
  
  // 音量を設定
  setVolume: (volume: number) => {
    const { audioElement } = get();
    if (!audioElement) return;
    
    audioElement.volume = volume;
    set({ volume });
    
    // ローカルストレージに保存
    localStorage.setItem("bgmVolume", String(volume));
  },
  
  // クリーンアップ（未使用）
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

// BGMストアの初期化処理を実行
if (typeof window !== 'undefined') {
  // 小さい遅延を入れて、アプリの初期化後に実行されるようにする
  setTimeout(() => {
    useBGMStore.getState().initialize();
  }, 100);
}