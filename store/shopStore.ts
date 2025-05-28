/**
 * ポイントショップ管理ストア
 * 
 * ポイントで購入できるアイテム（背景テーマなど）を管理するZustandストア
 * v1.6.0: 新機能 - グラデーション背景ショップ
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
  getDocs 
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
  
  // アイテム管理
  loadShopItems: () => void;
  loadUserPurchases: () => Promise<void>;
  
  // 購入機能
  purchaseItem: (itemId: string) => Promise<boolean>;
  canPurchaseItem: (itemId: string) => boolean;
  hasPurchasedItem: (itemId: string) => boolean;
  
  // ユーティリティ
  getItemById: (itemId: string) => ShopItem | undefined;
  getPurchaseHistory: () => UserPurchase[];
  getTotalSpentPoints: () => number;
}

/**
 * 利用可能なショップアイテム（グラデーション背景）
 */
const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'bg_sunset_wave',
    name: 'サンセットウェーブ',
    description: '夕日のような温かいオレンジとピンクのグラデーション',
    type: 'background',
    price: 50,
    preview: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
    rarity: 'common'
  },
  {
    id: 'bg_ocean_breeze',
    name: 'オーシャンブリーズ',
    description: '深海のような青と緑の神秘的なグラデーション',
    type: 'background',
    price: 50,
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    rarity: 'common'
  },
  {
    id: 'bg_forest_mist',
    name: 'フォレストミスト',
    description: '森の朝霧をイメージした緑と青のグラデーション',
    type: 'background',
    price: 75,
    preview: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    rarity: 'rare'
  },
  {
    id: 'bg_purple_dream',
    name: 'パープルドリーム',
    description: '夢の中のような紫とピンクの幻想的なグラデーション',
    type: 'background',
    price: 75,
    preview: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
    rarity: 'rare'
  },
  {
    id: 'bg_golden_hour',
    name: 'ゴールデンアワー',
    description: '黄金の時間をイメージした贅沢なグラデーション',
    type: 'background',
    price: 100,
    preview: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    rarity: 'epic'
  },
  {
    id: 'bg_cosmic_nebula',
    name: 'コズミックネビュラ',
    description: '宇宙の星雲のような壮大な紫と青のグラデーション',
    type: 'background',
    price: 100,
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    rarity: 'epic'
  },
  {
    id: 'bg_aurora_borealis',
    name: 'オーロラボレアリス',
    description: '北極光の美しさを再現した希少なグラデーション',
    type: 'background',
    price: 200,
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
  }
];

/**
 * ポイントショップ管理Zustandストア
 */
export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      shopItems: SHOP_ITEMS,
      userPurchases: [],
      loading: false,

      /**
       * ショップアイテムを読み込む（将来的にFirestoreから取得予定）
       */
      loadShopItems: () => {
        // 現在は固定アイテムを使用
        // 将来的にはFirestoreからアイテム情報を取得
        set({ shopItems: SHOP_ITEMS });
      },

      /**
       * ユーザーの購入履歴を読み込む
       */
      loadUserPurchases: async () => {
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ userPurchases: [] });
          return;
        }

        set({ loading: true });
        try {
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
          
          set({ userPurchases: purchases });
          console.log("ショップ購入履歴を取得:", purchases.length, "件");
          
        } catch (error) {
          console.error("ショップ購入履歴読み込みエラー:", error);
          set({ userPurchases: [] });
        } finally {
          set({ loading: false });
        }
      },

      /**
       * アイテムを購入する
       */
      purchaseItem: async (itemId) => {
        const user = useAuthStore.getState().user;
        const pointStore = usePointStore.getState();
        
        if (!user) {
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage("ログインが必要です");
          return false;
        }

        const item = get().getItemById(itemId);
        if (!item) {
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage("アイテムが見つかりません");
          return false;
        }

        // 購入可能チェック
        if (!get().canPurchaseItem(itemId)) {
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage("このアイテムは購入できません");
          return false;
        }

        // ポイント不足チェック
        const currentPoints = pointStore.userPoints?.currentPoints || 0;
        if (currentPoints < item.price) {
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage(`ポイントが不足しています（必要: ${item.price}pt）`);
          return false;
        }

        try {
          const today = new Date().toISOString().split('T')[0];
          
          // ポイントを消費
          await pointStore.removePoints(
            'game_play', // ショップ購入もgame_playタイプを使用
            item.price,
            `ショップで「${item.name}」を購入`,
            undefined,
            false, // 総獲得ポイントには影響しない
            undefined
          );
          
          // 購入履歴を記録
          const purchaseData: Omit<UserPurchase, 'id'> = {
            userId: user.uid,
            itemId: item.id,
            purchaseDate: today,
            purchaseTime: Date.now(),
            pointsSpent: item.price
          };
          
          const docRef = await addDoc(collection(db, "shopPurchases"), purchaseData);
          
          // ローカル状態を更新
          const newPurchase: UserPurchase = {
            id: docRef.id,
            ...purchaseData
          };
          
          set(state => ({
            userPurchases: [newPurchase, ...state.userPurchases]
          }));
          
          // 成功メッセージ
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage(`🎉「${item.name}」を購入しました！`);
          
          console.log(`ショップ購入完了: ${item.name} (${item.price}pt)`);
          return true;
          
        } catch (error) {
          console.error("ショップ購入エラー:", error);
          
          const feedbackStore = useFeedbackStore.getState();
          feedbackStore.setMessage("購入処理に失敗しました");
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