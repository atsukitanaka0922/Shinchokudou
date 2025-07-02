/**
 * ポイントショップ管理ストア（エラーハンドリング強化版）
 * 
 * ポイントで購入できるアイテム（背景テーマなど）を管理するZustandストア
 * v1.6.1: Firebaseパーミッションエラーの修正とエラーハンドリング強化
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from "firebase/firestore";
import { useAuthStore } from "@/store/auth";
import { usePointStore } from "@/store/pointStore";
import { useFeedbackStore } from "@/store/feedbackStore";

/**
 * ショップアイテムの種類
 */
export type ShopItemType = 'background' | 'theme' | 'sound' | 'badge';

/**
 * ショップアイテムの定義
 */
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: ShopItemType;
  price: number;
  preview: string;        // プレビュー用のCSS値またはURL
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isLimited?: boolean;    // 期間限定アイテム
  limitedUntil?: string;  // 期間限定の終了日
}

/**
 * ユーザーの購入履歴
 */
export interface UserPurchase {
  id?: string;
  userId: string;
  itemId: string;
  purchaseDate: string;   // YYYY-MM-DD
  purchaseTime: number;   // タイムスタンプ
  pointsSpent: number;
}

/**
 * ショップストアの状態とアクション定義
 */
interface ShopState {
  shopItems: ShopItem[];
  userPurchases: UserPurchase[];
  loading: boolean;
  error: string | null;  // 🔥 追加: エラー状態管理
  
  // アイテム管理
  loadShopItems: () => void;
  loadUserPurchases: () => Promise<void>;
  
  // 購入機能
  purchaseItem: (itemId: string) => Promise<boolean>;
  canPurchaseItem: (itemId: string) => boolean;
  hasPurchasedItem: (itemId: string) => boolean;
  
  // エラー管理
  clearError: () => void;  // 🔥 追加: エラークリア
  
  // ユーティリティ
  getItemById: (itemId: string) => ShopItem | undefined;
  getPurchaseHistory: () => UserPurchase[];
  getTotalSpentPoints: () => number;
}

/**
 * 利用可能なショップアイテム（大幅拡張版）
 */
