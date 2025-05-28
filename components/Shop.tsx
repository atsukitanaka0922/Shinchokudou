/**
 * ポイントショップコンポーネント
 * 
 * ポイントで購入できるアイテム（背景テーマなど）を表示・購入するコンポーネント
 * v1.6.0: 新機能 - グラデーション背景ショップ
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShopStore, ShopItem } from '@/store/shopStore';
import { usePointStore } from '@/store/pointStore';
import { useThemeStore, PURCHASABLE_BACKGROUNDS } from '@/store/themeStore';
import { useAuthStore } from '@/store/auth';

/**
 * ポイントショップコンポーネント
 */
export default function Shop() {
  const { user } = useAuthStore();
  const { userPoints } = usePointStore();
  const { setBackgroundTheme, backgroundTheme } = useThemeStore();
  const { 
    shopItems, 
    userPurchases, 
    loading,
    loadShopItems,
    loadUserPurchases,
    purchaseItem,
    canPurchaseItem,
    hasPurchasedItem,
    getTotalSpentPoints
  } = useShopStore();
  
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'background'>('background');
  const [previewItem, setPreviewItem] = useState<ShopItem | null>(null);
  const [purchasingItem, setPurchasingItem] = useState<string | null>(null);

  // データ読み込み
  useEffect(() => {
    if (user) {
      loadShopItems();
      loadUserPurchases();
    }
  }, [user, loadShopItems, loadUserPurchases]);

  /**
   * アイテムを購入する
   */
  const handlePurchase = async (item: ShopItem) => {
    if (purchasingItem) return; // 重複防止
    
    setPurchasingItem(item.id);
    try {
      const success = await purchaseItem(item.id);
      if (success) {
        // 購入成功後にデータを再読み込み
        await loadUserPurchases();
      }
    } finally {
      setPurchasingItem(null);
    }
  };

  /**
   * 背景テーマを適用する
   */
  const handleApplyTheme = (item: ShopItem) => {
    const themeData = PURCHASABLE_BACKGROUNDS[item.id];
    if (themeData) {
      setBackgroundTheme(themeData);
    }
  };

  /**
   * レアリティに応じたスタイルを取得
   */
  const getRarityStyle = (rarity: ShopItem['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'border-gray-300 bg-gray-50';
      case 'rare':
        return 'border-blue-300 bg-blue-50';
      case 'epic':
        return 'border-purple-300 bg-purple-50';
      case 'legendary':
        return 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  /**
   * レアリティに応じたテキストスタイルを取得
   */
  const getRarityTextStyle = (rarity: ShopItem['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'text-gray-600';
      case 'rare':
        return 'text-blue-600';
      case 'epic':
        return 'text-purple-600';
      case 'legendary':
        return 'text-yellow-600 font-bold';
      default:
        return 'text-gray-600';
    }
  };

  /**
   * レアリティ表示テキストを取得
   */
  const getRarityText = (rarity: ShopItem['rarity']) => {
    switch (rarity) {
      case 'common': return 'コモン';
      case 'rare': return 'レア';
      case 'epic': return 'エピック';
      case 'legendary': return 'レジェンダリー';
      default: return '';
    }
  };

  // フィルターされたアイテム
  const filteredItems = shopItems.filter(item => {
    if (selectedCategory === 'all') return true;
    return item.type === selectedCategory;
  });

  // ユーザーがログインしていない場合
  if (!user) {
    return (
      <div className="p-6 bg-gray-100 rounded-lg shadow-md text-center">
        <h2 className="text-xl font-bold mb-4">🛍️ ポイントショップ</h2>
        <p className="text-gray-600">ログインするとショップを利用できます</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* ヘッダー */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">🛍️ ポイントショップ</h2>
          <div className="text-right">
            <div className="text-sm text-gray-600">保有ポイント</div>
            <div className="text-lg font-bold text-blue-600">
              💎 {userPoints?.currentPoints || 0}pt
            </div>
          </div>
        </div>
        
        {/* 統計情報 */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-600">購入済みアイテム</div>
            <div className="text-lg font-bold text-blue-800">{userPurchases.length}個</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-green-600">総消費ポイント</div>
            <div className="text-lg font-bold text-green-800">{getTotalSpentPoints()}pt</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-sm text-purple-600">今すぐ適用中</div>
            <div className="text-lg font-bold text-purple-800">{backgroundTheme.name}</div>
          </div>
        </div>
      </div>

      {/* カテゴリータブ */}
      <div className="px-4 py-2 border-b bg-gray-50">
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedCategory('background')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'background'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            🎨 背景テーマ
          </button>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            🛍️ すべて
          </button>
        </div>
      </div>

      {/* ショップアイテム一覧 */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">アイテムを読み込んでいます...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>このカテゴリにはアイテムがありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isPurchased = hasPurchasedItem(item.id);
              const canPurchase = canPurchaseItem(item.id);
              const isCurrentTheme = backgroundTheme.id === item.id;
              const currentPoints = userPoints?.currentPoints || 0;
              const hasEnoughPoints = currentPoints >= item.price;
              
              return (
                <motion.div
                  key={item.id}
                  className={`border-2 rounded-lg p-4 transition-all ${getRarityStyle(item.rarity)} ${
                    previewItem?.id === item.id ? 'ring-2 ring-blue-400' : ''
                  }`}
                  whileHover={{ scale: 1.02 }}
                  onMouseEnter={() => setPreviewItem(item)}
                  onMouseLeave={() => setPreviewItem(null)}
                >
                  {/* プレビュー */}
                  <div 
                    className="w-full h-20 rounded-lg mb-3 border border-gray-200 relative overflow-hidden"
                    style={{ 
                      background: item.preview,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {/* レアリティバッジ */}
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs ${getRarityTextStyle(item.rarity)} bg-white bg-opacity-90`}>
                      {getRarityText(item.rarity)}
                    </div>
                    
                    {/* 購入済みバッジ */}
                    {isPurchased && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        ✓ 購入済み
                      </div>
                    )}
                    
                    {/* 適用中バッジ */}
                    {isCurrentTheme && (
                      <div className="absolute bottom-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        🎨 適用中
                      </div>
                    )}
                  </div>
                  
                  {/* アイテム情報 */}
                  <div className="mb-3">
                    <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-blue-600">💎 {item.price}pt</span>
                      {!hasEnoughPoints && !isPurchased && (
                        <span className="text-xs text-red-500">ポイント不足</span>
                      )}
                    </div>
                  </div>
                  
                  {/* アクションボタン */}
                  <div className="space-y-2">
                    {isPurchased ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => handleApplyTheme(item)}
                          disabled={isCurrentTheme}
                          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                            isCurrentTheme
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          {isCurrentTheme ? '✓ 適用中' : '🎨 適用する'}
                        </button>
                        <div className="text-center">
                          <span className="text-xs text-green-600 font-medium">✓ 購入済み</span>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handlePurchase(item)}
                        disabled={!canPurchase || !hasEnoughPoints || purchasingItem === item.id}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                          !canPurchase || !hasEnoughPoints
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : purchasingItem === item.id
                              ? 'bg-blue-300 text-blue-700'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {purchasingItem === item.id ? (
                          <span className="flex items-center justify-center">
                            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                            購入中...
                          </span>
                        ) : !hasEnoughPoints ? (
                          `ポイント不足 (${item.price - currentPoints}pt 不足)`
                        ) : (
                          `💎 ${item.price}pt で購入`
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* プレビューモーダル */}
      <AnimatePresence>
        {previewItem && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewItem(null)}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold mb-2">{previewItem.name}</h3>
                <p className="text-gray-600 mb-4">{previewItem.description}</p>
              </div>
              
              {/* 大きなプレビュー */}
              <div 
                className="w-full h-32 rounded-lg mb-4 border border-gray-200"
                style={{ 
                  background: previewItem.preview,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              
              <div className="flex justify-between items-center mb-4">
                <span className={`px-3 py-1 rounded-full text-sm ${getRarityTextStyle(previewItem.rarity)} bg-opacity-20`}>
                  {getRarityText(previewItem.rarity)}
                </span>
                <span className="text-lg font-bold text-blue-600">💎 {previewItem.price}pt</span>
              </div>
              
              <button
                onClick={() => setPreviewItem(null)}
                className="w-full py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                閉じる
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 購入履歴セクション */}
      {userPurchases.length > 0 && (
        <div className="p-4 border-t bg-gray-50">
          <h3 className="text-lg font-bold mb-3">📜 購入履歴</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {userPurchases.slice(0, 5).map((purchase) => {
              const item = shopItems.find(item => item.id === purchase.itemId);
              return (
                <div key={purchase.id || purchase.purchaseTime} className="flex justify-between items-center bg-white p-3 rounded-lg">
                  <div>
                    <p className="font-medium">{item?.name || '不明なアイテム'}</p>
                    <p className="text-xs text-gray-500">{purchase.purchaseDate}</p>
                  </div>
                  <span className="text-sm font-medium text-red-600">-{purchase.pointsSpent}pt</span>
                </div>
              );
            })}
          </div>
          {userPurchases.length > 5 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              他 {userPurchases.length - 5} 件の購入履歴があります
            </p>
          )}
        </div>
      )}
    </div>
  );
}