/**
 * 拡張テーマ設定管理ストア（アカウント連携対応版）
 * 
 * アプリの見た目や色のテーマを管理するZustandストア
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
 * ユーザー別テーマ設定
 */
interface UserThemeSettings {
  [userId: string]: {
    backgroundTheme: BackgroundTheme;
    bgColor: string;
    purchasedThemes: string[]; // 購入済みテーマのIDリスト
  };
}

/**
 * テーマ状態の型定義
 */
interface ThemeState {
  // 基本設定
  bgColor: string;                    // レガシー: 単色背景
  backgroundTheme: BackgroundTheme;   // 新機能: 背景テーマ
  currentUserId: string | null;       // 現在のユーザーID
  userThemeSettings: UserThemeSettings; // ユーザー別設定
  
  // アクション
  setBgColor: (color: string) => void;
  setBackgroundTheme: (theme: BackgroundTheme) => void;
  applyThemeToDOM: () => void;  // DOM要素に直接適用
  resetToDefault: () => void;   // デフォルトテーマに戻す
  
  // アカウント管理
  switchUser: (userId: string | null) => void; // ユーザー切り替え
  clearUserData: (userId: string) => void;     // ユーザーデータクリア
  
  // ユーティリティ
  getActiveBackground: () => string;
  isUsingGradient: () => boolean;
  getPurchasedThemes: () => BackgroundTheme[];
  addPurchasedTheme: (themeId: string) => void; // ショップ連携用
  hasPurchasedTheme: (themeId: string) => boolean; // 購入済みチェック
  
  // 🔥 v1.6.1 新機能
  forceApplyTheme: () => void;  // 強制適用（トラブル時用）
  