const SHOP_ITEMS: ShopItem[] = [
  // 🌅 サンセット・サンライズシリーズ（コモン〜レア）
  {
    id: 'bg_sunset_wave',
    name: 'サンセットウェーブ',
    description: '夕日のような温かいオレンジとピンクのグラデーション',
    type: 'background',
    price: 30,
    preview: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
    rarity: 'common'
  },
  {
    id: 'bg_golden_hour',
    name: 'ゴールデンアワー',
    description: '黄金の時間をイメージした贅沢なグラデーション',
    type: 'background',
    price: 50,
    preview: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    rarity: 'common'
  },
  {
    id: 'bg_morning_glow',
    name: 'モーニンググロウ',
    description: '朝焼けの美しい輝きを表現したグラデーション',
    type: 'background',
    price: 75,
    preview: 'linear-gradient(135deg, #ff9a8b 0%, #f6416c 30%, #a8edea 100%)',
    rarity: 'rare'
  },
  {
    id: 'bg_dawn_sky',
    name: 'ドーンスカイ',
    description: '夜明けの空の神秘的な色合い',
    type: 'background',
    price: 90,
    preview: 'linear-gradient(135deg, #ff6a00 0%, #ee0979 50%, #ff6a00 100%)',
    rarity: 'rare'
  },

  // 🌊 オーシャン・ウォーターシリーズ（コモン〜レア）
  {
    id: 'bg_ocean_breeze',
    name: 'オーシャンブリーズ',
    description: '深海のような青と緑の神秘的なグラデーション',
    type: 'background',
    price: 40,
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    rarity: 'common'
  },
  {
    id: 'bg_tropical_blue',
    name: 'トロピカルブルー',
    description: '南国の海のような鮮やかな青緑',
    type: 'background',
    price: 60,
    preview: 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)',
    rarity: 'common'
  },
  {
    id: 'bg_deep_ocean',
    name: 'ディープオーシャン',
    description: '深海の神秘的な青の世界',
    type: 'background',
    price: 80,
    preview: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #74b9ff 100%)',
    rarity: 'rare'
  },
  {
    id: 'bg_aqua_marine',
    name: 'アクアマリン',
    description: '宝石のような透明感のある青緑',
    type: 'background',
    price: 70,
    preview: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    rarity: 'rare'
  },
  {
    id: 'bg_crystal_lake',
    name: 'クリスタルレイク',
    description: '水晶のように澄んだ湖の色合い',
    type: 'background',
    price: 85,
    preview: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 30%, #6c5ce7 100%)',
    rarity: 'rare'
  },

  // 🌲 フォレスト・ネイチャーシリーズ（コモン〜レア）
  {
    id: 'bg_forest_mist',
    name: 'フォレストミスト',
    description: '森の朝霧をイメージした緑と青のグラデーション',
    type: 'background',
    price: 45,
    preview: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    rarity: 'common'
  },
  {
    id: 'bg_emerald_forest',
    name: 'エメラルドフォレスト',
    description: 'エメラルドのような深い緑の森',
    type: 'background',
    price: 75,
    preview: 'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)',
    rarity: 'rare'
  },
  {
    id: 'bg_mountain_meadow',
    name: 'マウンテンメドウ',
    description: '高原の草原のような爽やかな緑',
    type: 'background',
    price: 80,
    preview: 'linear-gradient(135deg, #74b9ff 0%, #00b894 50%, #00cec9 100%)',
    rarity: 'rare'
  },
  {
    id: 'bg_spring_garden',
    name: 'スプリングガーデン',
    description: '春の庭園のような新緑の輝き',
    type: 'background',
    price: 65,
    preview: 'linear-gradient(135deg, #56ab2f 0%, #a8e6cf 50%, #dcedc1 100%)',
    rarity: 'rare'
  },

  // 💜 パープル・マジックシリーズ（レア〜エピック）
  {
    id: 'bg_purple_dream',
    name: 'パープルドリーム',
    description: '夢の中のような紫とピンクの幻想的なグラデーション',
    type: 'background',
    price: 90,
    preview: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
    rarity: 'rare'
  },
  {
    id: 'bg_mystic_purple',
    name: 'ミスティックパープル',
    description: '神秘的な紫の魔法のような色合い',
    type: 'background',
    price: 120,
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    rarity: 'epic'
  },
  {
    id: 'bg_violet_symphony',
    name: 'バイオレットシンフォニー',
    description: 'バイオレットの美しいハーモニー',
    type: 'background',
    price: 130,
    preview: 'linear-gradient(135deg, #8360c3 0%, #2ebf91 50%, #f093fb 100%)',
    rarity: 'epic'
  },
  {
    id: 'bg_galaxy_dust',
    name: 'ギャラクシーダスト',
    description: '銀河の星屑のような美しいグラデーション',
    type: 'background',
    price: 140,
    preview: 'linear-gradient(135deg, #4c63d2 0%, #9867f0 30%, #ff9a9e 70%, #fecfef 100%)',
    rarity: 'epic'
  },

  // 🌸 ピンク・フローラルシリーズ（コモン〜レア）
  {
    id: 'bg_cherry_blossom',
    name: 'チェリーブロッサム',
    description: '桜の花びらのような優美なピンク',
    type: 'background',
    price: 55,
    preview: 'linear-gradient(135deg, #ffedef 0%, #f093fb 50%, #fa709a 100%)',
    rarity: 'common'
  },
  {
    id: 'bg_pink_velvet',
    name: 'ピンクベルベット',
    description: 'ベルベットのような滑らかなピンク',
    type: 'background',
    price: 85,
    preview: 'linear-gradient(135deg, #ff9a9e 0%, #f6416c 50%, #e84393 100%)',
    rarity: 'rare'
  },
  {
    id: 'bg_rose_garden',
    name: 'ローズガーデン',
    description: 'バラ園のような上品なピンク',
    type: 'background',
    price: 75,
    preview: 'linear-gradient(135deg, #ff9a8b 0%, #f6416c 30%, #ffeef8 100%)',
    rarity: 'rare'
  },
  {
    id: 'bg_cotton_candy',
    name: 'コットンキャンディ',
    description: '綿あめのような甘いピンク',
    type: 'background',
    price: 70,
    preview: 'linear-gradient(135deg, #ffeef8 0%, #f093fb 30%, #a8edea 100%)',
    rarity: 'rare'
  },

  // 🔥 ファイア・ウォームシリーズ（レア〜エピック）
  {
    id: 'bg_fire_sunset',
    name: 'ファイアサンセット',
    description: '炎のような情熱的な夕日の色',
    type: 'background',
    price: 110,
    preview: 'linear-gradient(135deg, #ff6a00 0%, #ee0979 30%, #f6416c 70%, #ff9a8b 100%)',
    rarity: 'epic'
  },
  {
    id: 'bg_lava_flow',
    name: 'ラバフロウ',
    description: '溶岩のような燃えるような赤とオレンジ',
    type: 'background',
    price: 150,
    preview: 'linear-gradient(135deg, #2c1810 0%, #8b0000 30%, #ff4500 70%, #ffd700 100%)',
    rarity: 'epic'
  },
  {
    id: 'bg_phoenix_wing',
    name: 'フェニックスウィング',
    description: '不死鳥の翼のような神秘的な炎の色',
    type: 'background',
    price: 160,
    preview: 'linear-gradient(135deg, #ff8a00 0%, #e52e71 25%, #9d50bb 50%, #6e48aa 75%, #2d1b69 100%)',
    rarity: 'epic'
  },

  // ❄️ アイス・ウィンターシリーズ（レア〜エピック）
  {
    id: 'bg_winter_frost',
    name: 'ウィンターフロスト',
    description: '冬の霜のような清々しい青白',
    type: 'background',
    price: 95,
    preview: 'linear-gradient(135deg, #e6f3ff 0%, #74b9ff 30%, #0984e3 70%, #2d3436 100%)',
    rarity: 'rare'
  },
  {
    id: 'bg_ice_crystal',
    name: 'アイスクリスタル',
    description: '氷の結晶のような美しい青と白',
    type: 'background',
    price: 125,
    preview: 'linear-gradient(135deg, #f7f1e3 0%, #74b9ff 30%, #6c5ce7 70%, #a29bfe 100%)',
    rarity: 'epic'
  },
  {
    id: 'bg_arctic_aurora',
    name: 'アークティックオーロラ',
    description: '北極のオーロラのような幻想的な光',
    type: 'background',
    price: 135,
    preview: 'linear-gradient(135deg, #00cec9 0%, #74b9ff 25%, #6c5ce7 50%, #a29bfe 75%, #fd79a8 100%)',
    rarity: 'epic'
  },

  // 🌌 コズミック・スペースシリーズ（エピック〜レジェンダリー）
  {
    id: 'bg_cosmic_nebula',
    name: 'コズミックネビュラ',
    description: '宇宙の星雲のような壮大な紫と青のグラデーション',
    type: 'background',
    price: 120,
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    rarity: 'epic'
  },
  {
    id: 'bg_stellar_gateway',
    name: 'ステラゲートウェイ',
    description: '星々への門のような神秘的な色合い',
    type: 'background',
    price: 200,
    preview: 'linear-gradient(135deg, #1e2761 0%, #3a1c71 20%, #d76d77 40%, #ffaf7b 60%, #ffeaa7 80%, #fdcb6e 100%)',
    rarity: 'legendary'
  },
  {
    id: 'bg_galactic_storm',
    name: 'ギャラクティックストーム',
    description: '銀河の嵐のような圧倒的な美しさ',
    type: 'background',
    price: 220,
    preview: 'linear-gradient(135deg, #2c3e50 0%, #4a569d 20%, #8b5fbf 40%, #e74c3c 60%, #f39c12 80%, #f1c40f 100%)',
    rarity: 'legendary'
  },
  {
    id: 'bg_supernova',
    name: 'スーパーノヴァ',
    description: '超新星爆発のような究極の輝き',
    type: 'background',
    price: 280,
    preview: 'linear-gradient(135deg, #000000 0%, #2c3e50 15%, #8e44ad 30%, #e74c3c 45%, #f39c12 60%, #f1c40f 75%, #ffffff 100%)',
    rarity: 'legendary'
  },

  // 🌈 レインボー・プリズムシリーズ（エピック〜レジェンダリー）
  {
    id: 'bg_aurora_borealis',
    name: 'オーロラボレアリス',
    description: '北極光の美しさを再現した希少なグラデーション',
    type: 'background',
    price: 180,
    preview: 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
    rarity: 'legendary'
  },
  {
    id: 'bg_rainbow_prism',
    name: 'レインボープリズム',
    description: '虹色の光を分解したような究極のグラデーション',
    type: 'background',
    price: 250,
    preview: 'linear-gradient(135deg, #ff0000 0%, #ff8000 16.66%, #ffff00 33.33%, #80ff00 50%, #00ffff 66.66%, #8000ff 83.33%, #ff0080 100%)',
    rarity: 'legendary'
  },
  {
    id: 'bg_spectrum_wave',
    name: 'スペクトラムウェーブ',
    description: 'すべての色が調和した理想的なスペクトラム',
    type: 'background',
    price: 300,
    preview: 'linear-gradient(45deg, #ff006e, #ff8500, #ffbe0b, #8fb339, #52b69a, #34a0a4, #168aad, #1a759f, #1e6091, #184e77)',
    rarity: 'legendary'
  },

  // 🎨 アーティスティック・アブストラクトシリーズ（エピック〜レジェンダリー）
  {
    id: 'bg_abstract_art',
    name: 'アブストラクトアート',
    description: '抽象芸術のような芸術的なグラデーション',
    type: 'background',
    price: 170,
    preview: 'linear-gradient(45deg, #ff9a9e 0%, #fecfef 20%, #a8edea 40%, #fed6e3 60%, #d299c2 80%, #fef9d7 100%)',
    rarity: 'legendary'
  },
  {
    id: 'bg_paint_splash',
    name: 'ペイントスプラッシュ',
    description: '絵の具が飛び散ったような躍動感のある色',
    type: 'background',
    price: 240,
    preview: 'radial-gradient(circle at 20% 50%, #ff006e 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8338ec 0%, transparent 50%), radial-gradient(circle at 40% 80%, #3a86ff 0%, transparent 50%), linear-gradient(135deg, #06ffa5, #ffd23f)',
    rarity: 'legendary'
  },
  {
    id: 'bg_watercolor_dream',
    name: 'ウォーターカラードリーム',
    description: '水彩画のような透明感のある美しい色合い',
    type: 'background',
    price: 190,
    preview: 'linear-gradient(135deg, rgba(255, 154, 158, 0.8), rgba(254, 207, 239, 0.8), rgba(168, 237, 234, 0.8), rgba(254, 214, 227, 0.8))',
    rarity: 'legendary'
  },

  // 🌟 ルクス・プレミアムシリーズ（レジェンダリー）
  {
    id: 'bg_platinum_elegance',
    name: 'プラチナエレガンス',
    description: 'プラチナのような上品で洗練された輝き',
    type: 'background',
    price: 350,
    preview: 'linear-gradient(135deg, #f7f1e3 0%, #e8e8e8 20%, #ffffff 40%, #f0f0f0 60%, #d3d3d3 80%, #c0c0c0 100%)',
    rarity: 'legendary'
  },
  {
    id: 'bg_golden_luxury',
    name: 'ゴールデンラグジュアリー',
    description: '金の輝きを表現した究極の贅沢',
    type: 'background',
    price: 400,
    preview: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
    rarity: 'legendary'
  },
  {
    id: 'bg_diamond_sparkle',
    name: 'ダイアモンドスパークル',
    description: 'ダイアモンドのような眩しい輝き',
    type: 'background',
    price: 450,
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
    rarity: 'legendary'
  },
  {
    id: 'bg_royal_majesty',
    name: 'ロイヤルマジェスティ',
    description: '王室のような威厳と美しさを兼ね備えた最高級',
    type: 'background',
    price: 500,
    preview: 'linear-gradient(135deg, #141e30 0%, #243b55 25%, #8b5fbf 50%, #f39c12 75%, #f1c40f 100%)',
    rarity: 'legendary'
  },

  // 🌿 ヒーリング・ナチュラルシリーズ（コモン〜レア）
  {
    id: 'bg_bamboo_zen',
    name: 'バンブーゼン',
    description: '竹林のような落ち着いた緑の世界',
    type: 'background',
    price: 60,
    preview: 'linear-gradient(135deg, #e8f5e8 0%, #a8e6a3 50%, #74c776 100%)',
    rarity: 'common'
  },
  {
    id: 'bg_lavender_fields',
    name: 'ラベンダーフィールズ',
    description: 'ラベンダー畑のような癒しの紫',
    type: 'background',
    price: 80,
    preview: 'linear-gradient(135deg, #e8e8ff 0%, #d8b9ff 50%, #b19cd9 100%)',
    rarity: 'rare'
  },
  {
    id: 'bg_tea_ceremony',
    name: 'ティーセレモニー',
    description: '茶道のような静寂で上品な色合い',
    type: 'background',
    price: 85,
    preview: 'linear-gradient(135deg, #f5f5dc 0%, #ddd5b8 50%, #b8b09a 100%)',
    rarity: 'rare'
  }
];

