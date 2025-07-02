/**
 * 効果音サービス
 * 
 * アプリ全体で使用する効果音の再生機能を提供
 */

import { useState } from 'react';

/**
 * 効果音の種類
 */
export type SoundType = 
  | 'task-complete'     // タスク完了
  | 'sub-task-complete' // サブタスク完了
  | 'habit-complete'    // 習慣完了
  | 'bell'              // 通知音
  | 'silence';          // 無音

/**
 * 効果音ファイルのマッピング
 */
const SOUND_FILES: Record<SoundType, string> = {
  'task-complete': '/sounds/task-complete.mp3',
  'sub-task-complete': '/sounds/sub-task-complete.mp3',
  'habit-complete': '/sounds/habit-complete.mp3',
  'bell': '/sounds/bell.mp3',
  'silence': '/sounds/silence.mp3'
};

/**
 * オーディオインスタンスのキャッシュ
 */
const audioCache = new Map<SoundType, HTMLAudioElement>();

/**
 * 効果音サービスクラス
 */
class AudioService {
  private enabled: boolean = true;
  private volume: number = 0.5;

  /**
   * 効果音の有効/無効を設定
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    // ローカルストレージに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('audio-enabled', JSON.stringify(enabled));
    }
  }

  /**
   * 効果音の有効/無効状態を取得
   */
  isEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    
    const stored = localStorage.getItem('audio-enabled');
    if (stored !== null) {
      this.enabled = JSON.parse(stored);
    }
    return this.enabled;
  }

  /**
   * 音量を設定
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    // ローカルストレージに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('audio-volume', this.volume.toString());
    }
    
    // キャッシュされたオーディオの音量も更新
    audioCache.forEach(audio => {
      audio.volume = this.volume;
    });
  }

  /**
   * 音量を取得
   */
  getVolume(): number {
    if (typeof window === 'undefined') return this.volume;
    
    const stored = localStorage.getItem('audio-volume');
    if (stored !== null) {
      this.volume = parseFloat(stored);
    }
    return this.volume;
  }

  /**
   * オーディオインスタンスを取得（キャッシュ付き）
   */
  private getAudio(soundType: SoundType): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;

    // キャッシュから取得
    if (audioCache.has(soundType)) {
      return audioCache.get(soundType)!;
    }

    try {
      // 新しいオーディオインスタンスを作成
      const audio = new Audio(SOUND_FILES[soundType]);
      audio.volume = this.getVolume();
      audio.preload = 'auto';
      
      // キャッシュに保存
      audioCache.set(soundType, audio);
      
      return audio;
    } catch (error) {
      console.warn('効果音ファイルの読み込みに失敗:', soundType, error);
      return null;
    }
  }

  /**
   * 効果音を再生
   */
  async play(soundType: SoundType): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    const audio = this.getAudio(soundType);
    if (!audio) {
      console.warn('効果音が見つかりません:', soundType);
      return;
    }

    try {
      // 前の再生をリセット
      audio.currentTime = 0;
      
      // 再生を試行
      await audio.play();
    } catch (error) {
      console.warn('効果音の再生に失敗:', soundType, error);
    }
  }

  /**
   * 効果音をプリロード
   */
  preload(soundTypes: SoundType[]): void {
    soundTypes.forEach(soundType => {
      this.getAudio(soundType);
    });
  }

  /**
   * すべての効果音を停止
   */
  stopAll(): void {
    audioCache.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.stopAll();
    audioCache.clear();
  }
}

// シングルトンインスタンス
export const audioService = new AudioService();

/**
 * 効果音を再生するヘルパー関数
 */
export const playSound = (soundType: SoundType): Promise<void> => {
  return audioService.play(soundType);
};

/**
 * React Hook: 効果音設定
 */
export function useAudioSettings() {
  const [enabled, setEnabledState] = useState(audioService.isEnabled());
  const [volume, setVolumeState] = useState(audioService.getVolume());

  const setEnabled = (enabled: boolean) => {
    audioService.setEnabled(enabled);
    setEnabledState(enabled);
  };

  const setVolume = (volume: number) => {
    audioService.setVolume(volume);
    setVolumeState(volume);
  };

  return {
    enabled,
    volume,
    setEnabled,
    setVolume,
    play: audioService.play.bind(audioService)
  };
}

// 初期化時に効果音をプリロード
if (typeof window !== 'undefined') {
  // ページ読み込み後に非同期でプリロード
  setTimeout(() => {
    audioService.preload(['task-complete', 'sub-task-complete', 'habit-complete', 'bell']);
  }, 1000);
}