  // ヘルパー関数
  isLightBackground: (value: string) => boolean;
  isLightColor: (hex: string) => boolean;
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
  },
  {
    id: 'default_light_green',
    name: 'ライトグリーン',
    type: 'solid',
    value: '#f0fff0'
  },
  {
    id: 'default_light_pink',
    name: 'ライトピンク',
    type: 'solid',
    value: '#fff0f5'
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
    isPurchased: false
  },
  'bg_ocean_breeze': {
    id: 'bg_ocean_breeze',
    name: 'オーシャンブリーズ',
    type: 'gradient',
    value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    isPurchased: false
  },
  'bg_forest_mist': {
    id: 'bg_forest_mist',
    name: 'フォレストミスト',
    type: 'gradient',
    value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    isPurchased: false
  },
  'bg_purple_dream': {
    id: 'bg_purple_dream',
    name: 'パープルドリーム',
    type: 'gradient',
    value: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
    isPurchased: false
  },
  'bg_golden_hour': {
    id: 'bg_golden_hour',
    name: 'ゴールデンアワー',
    type: 'gradient',
    value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    isPurchased: false
  },
  'bg_cosmic_nebula': {
    id: 'bg_cosmic_nebula',
    name: 'コズミックネビュラ',
    type: 'gradient',
    value: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    isPurchased: false
  },
  'bg_aurora_borealis': {
    id: 'bg_aurora_borealis',
    name: 'オーロラボレアリス',
    type: 'gradient',
    value: 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
    isPurchased: false
  },
  'bg_rainbow_prism': {
    id: 'bg_rainbow_prism',
    name: 'レインボープリズム',
    type: 'gradient',
    value: 'linear-gradient(135deg, #ff0000 0%, #ff8000 16.66%, #ffff00 33.33%, #80ff00 50%, #00ffff 66.66%, #8000ff 83.33%, #ff0080 100%)',
    isPurchased: false
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
      currentUserId: null,
      userThemeSettings: {},
      
      /**
       * レガシー: 背景色を設定（単色のみ）
       */
      setBgColor: (color) => {
        const { currentUserId } = get();
        const newTheme = {
          id: 'custom_solid',
          name: 'カスタム単色',
          type: 'solid' as BackgroundType,
          value: color
        };
        
        // ユーザー別に設定を保存
        if (currentUserId) {
          set(state => ({
            bgColor: color,
            backgroundTheme: newTheme,
            userThemeSettings: {
              ...state.userThemeSettings,
              [currentUserId]: {
                ...state.userThemeSettings[currentUserId],
                bgColor: color,
                backgroundTheme: newTheme
              }
            }
          }));
        } else {
          set({ 
            bgColor: color,
            backgroundTheme: newTheme
          });
        }
        
        // DOM要素に即座に適用
        get().applyThemeToDOM();
      },
      
      /**
       * 🔥 修正: 背景テーマを設定（即座適用保証）
       */
      setBackgroundTheme: (theme) => {
        const { currentUserId } = get();
        console.log('テーマを設定:', theme, 'ユーザー:', currentUserId);
        
        // ユーザー別に設定を保存
        if (currentUserId) {
          set(state => ({
            backgroundTheme: theme,
            bgColor: theme.type === 'solid' ? theme.value : '#ffffff',
            userThemeSettings: {
              ...state.userThemeSettings,
              [currentUserId]: {
                ...state.userThemeSettings[currentUserId],
                backgroundTheme: theme,
                bgColor: theme.type === 'solid' ? theme.value : '#ffffff',
                purchasedThemes: state.userThemeSettings[currentUserId]?.purchasedThemes || []
              }
            }
          }));
        } else {
          set({ 
            backgroundTheme: theme,
            bgColor: theme.type === 'solid' ? theme.value : '#ffffff'
          });
        }
        
        // 🔥 修正: 複数回の適用で確実に反映
        setTimeout(() => get().applyThemeToDOM(), 0);
        setTimeout(() => get().applyThemeToDOM(), 100);
        setTimeout(() => get().applyThemeToDOM(), 300);
      },
      
      /**
       * ユーザー切り替え
       */
      switchUser: (userId) => {
        console.log('ユーザー切り替え:', userId);
        
        if (!userId) {
          // ログアウト時: デフォルトテーマに戻す
          console.log('ログアウト検出: デフォルトテーマに戻します');
          set({
            currentUserId: null,
            backgroundTheme: DEFAULT_BACKGROUNDS[0],
            bgColor: DEFAULT_BACKGROUNDS[0].value
          });
          get().applyThemeToDOM();
          return;
        }
        
        const { userThemeSettings } = get();
        const userSettings = userThemeSettings[userId];
        
        if (userSettings) {
          // 既存のユーザー設定を復元
          console.log('既存ユーザー設定を復元:', userSettings);
          set({
            currentUserId: userId,
            backgroundTheme: userSettings.backgroundTheme,
            bgColor: userSettings.bgColor
          });
        } else {
          // 新規ユーザー: デフォルト設定で初期化
          console.log('新規ユーザー: デフォルト設定で初期化');
          const defaultTheme = DEFAULT_BACKGROUNDS[0];
          set({
            currentUserId: userId,
            backgroundTheme: defaultTheme,
            bgColor: defaultTheme.value,
            userThemeSettings: {
              ...userThemeSettings,
              [userId]: {
                backgroundTheme: defaultTheme,
                bgColor: defaultTheme.value,
                purchasedThemes: []
              }
            }
          });
        }
        
        get().applyThemeToDOM();
      },
      
      /**
       * 特定ユーザーのデータをクリア
       */
      clearUserData: (userId) => {
        console.log('ユーザーデータをクリア:', userId);
        set(state => {
          const newUserThemeSettings = { ...state.userThemeSettings };
          delete newUserThemeSettings[userId];
          
          return {
            userThemeSettings: newUserThemeSettings,
            // 現在のユーザーの場合はデフォルトに戻す
            ...(state.currentUserId === userId ? {
              currentUserId: null,
              backgroundTheme: DEFAULT_BACKGROUNDS[0],
              bgColor: DEFAULT_BACKGROUNDS[0].value
            } : {})
          };
        });
        
        // 現在のユーザーの場合はテーマも更新
        const { currentUserId } = get();
        if (currentUserId === userId || !currentUserId) {
          get().applyThemeToDOM();
        }
      },
      
      /**
       * 🔥 強化: DOM要素に確実にテーマを適用
       */
      applyThemeToDOM: () => {
        if (typeof window === 'undefined' || !document.body) {
          console.warn('DOM環境が利用できません');
          return;
        }
        
        const { backgroundTheme } = get();
        
        console.log('DOM要素にテーマを適用:', backgroundTheme);
        
        try {
          if (backgroundTheme.type === 'gradient') {
            // グラデーション背景の場合
            document.body.style.background = backgroundTheme.value;
            document.body.style.backgroundColor = '';
            document.body.style.backgroundAttachment = 'fixed';
            
            // 🔥 追加: 確実に適用されるように追加のスタイル設定
            document.documentElement.style.background = backgroundTheme.value;
            document.documentElement.style.backgroundAttachment = 'fixed';
          } else {
            // 単色背景の場合
            document.body.style.backgroundColor = backgroundTheme.value;
            document.body.style.background = '';
            document.body.style.backgroundAttachment = '';
            
            // 🔥 追加: 確実に適用されるように追加のスタイル設定
            document.documentElement.style.backgroundColor = backgroundTheme.value;
            document.documentElement.style.background = '';
          }
          
          // 🔥 追加: メタテーマカラーも更新
          const themeColorMeta = document.querySelector('meta[name="theme-color"]');
          if (themeColorMeta) {
            const themeColor = backgroundTheme.type === 'solid' ? backgroundTheme.value : '#3B82F6';
            themeColorMeta.setAttribute('content', themeColor);
          }
          
          // 🔥 追加: CSS変数でも設定（将来の拡張用）
          document.documentElement.style.setProperty('--app-bg-color', backgroundTheme.value);
          
          // コンテンツの可読性を保つため、明るい背景では文字色を調整
          const isLightBackground = get().isLightBackground(backgroundTheme.value);
          document.body.classList.toggle('dark-theme', !isLightBackground);
          
          console.log('✅ テーマ適用完了:', backgroundTheme.value);
          
        } catch (error) {
          console.error('❌ テーマ適用エラー:', error);
        }
      },
      
      /**
       * 🔥 新機能: テーマの強制適用（トラブル時用）
       */
      forceApplyTheme: () => {
        const { backgroundTheme } = get();
        
        if (typeof window === 'undefined' || !document.body) return;
        
        console.log('🔧 テーマを強制適用:', backgroundTheme);
        
        // すべての可能な要素にスタイルを適用
        const elements = [document.body, document.documentElement];
        
        elements.forEach(element => {
          if (element) {
            if (backgroundTheme.type === 'gradient') {
              element.style.background = backgroundTheme.value;
              element.style.backgroundColor = '';
              element.style.backgroundAttachment = 'fixed';
            } else {
              element.style.backgroundColor = backgroundTheme.value;
              element.style.background = '';
              element.style.backgroundAttachment = '';
            }
          }
        });
        
        // CSS変数でも設定
        document.documentElement.style.setProperty('--app-bg-color', backgroundTheme.value);
        
        console.log('✅ 強制適用完了');
      },
      
      /**
       * デフォルトテーマに戻す
       */
      resetToDefault: () => {
        const { currentUserId } = get();
        const defaultTheme = DEFAULT_BACKGROUNDS[0];
        
        if (currentUserId) {
          // ユーザー設定もリセット
          set(state => ({
            backgroundTheme: defaultTheme,
            bgColor: defaultTheme.value,
            userThemeSettings: {
              ...state.userThemeSettings,
              [currentUserId]: {
                backgroundTheme: defaultTheme,
                bgColor: defaultTheme.value,
                purchasedThemes: state.userThemeSettings[currentUserId]?.purchasedThemes || []
              }
            }
          }));
        } else {
          set({ 
            backgroundTheme: defaultTheme,
            bgColor: defaultTheme.value
          });
        }
        
        get().applyThemeToDOM();
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
      },
      
      /**
       * 購入済みテーマのリストを取得（ユーザー別）
       */
      getPurchasedThemes: () => {
        const { currentUserId, userThemeSettings } = get();
        if (!currentUserId || !userThemeSettings[currentUserId]) {
          return [];
        }
        
        const purchasedThemeIds = userThemeSettings[currentUserId].purchasedThemes || [];
        return purchasedThemeIds
          .map(themeId => PURCHASABLE_BACKGROUNDS[themeId])
          .filter(Boolean);
      },
      
      /**
       * ショップ連携 - テーマを購入済みに設定（ユーザー別）
       */
      addPurchasedTheme: (themeId) => {
        const { currentUserId } = get();
        if (!currentUserId) {
          console.warn('ユーザーがログインしていないため、テーマを購入済みに設定できません');
          return;
        }
        
        if (PURCHASABLE_BACKGROUNDS[themeId]) {
          set(state => {
            const currentUserSettings = state.userThemeSettings[currentUserId] || {
              backgroundTheme: DEFAULT_BACKGROUNDS[0],
              bgColor: DEFAULT_BACKGROUNDS[0].value,
              purchasedThemes: []
            };
            
            const updatedPurchasedThemes = currentUserSettings.purchasedThemes.includes(themeId)
              ? currentUserSettings.purchasedThemes
              : [...currentUserSettings.purchasedThemes, themeId];
            
            return {
              userThemeSettings: {
                ...state.userThemeSettings,
                [currentUserId]: {
                  ...currentUserSettings,
                  purchasedThemes: updatedPurchasedThemes
                }
              }
            };
          });
          
          console.log(`テーマ「${themeId}」をユーザー「${currentUserId}」の購入済みに設定しました`);
        }
      },
      
      /**
       * テーマを購入済みかチェック（ユーザー別）
       */
      hasPurchasedTheme: (themeId) => {
        const { currentUserId, userThemeSettings } = get();
        if (!currentUserId || !userThemeSettings[currentUserId]) {
          return false;
        }
        
        return userThemeSettings[currentUserId].purchasedThemes?.includes(themeId) || false;
      },
      
      /**
       * ヘルパー: 背景が明るいかどうかを判定
       */
      isLightBackground: (value: string) => {
        // 簡易的な明度判定（実際にはより複雑な計算が必要）
        if (value.includes('gradient')) {
          // グラデーションの場合は最初の色で判定
          const firstColor = value.match(/#[0-9a-fA-F]{6}/)?.[0] || '#ffffff';
          return get().isLightColor(firstColor);
        }
        return get().isLightColor(value);
      },
      
      /**
       * ヘルパー: 色が明るいかどうかを判定
       */
      isLightColor: (hex: string) => {
        // HEX色を RGB に変換して輝度を計算
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        // 相対輝度の計算（簡易版）
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5;
      }
    }),
    { 
      name: "theme-storage",
      version: 5, // 🔥 v1.6.1でバージョンアップ
      migrate: (persistedState: any, version: number) => {
        if (version < 5) {
          // 旧バージョンからの移行
          const migratedState = {
            bgColor: persistedState.bgColor || '#ffffff',
            backgroundTheme: persistedState.backgroundTheme || {
              id: 'default_white',
              name: 'デフォルト（白）',
              type: 'solid',
              value: persistedState.bgColor || '#ffffff'
            },
            currentUserId: persistedState.currentUserId || null,
            userThemeSettings: persistedState.userThemeSettings || {}
          };
          
          console.log('テーマストアをv5に移行しました:', migratedState);
          return migratedState;
        }
        return persistedState;
      }
    }
  )
);

// 🔥 強化: ストア初期化時とページ表示時にテーマを確実に適用
if (typeof window !== 'undefined') {
  const applyInitialTheme = () => {
    const themeStore = useThemeStore.getState();
    console.log('🎨 初期テーマを適用中...');
    themeStore.applyThemeToDOM();
    
    // 🔥 追加: 500ms後にも再適用（確実に反映させる）
    setTimeout(() => {
      themeStore.applyThemeToDOM();
    }, 500);
  };
  
  // ページ読み込み時
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyInitialTheme);
  } else {
    setTimeout(applyInitialTheme, 100);
  }
  
  // 🔥 追加: ページが表示された時にも適用（visibilitychange対応）
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      setTimeout(() => {
        const themeStore = useThemeStore.getState();
        themeStore.applyThemeToDOM();
      }, 100);
    }
  });
}