/**
 * Firebaseエラーを日本語メッセージに変換
 */
const translateFirebaseError = (errorCode: string): string => {
  switch (errorCode) {
    case 'permission-denied':
      return 'アクセス権限がありません。ログインし直してください。';
    case 'not-found':
      return 'データが見つかりませんでした。';
    case 'already-exists':
      return 'データが既に存在します。';
    case 'failed-precondition':
      return 'データの前提条件が満たされていません。';
    case 'invalid-argument':
      return '無効な引数が指定されました。';
    case 'unauthenticated':
      return '認証が必要です。ログインしてください。';
    case 'unavailable':
      return 'サービスが一時的に利用できません。しばらく後でお試しください。';
    default:
      return `エラーが発生しました: ${errorCode}`;
  }
};

/**
 * ポイントショップ管理Zustandストア
 */
export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      shopItems: SHOP_ITEMS,
      userPurchases: [],
      loading: false,
      error: null, // 🔥 追加: エラー状態

      /**
       * ショップアイテムを読み込む（将来的にFirestoreから取得予定）
       */
      loadShopItems: () => {
        // 現在は固定アイテムを使用
        // 将来的にはFirestoreからアイテム情報を取得
        set({ shopItems: SHOP_ITEMS, error: null });
      },

      /**
       * 🔥 修正: ユーザーの購入履歴を読み込む（エラーハンドリング強化）
       */
      loadUserPurchases: async () => {
        const user = useAuthStore.getState().user;
        if (!user) {
          console.log("ユーザーがログインしていないため、購入履歴を取得できません");
          set({ userPurchases: [], error: null });
          return;
        }

        set({ loading: true, error: null });
        
        try {
          console.log(`ユーザー ${user.uid} の購入履歴を取得中...`);
          
          const purchasesQuery = query(
            collection(db, "shopPurchases"),
            where("userId", "==", user.uid)
          );
          
          const snapshot = await getDocs(purchasesQuery);
          const purchases = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as UserPurchase[];
          
          // タイムスタンプでソート（新しい順）
          purchases.sort((a, b) => b.purchaseTime - a.purchaseTime);
          
          set({ userPurchases: purchases, loading: false, error: null });
          console.log("ショップ購入履歴を取得成功:", purchases.length, "件");
          
        } catch (error: any) {
          console.error("ショップ購入履歴読み込みエラー:", error);
          
          const errorMessage = error.code ? 
            translateFirebaseError(error.code) : 
            "購入履歴の読み込みに失敗しました";
          
          set({ 
            userPurchases: [], 
            loading: false, 
            error: errorMessage 
          });
          
          // フィードバックでエラーを表示
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage(`❌ ${errorMessage}`);
        }
      },

      /**
       * 🔥 修正: アイテムを購入する（テーマストア連携強化）
       */
      purchaseItem: async (itemId) => {
        const user = useAuthStore.getState().user;
        const pointStore = usePointStore.getState();
        
        if (!user) {
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage("❌ ログインが必要です");
          return false;
        }

        const item = get().getItemById(itemId);
        if (!item) {
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage("❌ アイテムが見つかりません");
          return false;
        }

        // 購入可能チェック
        if (!get().canPurchaseItem(itemId)) {
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage("❌ このアイテムは購入できません");
          return false;
        }

        // ポイント不足チェック
        const currentPoints = pointStore.userPoints?.currentPoints || 0;
        if (currentPoints < item.price) {
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage(`❌ ポイントが不足しています（必要: ${item.price}pt）`);
          return false;
        }

        set({ error: null }); // エラー状態をクリア
        
        try {
          console.log(`アイテム購入開始: ${item.name} (${item.price}pt)`);
          
          const today = new Date().toISOString().split('T')[0];
          
          // 🔥 修正: サーバータイムスタンプを使用して確実にデータを保存
          const purchaseData = {
            userId: user.uid,
            itemId: item.id,
            purchaseDate: today,
            purchaseTime: Date.now(),
            pointsSpent: item.price,
            createdAt: serverTimestamp() // 🔥 追加: サーバータイムスタンプ
          };
          
          console.log("購入データ:", purchaseData);
          
          // 🔥 修正: トランザクション的にポイント消費と購入履歴を処理
          
          // 1. まず購入履歴を記録
          const docRef = await addDoc(collection(db, "shopPurchases"), purchaseData);
          console.log("購入履歴をFirestoreに保存完了:", docRef.id);
          
          // 2. ポイントを消費
          await pointStore.removePoints(
            'game_play', // ショップ購入もgame_playタイプを使用
            item.price,
            `ショップで「${item.name}」を購入`,
            undefined,
            false, // 総獲得ポイントには影響しない
            undefined
          );
          console.log("ポイント消費完了:", item.price);
          
          // 3. ローカル状態を更新
          const newPurchase: UserPurchase = {
            id: docRef.id,
            userId: user.uid,
            itemId: item.id,
            purchaseDate: today,
            purchaseTime: Date.now(),
            pointsSpent: item.price
          };
          
          set(state => ({
            userPurchases: [newPurchase, ...state.userPurchases],
            error: null
          }));
          
          // 🔥 修正: テーマストアに購入済みテーマを追加
          import('@/store/themeStore').then(({ useThemeStore }) => {
            const themeStore = useThemeStore.getState();
            themeStore.addPurchasedTheme(item.id);
            console.log('テーマストアに購入済みテーマを追加:', item.id);
          }).catch(error => {
            console.error('テーマストアの動的インポートに失敗:', error);
          });
          
          // 成功メッセージ
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage(`🎉「${item.name}」を購入しました！`);
          
          console.log(`ショップ購入完了: ${item.name} (${item.price}pt)`);
          return true;
          
        } catch (error: any) {
          console.error("ショップ購入エラー:", error);
          
          const errorMessage = error.code ? 
            translateFirebaseError(error.code) : 
            "購入処理に失敗しました";
          
          set({ error: errorMessage });
          
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage(`❌ ${errorMessage}`);
          
          // 詳細なエラー情報をコンソールに出力
          if (error.code === 'permission-denied') {
            console.error("🔥 Firestoreセキュリティルールを確認してください:");
            console.error("shopPurchasesコレクションに対する読み書き権限が必要です");
          }
          
          return false;
        }
      },

      /**
       * アイテムが購入可能かチェック
       */
      canPurchaseItem: (itemId) => {
        const user = useAuthStore.getState().user;
        if (!user) return false;
        
        // 既に購入済みかチェック
        if (get().hasPurchasedItem(itemId)) return false;
        
        const item = get().getItemById(itemId);
        if (!item) return false;
        
        // 期間限定アイテムの期限チェック
        if (item.isLimited && item.limitedUntil) {
          const today = new Date().toISOString().split('T')[0];
          if (today > item.limitedUntil) return false;
        }
        
        return true;
      },

      /**
       * アイテムを既に購入済みかチェック
       */
      hasPurchasedItem: (itemId) => {
        return get().userPurchases.some(purchase => purchase.itemId === itemId);
      },

      /**
       * 🔥 追加: エラーをクリア
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * IDでアイテムを取得
       */
      getItemById: (itemId) => {
        return get().shopItems.find(item => item.id === itemId);
      },

      /**
       * 購入履歴を取得
       */
      getPurchaseHistory: () => {
        return get().userPurchases;
      },

      /**
       * 総消費ポイントを計算
       */
      getTotalSpentPoints: () => {
        return get().userPurchases.reduce((total, purchase) => total + purchase.pointsSpent, 0);
      }
    }),
    {
      name: "shop-storage",
      partialize: (state) => ({
        // 購入履歴のみ永続化（アイテム情報は固定）
        userPurchases: state.userPurchases
      })
    }
  )
);