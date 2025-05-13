/**
 * ポイントショップコンポーネント
 * 
 * ユーザーがポイントを使って様々なアイテムを購入できるショップ
 * テーマ、サウンド、ゲームなどのカテゴリから選択可能
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePointsStore } from '@/store/pointsStore';
import { useAuthStore } from '@/store/auth';
import { useFeedbackStore } from '@/store/feedbackStore';
import { useThemeStore } from '@/store/themeStore';
import { useSoundStore } from '@/store/soundStore';
import { useUserPurchasesStore } from '@/store/userPurchasesStore';
import { useGameStore } from '@/store/gameStore';

// ショップアイテムのカテゴリ
type Category = 'themes' | 'sounds' | 'games';

// ショップアイテムの型定義
interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  icon: string;
  preview?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

// テーマアイテムの拡張型
interface ThemeItem extends ShopItem {
  category: 'themes';
  bgColor: string;
  accentColor: string;
  preview: string;
}

// サウンドアイテムの拡張型
interface SoundItem extends ShopItem {
  category: 'sounds';
  audioUrl: string;
  preview: string;
}

// ゲームアイテムの拡張型
interface GameItem extends ShopItem {
  category: 'games';
  gameType: 'dinosaur' | 'flappy';
  playUrl: string;
}

/**
 * ショップアイテムの定義
 */
const SHOP_ITEMS: ShopItem[] = [
  // テーマ
  {
    id: 'theme-ocean',
    name: '海のテーマ',
    description: '深い青色と海の泡をイメージしたテーマ',
    price: 30,
    category: 'themes',
    icon: '🌊',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    rarity: 'common'
  } as ThemeItem,
  {
    id: 'theme-forest',
    name: '森のテーマ',
    description: '緑豊かな森をイメージしたアースカラー',
    price: 30,
    category: 'themes',
    icon: '🌲',
    preview: 'linear-gradient(135deg, #74b9ff 0%, #00b894 100%)',
    rarity: 'common'
  } as ThemeItem,
  {
    id: 'theme-sunset',
    name: '夕焼けテーマ',
    description: '美しい夕日を表現したグラデーション',
    price: 50,
    category: 'themes',
    icon: '🌅',
    preview: 'linear-gradient(135deg, #ff7675 0%, #fab1a0 100%)',
    rarity: 'rare'
  } as ThemeItem,
  {
    id: 'theme-galaxy',
    name: '銀河テーマ',
    description: '宇宙の神秘を表現した高級テーマ',
    price: 100,
    category: 'themes',
    icon: '🌌',
    preview: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #2d1b69 100%)',
    rarity: 'legendary'
  } as ThemeItem,
  
  // サウンド
  {
    id: 'sound-nature',
    name: '自然音パック',
    description: '鳥のさえずりや川のせせらぎ',
    price: 25,
    category: 'sounds',
    icon: '🎵',
    audioUrl: '/sounds/nature-pack.mp3',
    preview: 'forest-birds-stream',
    rarity: 'common'
  } as SoundItem,
  {
    id: 'sound-electronic',
    name: 'エレクトロニックパック',
    description: 'モダンな電子音とビープ音',
    price: 25,
    category: 'sounds',
    icon: '🎹',
    audioUrl: '/sounds/electronic-pack.mp3',
    preview: 'synth-beeps-digital',
    rarity: 'common'
  } as SoundItem,
  {
    id: 'sound-retro',
    name: 'レトロゲーム音パック',
    description: 'ファミコン風のレトロサウンド',
    price: 40,
    category: 'sounds',
    icon: '🕹️',
    audioUrl: '/sounds/retro-pack.mp3',
    preview: '8bit-chiptune-classic',
    rarity: 'rare'
  } as SoundItem,
  {
    id: 'sound-orchestra',
    name: 'オーケストラパック',
    description: '壮大なオーケストラサウンド',
    price: 75,
    category: 'sounds',
    icon: '🎼',
    audioUrl: '/sounds/orchestra-pack.mp3',
    preview: 'symphonic-classical-epic',
    rarity: 'epic'
  } as SoundItem,
  
  // ゲーム
  {
    id: 'game-dino',
    name: 'ディノラン',
    description: 'Chrome恐竜ゲーム風のエンドレスラン',
    price: 5,
    category: 'games',
    icon: '🦕',
    gameType: 'dinosaur',
    playUrl: '/games/dino-run',
    rarity: 'common'
  } as GameItem,
  {
    id: 'game-flappy',
    name: 'フライングバード',
    description: 'Flappy Bird風の難しいゲーム',
    price: 5,
    category: 'games',
    icon: '🐦',
    gameType: 'flappy',
    playUrl: '/games/flappy-bird',
    rarity: 'common'
  } as GameItem
];

