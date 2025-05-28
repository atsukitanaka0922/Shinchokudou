/**
 * ゲームセンターメインコンポーネント（ポモドーロ継続対応）
 * 
 * ポイント消費型ゲームのメイン画面
 * ゲーム選択、統計表示、プレイ履歴管理を提供
 * v1.6.0: ゲーム中でもポモドーロタイマーが継続動作
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameCenterStore, GameType } from '@/store/gameCenterStore';
import { usePointStore } from '@/store/pointStore';
import { useAuthStore } from '@/store/auth';
import DinoGame from './DinoGame';
import FlappyGame from './FlappyGame';
import FloatingPomodoroTimer from './FloatingPomodoroTimer'; // 🔥 追加

/**
 * ゲームセンターメインコンポーネント
 */
export default function GameCenter() {
  const { user } = useAuthStore();
  const { userPoints } = usePointStore();
  const { 
    gameStats, 
    gameHistory, 
    loading,
    canPlayGame, 
    startGame,
    loadGameHistory,
    loadGameStats,
    getTodayPlays,
    getBestScore,
    getTotalPlays
  } = useGameCenterStore();
  
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [currentTab, setCurrentTab] = useState<'games' | 'stats' | 'history'>('games');
  const [refreshKey, setRefreshKey] = useState(0);

  // データ読み込みを強化
  useEffect(() => {
    if (user) {
      console.log("ゲームセンター: データ読み込み開始");
      const loadData = async () => {
        try {
          await loadGameHistory();
          console.log("ゲームセンター: データ読み込み完了");
        } catch (error) {
          console.error("ゲームセンター: データ読み込みエラー", error);
        }
      };
      loadData();
    }
  }, [user, loadGameHistory, refreshKey]);

  // ゲーム終了時のデータ更新監視
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && !selectedGame) {
        loadGameHistory();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user, selectedGame, loadGameHistory]);

  /**
   * ゲーム開始処理
   */
  const handleStartGame = async (gameType: GameType) => {
    console.log(`ゲーム開始試行: ${gameType}`);
    const success = await startGame(gameType);
    if (success) {
      setSelectedGame(gameType);
      console.log(`ゲーム開始成功: ${gameType}`);
    } else {
      console.log(`ゲーム開始失敗: ${gameType}`);
    }
  };

  /**
   * ゲーム終了処理
   */
  const handleGameEnd = async () => {
    console.log("ゲーム終了処理開始");
    setSelectedGame(null);
    
    try {
      await loadGameHistory();
      setRefreshKey(prev => prev + 1);
      console.log("ゲーム終了: データ更新完了");
    } catch (error) {
      console.error("ゲーム終了: データ更新エラー", error);
    }
  };

  /**
   * 手動データ更新
   */
  const handleRefreshData = async () => {
    console.log("手動データ更新開始");
    try {
      await loadGameHistory();
      setRefreshKey(prev => prev + 1);
      console.log("手動データ更新完了");
    } catch (error) {
      console.error("手動データ更新エラー", error);
    }
  };

  /**
   * ゲーム情報を取得
   */
  const getGameInfo = (gameType: GameType) => {
    const info = {
      dino: {
        name: 'ディノラン',
        emoji: '🦕',
        description: 'ジャンプで障害物を避けよう！',
        color: 'bg-green-500'
      },
      flappy: {
        name: 'フラッピーバード',
        emoji: '🐦',
        description: 'パイプの隙間を通り抜けよう！',
        color: 'bg-blue-500'
      }
    };
    return info[gameType];
  };

  // ユーザーがログインしていない場合
  if (!user) {
    return (
      <div className="p-6 bg-gray-100 rounded-lg shadow-md text-center">
        <h2 className="text-xl font-bold mb-4">🎮 ゲームセンター</h2>
        <p className="text-gray-600">ログインするとゲームをプレイできます</p>
      </div>
    );
  }

  // ゲームプレイ中の表示
  if (selectedGame) {
    return (
      <div className="bg-white rounded-lg shadow-md relative">
        {/* 🔥 追加: ゲーム中でもフローティングタイマーを表示 */}
        <FloatingPomodoroTimer />
        
        {/* ヘッダー */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            🎮 {getGameInfo(selectedGame).name}
            {/* 🔥 追加: ゲーム中のポモドーロ表示 */}
            <span className="ml-3 text-sm text-gray-500">
              ⏱️ ポモドーロも同時に実行中
            </span>
          </h2>
          <button
            onClick={handleGameEnd}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            ゲーム終了
          </button>
        </div>
        
        {/* ゲーム画面 */}
        <div className="p-4">
          {selectedGame === 'dino' && <DinoGame />}
          {selectedGame === 'flappy' && <FlappyGame />}
        </div>
        
        {/* 🔥 追加: ゲーム中のヒント */}
        <div className="p-4 border-t bg-blue-50">
          <p className="text-sm text-blue-700 text-center">
            💡 ヒント: ポモドーロタイマーはゲーム中も動き続けます。フローティングタイマーをドラッグして好きな位置に移動できます。
          </p>
        </div>
      </div>
    );
  }

  // メイン画面
  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* ヘッダー */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">🎮 ゲームセンター</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefreshData}
              className="text-sm text-blue-500 hover:text-blue-700"
              disabled={loading}
            >
              {loading ? '更新中...' : '🔄 データ更新'}
            </button>
            <div className="text-sm text-gray-600">
              💎 現在のポイント: {userPoints?.currentPoints || 0}
            </div>
          </div>
        </div>
        
        {/* タブナビゲーション */}
        <div className="flex mt-4 space-x-1">
          {(['games', 'stats', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setCurrentTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                currentTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tab === 'games' ? 'ゲーム' : tab === 'stats' ? '統計' : '履歴'}
            </button>
          ))}
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* ゲーム選択タブ */}
          {currentTab === 'games' && (
            <motion.div
              key={`games-${refreshKey}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* 🔥 追加: ポモドーロとの連携情報 */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-purple-800">
                  <span className="font-medium">⏱️ ポモドーロ連携機能:</span> 
                  ゲーム中でもポモドーロタイマーが継続動作します。集中時間を無駄にせずにリフレッシュできます！
                </p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <span className="font-medium">💡 ゲームルール:</span> 
                  1回のプレイに5ポイント必要です。スコアに応じてランキングに記録されます！
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['dino', 'flappy'] as const).map((gameType) => {
                  const gameInfo = getGameInfo(gameType);
                  const stats = gameStats[gameType];
                  
                  return (
                    <motion.div
                      key={gameType}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="text-center mb-4">
                        <div className="text-4xl mb-2">{gameInfo.emoji}</div>
                        <h3 className="text-lg font-bold">{gameInfo.name}</h3>
                        <p className="text-sm text-gray-600">{gameInfo.description}</p>
                      </div>
                      
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span>最高スコア:</span>
                          <span className="font-medium">{stats.bestScore}点</span>
                        </div>
                        <div className="flex justify-between">
                          <span>プレイ回数:</span>
                          <span className="font-medium">{stats.totalPlays}回</span>
                        </div>
                        {stats.averageScore > 0 && (
                          <div className="flex justify-between">
                            <span>平均スコア:</span>
                            <span className="font-medium">{stats.averageScore}点</span>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleStartGame(gameType)}
                        disabled={!canPlayGame()}
                        className={`w-full py-2 px-4 rounded-lg font-medium ${
                          canPlayGame()
                            ? `${gameInfo.color} text-white hover:opacity-90`
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {canPlayGame() ? 'プレイ (5ポイント)' : 'ポイント不足'}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* 統計タブ */}
          {currentTab === 'stats' && (
            <motion.div
              key={`stats-${refreshKey}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-blue-600">今日のプレイ</p>
                  <p className="text-2xl font-bold text-blue-800">{getTodayPlays()}回</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-green-600">総プレイ回数</p>
                  <p className="text-2xl font-bold text-green-800">
                    {getTotalPlays('dino') + getTotalPlays('flappy')}回
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-purple-600">総消費ポイント</p>
                  <p className="text-2xl font-bold text-purple-800">
                    {gameStats.dino.totalPointsSpent + gameStats.flappy.totalPointsSpent}pt
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-bold">ゲーム別統計</h3>
                {(['dino', 'flappy'] as const).map((gameType) => {
                  const gameInfo = getGameInfo(gameType);
                  const stats = gameStats[gameType];
                  
                  return (
                    <div key={gameType} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <span className="text-2xl mr-2">{gameInfo.emoji}</span>
                        <h4 className="text-lg font-medium">{gameInfo.name}</h4>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">プレイ回数</p>
                          <p className="font-bold">{stats.totalPlays}回</p>
                        </div>
                        <div>
                          <p className="text-gray-600">最高スコア</p>
                          <p className="font-bold">{stats.bestScore}点</p>
                        </div>
                        <div>
                          <p className="text-gray-600">平均スコア</p>
                          <p className="font-bold">{stats.averageScore}点</p>
                        </div>
                        <div>
                          <p className="text-gray-600">消費ポイント</p>
                          <p className="font-bold">{stats.totalPointsSpent}pt</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* 履歴タブ */}
          {currentTab === 'history' && (
            <motion.div
              key={`history-${refreshKey}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">プレイ履歴</h3>
                <p className="text-sm text-gray-500">
                  {gameHistory.length > 0 ? `${gameHistory.length}件の記録` : ''}
                </p>
              </div>
              
              {gameHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>まだゲームをプレイしていません</p>
                  <p className="text-sm">ゲームタブからプレイを開始しましょう！</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {gameHistory.slice(0, 20).map((history, index) => {
                    const gameInfo = getGameInfo(history.gameType);
                    
                    return (
                      <div 
                        key={history.id || `${history.timestamp}-${index}`}
                        className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                      >
                        <div className="flex items-center">
                          <span className="text-xl mr-3">{gameInfo.emoji}</span>
                          <div>
                            <p className="font-medium">{gameInfo.name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(history.timestamp).toLocaleString('ja-JP')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-bold">{history.score}点</p>
                          <p className="text-xs text-gray-500">
                            {Math.floor(history.duration / 60)}:{(history.duration % 60).toString().padStart(2, '0')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}