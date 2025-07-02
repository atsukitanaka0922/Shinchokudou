/**
 * ポイントショップコンポーネント（エラーハンドリング強化版）
 * 
 * ポイントで購入できるアイテム（背景テーマなど）を表示・購入するコンポーネント
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShopStore, ShopItem } from '@/store/shopStore';
import { usePointStore } from '@/store/pointStore';
import { useThemeStore, PURCHASABLE_BACKGROUNDS } from '@/store/themeStore';
import { useAuthStore } from '@/store/auth';
import { useFeedbackStore } from '@/store/feedbackStore';

/**
 * ポイントショップコンポーネント
 */
export default function Shop() {
  const { user } = useAuthStore();
  const { userPoints } = usePointStore();
  const { setBackgroundTheme, backgroundTheme, hasPurchasedTheme } = useThemeStore(); // 🔥 追加: hasPurchasedTheme
  const { setMessage } = useFeedbackStore();
  const { 
    shopItems, 
    userPurchases, 
    loading,
    error, // 🔥 追加: エラー状態
    loadShopItems,
    loadUserPurchases,
    purchaseItem,
    canPurchaseItem,
    hasPurchasedItem,
    getTotalSpentPoints,
    clearError // 🔥 追加: エラークリア
  } = useShopStore();
  
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'background' | 'nature' | 'cosmic' | 'luxury'>('background');
  const [selectedRarity, setSelectedRarity] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary'>('all');
  const [purchasingItem, setPurchasingItem] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0); // 🔥 追加: リトライ回数

  // データ読み込み
  useEffect(() => {
    if (user) {
      console.log("ショップ: ユーザーログイン検出、データ読み込み開始");
      loadShopItems();
      loadUserPurchases();
    }
  }, [user, loadShopItems, loadUserPurchases, retryCount]);

  /**
   * 🔥 追加: データ読み込みリトライ
   */
  const handleRetry = () => {
    console.log("ショップ: データ読み込みリトライ");
    clearError();
    setRetryCount(prev => prev + 1);
  };

  /**
   * アイテムを購入してテーマを自動適用
   */
  const handlePurchase = async (item: ShopItem) => {
    if (purchasingItem) return;
    
    console.log(`ショップ: アイテム購入開始 - ${item.name}`);
    setPurchasingItem(item.id);
    
    try {
      const success = await purchaseItem(item.id);
      if (success) {
        console.log(`ショップ: アイテム購入成功 - ${item.name}`);
        
        // 購入成功後にデータを再読み込み
        await loadUserPurchases();
        
        // 背景テーマの場合は自動的に適用
        if (item.type === 'background') {
          const themeData = PURCHASABLE_BACKGROUNDS[item.id];
          if (themeData) {
            // 購入済みに設定
            themeData.isPurchased = true;
            
            // テーマを適用
            setBackgroundTheme(themeData);
            
            setMessage(`🎨 「${item.name}」を購入して適用しました！`);
            console.log(`ショップ: テーマ適用完了 - ${item.name}`);
          }
        }
      } else {
        console.log(`ショップ: アイテム購入失敗 - ${item.name}`);
      }
    } catch (error) {
      console.error(`ショップ: アイテム購入エラー - ${item.name}:`, error);
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
      setMessage(`🎨 「${item.name}」を適用しました！`);
      console.log(`ショップ: テーマ適用 - ${item.name}`);
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
    // カテゴリフィルタ
    if (selectedCategory === 'nature') {
      return item.id.includes('forest') || item.id.includes('bamboo') || item.id.includes('lavender') || 
             item.id.includes('spring') || item.id.includes('mountain') || item.id.includes('tea');
    }
    if (selectedCategory === 'cosmic') {
      return item.id.includes('cosmic') || item.id.includes('stellar') || item.id.includes('galactic') || 
             item.id.includes('supernova') || item.id.includes('aurora') || item.id.includes('rainbow');
    }
    if (selectedCategory === 'luxury') {
      return item.id.includes('platinum') || item.id.includes('golden') || item.id.includes('diamond') || 
             item.id.includes('royal') || item.rarity === 'legendary';
    }
    if (selectedCategory === 'background') {
      return item.type === 'background';
    }
    if (selectedCategory === 'all') {
      return true;
    }
    return item.type === selectedCategory;
  }).filter(item => {
    // レアリティフィルタ
    if (selectedRarity === 'all') return true;
    return item.rarity === selectedRarity;
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
        
        {/* 🔥 追加: エラー表示 */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-red-800">⚠️ エラーが発生しました</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                  {error.includes('権限') && (
                    <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
                      <p className="font-medium">解決方法:</p>
                      <p>1. ページを再読み込みしてください</p>
                      <p>2. 問題が続く場合は、一度ログアウトして再ログインしてください</p>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleRetry}
                    className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    🔄 リトライ
                  </button>
                  <button
                    onClick={clearError}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
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
            <div className="text-sm text-purple-600">適用中テーマ</div>
            <div className="text-lg font-bold text-purple-800">{backgroundTheme.name}</div>
          </div>
        </div>
      </div>

      {/* カテゴリータブ */}
      <div className="px-4 py-2 border-b bg-gray-50">
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setSelectedCategory('background')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'background'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            🎨 すべて
          </button>
          <button
            onClick={() => setSelectedCategory('nature')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'nature'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            🌿 自然系
          </button>
          <button
            onClick={() => setSelectedCategory('cosmic')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'cosmic'
                ? 'bg-purple-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            🌌 宇宙系
          </button>
          <button
            onClick={() => setSelectedCategory('luxury')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'luxury'
                ? 'bg-yellow-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            👑 高級系
          </button>
        </div>
        
        {/* レアリティフィルタ */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 py-2">レアリティ:</span>
          {(['all', 'common', 'rare', 'epic', 'legendary'] as const).map((rarity) => (
            <button
              key={rarity}
              onClick={() => setSelectedRarity(rarity)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedRarity === rarity
                  ? rarity === 'legendary' ? 'bg-yellow-500 text-white' :
                    rarity === 'epic' ? 'bg-purple-500 text-white' :
                    rarity === 'rare' ? 'bg-blue-500 text-white' :
                    rarity === 'common' ? 'bg-gray-500 text-white' :
                    'bg-gray-800 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border'
              }`}
            >
              {rarity === 'all' ? '全て' : getRarityText(rarity as any)}
            </button>
          ))}
        </div>
      </div>

      {/* ショップアイテム一覧 */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">アイテムを読み込んでいます...</p>
          </div>
        ) : error && userPurchases.length === 0 ? (
          // 🔥 修正: エラー時の表示
          <div className="text-center py-8">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <p className="text-gray-600 mb-4">データの読み込みに失敗しました</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              🔄 再試行
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-3">🎨</div>
            <p>選択されたカテゴリにはアイテムがありません</p>
            <p className="text-sm mt-2">別のカテゴリまたはレアリティを選択してください</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              // 🔥 修正: テーマストアからも購入済み状態をチェック
              const isPurchasedInShop = hasPurchasedItem(item.id);
              const isPurchasedInTheme = hasPurchasedTheme(item.id);
              const isPurchased = isPurchasedInShop || isPurchasedInTheme; // 両方をチェック
              
              const canPurchase = canPurchaseItem(item.id);
              const isCurrentTheme = backgroundTheme.id === item.id;
              const currentPoints = userPoints?.currentPoints || 0;
              const hasEnoughPoints = currentPoints >= item.price;
              const isProcessing = purchasingItem === item.id;
              
              return (
                <motion.div
                  key={item.id}
                  className={`border-2 rounded-lg p-4 transition-all ${getRarityStyle(item.rarity)} ${
                    isProcessing ? 'opacity-75' : ''
                  }`}
                  whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                >
                  {/* テーマプレビュー */}
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
                    
                    {/* 🔥 追加: 処理中オーバーレイ */}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                        <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
                        <span className="text-xs text-red-500">
                          {item.price - currentPoints}pt 不足
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* アクションボタン */}
                  <div className="space-y-2">
                    {isPurchased ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => handleApplyTheme(item)}
                          disabled={isCurrentTheme || isProcessing}
                          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                            isCurrentTheme
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : isProcessing
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
                        disabled={!canPurchase || !hasEnoughPoints || isProcessing || !!error}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                          !canPurchase || !hasEnoughPoints || !!error
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : isProcessing
                              ? 'bg-blue-300 text-blue-700 cursor-not-allowed'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {isProcessing ? (
                          <span className="flex items-center justify-center">
                            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                            購入中...
                          </span>
                        ) : error ? (
                          'エラー: 再試行してください'
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

      {/* 🔥 追加: トラブルシューティングガイド */}
      {error && (
        <div className="p-4 border-t bg-yellow-50">
          <h3 className="text-lg font-bold mb-3 text-yellow-800">🔧 トラブルシューティング</h3>
          <div className="space-y-2 text-sm text-yellow-700">
            <div className="bg-white p-3 rounded-lg border border-yellow-200">
              <p className="font-medium">権限エラーの場合:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>ブラウザを再読み込み（Ctrl+F5 または Cmd+R）</li>
                <li>一度ログアウトして再ログイン</li>
                <li>ブラウザのキャッシュクリア</li>
              </ul>
            </div>
            <div className="bg-white p-3 rounded-lg border border-yellow-200">
              <p className="font-medium">接続エラーの場合:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>インターネット接続を確認</li>
                <li>しばらく時間をおいて再試行</li>
                <li>別のブラウザで試行</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* テーマカスタマイズガイド */}
      <div className="p-4 border-t bg-gradient-to-r from-purple-50 to-pink-50">
        <h3 className="text-lg font-bold mb-3 text-purple-800">🎨 テーマカスタマイズガイド</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white p-3 rounded-lg border border-purple-100">
            <p className="font-medium text-purple-700 mb-1">🔄 即座適用</p>
            <p className="text-gray-600">購入したテーマは即座にアプリ全体に適用され、美しい背景を楽しめます。</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-purple-100">
            <p className="font-medium text-purple-700 mb-1">⭐ レアリティシステム</p>
            <p className="text-gray-600">コモン、レア、エピック、レジェンダリーの4段階。高レアリティほど美しい！</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-purple-100">
            <p className="font-medium text-purple-700 mb-1">🎯 ポイント活用</p>
            <p className="text-gray-600">タスク完了とログインボーナスでポイントを貯めて、お気に入りテーマをゲット！</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-purple-100">
            <p className="font-medium text-purple-700 mb-1">🎨 簡単切り替え</p>
            <p className="text-gray-600">購入済みテーマは「適用する」ボタンでいつでも簡単に切り替えできます。</p>
          </div>
        </div>
      </div>
    </div>
  );
}