/**
 * レア度に応じたスタイルを取得
 */
const getRarityStyle = (rarity: string) => {
  switch (rarity) {
    case 'common':
      return 'border-gray-300 bg-gray-50';
    case 'rare':
      return 'border-blue-300 bg-blue-50 shadow-blue-100';
    case 'epic':
      return 'border-purple-300 bg-purple-50 shadow-purple-100';
    case 'legendary':
      return 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-yellow-200';
    default:
      return 'border-gray-300 bg-gray-50';
  }
};

/**
 * レア度テキストを取得
 */
const getRarityText = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'コモン';
    case 'rare': return 'レア';
    case 'epic': return 'エピック';
    case 'legendary': return 'レジェンダリー';
    default: return '';
  }
};

/**
 * ポイントショップコンポーネント
 */
const PointsShop = () => {
  const { totalPoints, usePoints } = usePointsStore();
  const { user } = useAuthStore();
  const { setMessage } = useFeedbackStore();
  const { ownedItems, purchaseItem, hasItem } = useUserPurchasesStore();
  const { openGame } = useGameStore();
  
  // ローカル状態
  const [selectedCategory, setSelectedCategory] = useState<Category>('themes');
  const [previewItem, setPreviewItem] = useState<ShopItem | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // カテゴリ絞り込み
  const filteredItems = SHOP_ITEMS.filter(item => item.category === selectedCategory);
  
  /**
   * アイテムを購入する
   */
  const handlePurchase = async (item: ShopItem) => {
    if (!user) {
      setMessage('ログインが必要です');
      return;
    }
    
    // 既に所有しているかチェック
    if (hasItem(item.id)) {
      setMessage('既に購入済みのアイテムです');
      return;
    }
    
    // ポイント不足チェック
    if (totalPoints < item.price) {
      setMessage(`ポイントが不足しています（必要: ${item.price}、現在: ${totalPoints}）`);
      return;
    }
    
    // ポイントを消費
    const success = await usePoints(item.price, `${item.name}の購入`);
    if (!success) {
      setMessage('購入に失敗しました');
      return;
    }
    
    // アイテムを所有リストに追加
    await purchaseItem(item);
    
    // カテゴリ別の購入後処理
    if (item.category === 'themes') {
      setMessage(`${item.name}を購入しました！設定から適用できます`);
    } else if (item.category === 'sounds') {
      setMessage(`${item.name}を購入しました！新しいサウンドが使用可能です`);
    } else if (item.category === 'games') {
      setMessage(`${item.name}を購入しました！今すぐプレイできます`);
      // ゲームを即座に開く
      setTimeout(() => {
        handleGamePlay(item as GameItem);
      }, 1000);
    }
  };
  
  /**
   * ゲームをプレイする
   */
  const handleGamePlay = async (game: GameItem) => {
    if (!user) {
      setMessage('ログインが必要です');
      return;
    }
    
    // 既に購入済みかチェック
    if (!hasItem(game.id)) {
      setMessage('このゲームを購入してください');
      return;
    }
    
    // ゲームを開く
    openGame(game.gameType, game.playUrl);
  };
  
  /**
   * テーマをプレビューする
   */
  const handleThemePreview = (theme: ThemeItem) => {
    const store = useThemeStore.getState();
    store.setBgColor(theme.bgColor);
    setPreviewItem(theme);
    setIsPreviewMode(true);
    
    // 3秒後に元に戻す
    setTimeout(() => {
      if (isPreviewMode) {
        // 元のテーマに戻す logic here
        setIsPreviewMode(false);
        setPreviewItem(null);
      }
    }, 3000);
  };
  
  /**
   * カテゴリタブのレンダリング
   */
  const CategoryTabs = () => (
    <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
      {[
        { id: 'themes', label: 'テーマ', icon: '🎨' },
        { id: 'sounds', label: 'サウンド', icon: '🎵' },
        { id: 'games', label: 'ゲーム', icon: '🎮' }
      ].map((category) => (
        <button
          key={category.id}
          onClick={() => setSelectedCategory(category.id as Category)}
          className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md transition-all ${
            selectedCategory === category.id
              ? 'bg-white shadow-md text-blue-600 font-semibold'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <span className="mr-2">{category.icon}</span>
          {category.label}
        </button>
      ))}
    </div>
  );
  
  /**
   * アイテムカードのレンダリング
   */
  const ItemCard = ({ item }: { item: ShopItem }) => {
    const isOwned = hasItem(item.id);
    const canAfford = totalPoints >= item.price;
    
    return (
      <motion.div
        className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${getRarityStyle(item.rarity || 'common')}`}
        whileHover={{ y: -5 }}
        layout
      >
        {/* ヘッダー */}
        <div className="flex justify-between items-start mb-3">
          <div className="text-3xl">{item.icon}</div>
          {item.rarity && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              item.rarity === 'legendary' ? 'bg-yellow-200 text-yellow-800' :
              item.rarity === 'epic' ? 'bg-purple-200 text-purple-800' :
              item.rarity === 'rare' ? 'bg-blue-200 text-blue-800' :
              'bg-gray-200 text-gray-800'
            }`}>
              {getRarityText(item.rarity)}
            </span>
          )}
        </div>
        
        <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
        <p className="text-sm text-gray-600 mb-4">{item.description}</p>
        
        {/* プレビュー （テーマの場合）*/}
        {item.category === 'themes' && (
          <div 
            className="h-8 rounded-md mb-3 cursor-pointer border"
            style={{ background: (item as ThemeItem).preview }}
            onClick={() => handleThemePreview(item as ThemeItem)}
            title="クリックでプレビュー"
          />
        )}
        
        {/* 価格とボタン */}
        <div className="flex justify-between items-center">
          <span className="text-blue-600 font-bold">{item.price} pt</span>
          
          {isOwned ? (
            <>
              {item.category === 'games' ? (
                <button
                  onClick={() => handleGamePlay(item as GameItem)}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                >
                  プレイ
                </button>
              ) : (
                <span className="text-green-600 font-medium">購入済み</span>
              )}
            </>
          ) : (
            <button
              onClick={() => handlePurchase(item)}
              disabled={!canAfford}
              className={`px-4 py-2 rounded-md transition-colors ${
                canAfford
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              購入
            </button>
          )}
        </div>
      </motion.div>
    );
  };
  
  // ログインしていない場合の表示
  if (!user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">🛍️ ポイントショップ</h2>
        <p className="text-gray-600">ログインするとショップを利用できます</p>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">🛍️ ポイントショップ</h2>
        <div className="bg-blue-100 px-4 py-2 rounded-lg">
          <span className="text-blue-700 font-semibold">
            現在のポイント: {totalPoints} pt
          </span>
        </div>
      </div>
      
      {/* プレビュー通知 */}
      <AnimatePresence>
        {isPreviewMode && previewItem && (
          <motion.div
            className="bg-yellow-100 border border-yellow-300 p-3 rounded-lg mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <p className="text-yellow-800">
              <span className="font-semibold">{previewItem.name}</span> をプレビュー中... 
              <span className="text-sm ml-2">(3秒後に元に戻ります)</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* カテゴリタブ */}
      <CategoryTabs />
      
      {/* アイテムグリッド */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        layout
      >
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <ItemCard item={item} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      
      {/* カテゴリが空の場合 */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">このカテゴリにはまだアイテムがありません</p>
        </div>
      )}
    </div>
  );
};

export default PointsShop;