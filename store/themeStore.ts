/**
 * 拡張テーマ設定管理ストア
 * 
 * アプリの見た目や色のテーマを管理するZustandストア
 * v1.6.0: ショップで購入した背景テーマに対応
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 背景テーマの種類
 */
export type BackgroundType = 'solid' | 'gradient';

/**
 * 背景テーマの定義
 */
export interface BackgroundTheme {
  id: string;
  name: string;
  type: BackgroundType;
  value: string;        // CSS値（色コードまたはgradient）
  isPurchased?: boolean; // ショップで購入したかどうか
}

/**
 * テーマ状態の型定義
 */
interface ThemeState {
  // 基本設定
  bgColor: string;                    // レガシー: 単色背景
  backgroundTheme: BackgroundTheme;   // 新機能: 背景テーマ
  
  // アクション
  setBgColor: (color: string) => void;
  setBackgroundTheme: (theme: BackgroundTheme) => void;
  
  // ユーティリティ
  getActiveBackground: () => string;
  isUsingGradient: () => boolean;
}

/**
 * デフォルトの背景テーマ（無料）
 */
const DEFAULT_BACKGROUNDS: BackgroundTheme[] = [
  {
    id: 'default_white',
    name: 'デフォルト（白）',
    type: 'solid',
    value: '#ffffff'
  },
  {
    id: 'default_light_gray',
    name: 'ライトグレー',
    type: 'solid',
    value: '#f8f9fa'
  },
  {
    id: 'default_soft_blue',
    name: 'ソフトブルー',
    type: 'solid',
    value: '#f0f8ff'
  },
  {
    id: 'default_warm_gray',
    name: 'ウォームグレー',
    type: 'solid',
    value: '#f5f5f5'
  }
];

/**
 * 購入可能な背景テーマのIDと値のマッピング
 */
export const PURCHASABLE_BACKGROUNDS: { [key: string]: BackgroundTheme } = {
  'bg_sunset_wave': {
    id: 'bg_sunset_wave',
    name: 'サンセットウェーブ',
    type: 'gradient',
    value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
    isPurchased: true
  },
  'bg_ocean_breeze': {
    id: 'bg_ocean_breeze',
    name: 'オーシャンブリーズ',
    type: 'gradient',
    value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    isPurchased: true
  },
  'bg_forest_mist': {
    id: 'bg_forest_mist',
    name: 'フォレストミスト',
    type: 'gradient',
    value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    isPurchased: true
  },
  'bg_purple_dream': {
    id: 'bg_purple_dream',
    name: 'パープルドリーム',
    type: 'gradient',
    value: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
    isPurchased: true
  },
  'bg_golden_hour': {
    id: 'bg_golden_hour',
    name: 'ゴールデンアワー',
    type: 'gradient',
    value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    isPurchased: true
  },
  'bg_cosmic_nebula': {
    id: 'bg_cosmic_nebula',
    name: 'コズミックネビュラ',
    type: 'gradient',
    value: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    isPurchased: true
  },
  'bg_aurora_borealis': {
    id: 'bg_aurora_borealis',
    name: 'オーロラボレアリス',
    type: 'gradient',
    value: 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
    isPurchased: true
  },
  'bg_rainbow_prism': {
    id: 'bg_rainbow_prism',
    name: 'レインボープリズム',
    type: 'gradient',
    value: 'linear-gradient(135deg, #ff0000 0%, #ff8000 16.66%, #ffff00 33.33%, #80ff00 50%, #00ffff 66.66%, #8000ff 83.33%, #ff0080 100%)',
    isPurchased: true
  }
};

/**
 * 拡張テーマ管理Zustandストア
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // デフォルト設定
      bgColor: "#ffffff",
      backgroundTheme: DEFAULT_BACKGROUNDS[0],
      
      /**
       * レガシー: 背景色を設定（単色のみ）
       */
      setBgColor: (color) => {
        set({ 
          bgColor: color,
          backgroundTheme: {
            id: 'custom_solid',
            name: 'カスタム単色',
            type: 'solid',
            value: color
          }
        });
      },
      
      /**
       * 新機能: 背景テーマを設定（グラデーション対応）
       */
      setBackgroundTheme: (theme) => {
        set({ 
          backgroundTheme: theme,
          bgColor: theme.type === 'solid' ? theme.value : '#ffffff' // グラデーションの場合はフォールバック
        });
      },
      
      /**
       * 現在アクティブな背景のCSS値を取得
       */
      getActiveBackground: () => {
        const { backgroundTheme } = get();
        return backgroundTheme.value;
      },
      
      /**
       * グラデーション背景を使用しているかチェック
       */
      isUsingGradient: () => {
        const { backgroundTheme } = get();
        return backgroundTheme.type === 'gradient';
      }
    }),
    { 
      name: "theme-storage",
      version: 2, // バージョンアップでマイグレーション
      migrate: (persistedState: any, version: number) => {
        if (version === 0 || version === 1) {
          // v1からv2への移行: backgroundThemeを追加
          return {
            ...persistedState,
            backgroundTheme: {
              id: 'default_white',
              name: 'デフォルト（白）',
              type: 'solid',
              value: persistedState.bgColor || '#ffffff'
            }
          };
        }
        return persistedState;
      }
    }
  )
);