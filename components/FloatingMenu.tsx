/**
 * フローティングメニューコンポーネント（テーマ機能修正版）
 * 
 * アプリケーションの設定や追加機能にアクセスするためのフローティングメニュー
 * v1.6.1: 新しいテーマストアとの連携修正、背景テーマ機能を正しく動作させる
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMoodStore } from '@/store/moodStore';
import { useThemeStore } from '@/store/themeStore'; // 🔥 修正: 新しいテーマストア
import { useBGMStore } from '@/store/bgmStore';
import Link from 'next/link';
import ReadmeContent from './ReadmeContent';

// 🔥 修正: 利用可能な背景テーマ（新しいテーマストア対応）
const bgThemeOptions = [
  { 
    name: 'デフォルト（白）', 
    theme: {
      id: 'default_white',
      name: 'デフォルト（白）',
      type: 'solid' as const,
      value: '#ffffff'
    }
  },
  { 
    name: 'ライトグレー', 
    theme: {
      id: 'default_light_gray',
      name: 'ライトグレー',
      type: 'solid' as const,
      value: '#f8f9fa'
    }
  },
  { 
    name: 'ソフトブルー', 
    theme: {
      id: 'default_soft_blue',
      name: 'ソフトブルー',
      type: 'solid' as const,
      value: '#f0f8ff'
    }
  },
  { 
    name: 'ウォームグレー', 
    theme: {
      id: 'default_warm_gray',
      name: 'ウォームグレー',
      type: 'solid' as const,
      value: '#f5f5f5'
    }
  },
  { 
    name: 'ライトグリーン', 
    theme: {
      id: 'default_light_green',
      name: 'ライトグリーン',
      type: 'solid' as const,
      value: '#f0fff0'
    }
  },
  { 
    name: 'ライトピンク', 
    theme: {
      id: 'default_light_pink',
      name: 'ライトピンク',
      type: 'solid' as const,
      value: '#fff0f5'
    }
  }
];

/**
 * フローティングメニューコンポーネント
 * 設定や追加機能へのアクセスを提供
 */
export default function FloatingMenu() {
  // 各ストアから状態を取得
  const { mood, setMood } = useMoodStore();
  const { backgroundTheme, setBackgroundTheme } = useThemeStore(); // 🔥 修正: 新しいテーマストア
  const bgmStore = useBGMStore();
  
  // メニューの表示状態
  const [isOpen, setIsOpen] = useState(false);
  
  // BGMストアの状態
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  
  // READMEモーダルの表示状態
  const [showReadme, setShowReadme] = useState(false);

  // BGMの初期化と状態同期
  useEffect(() => {
    // BGMストアが利用可能な場合のみ初期化を実行
    if (bgmStore && typeof bgmStore.initialize === 'function') {
      bgmStore.initialize();
      
      // BGMストアの状態を同期
      setIsPlaying(bgmStore.isPlaying);
      setVolume(bgmStore.volume);
    }
  }, [bgmStore]);

  // メニューの開閉切り替え
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // 気分の設定
  const handleMoodChange = (newMood: '元気' | '普通' | '疲れた') => {
    setMood(newMood);
  };

  // 🔥 修正: 背景テーマの設定（新しいテーマストア対応）
  const handleBgThemeChange = (selectedTheme: any) => {
    console.log('フローティングメニュー: テーマ変更:', selectedTheme);
    setBackgroundTheme(selectedTheme.theme);
  };

  // BGM再生/停止の切り替え
  const handleTogglePlay = () => {
    if (bgmStore && typeof bgmStore.togglePlay === 'function') {
      bgmStore.togglePlay();
      setIsPlaying(bgmStore.isPlaying);
    }
  };

  // 音量の設定
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (bgmStore && typeof bgmStore.setVolume === 'function') {
      bgmStore.setVolume(newVolume);
      setVolume(newVolume);
    }
  };
  
  // READMEモーダルの表示切り替え
  const toggleReadme = () => {
    setShowReadme(!showReadme);
    // READMEを開く場合はメインメニューを閉じる
    if (!showReadme) {
      setIsOpen(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40">
        {/* メインメニューボタン */}
        <motion.button
          onClick={toggleMenu}
          className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="text-xl">{isOpen ? '✕' : '⚙️'}</span>
        </motion.button>

        {/* メニューパネル */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl p-4 w-60"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <h3 className="font-bold text-gray-700 mb-3">設定</h3>
              
              {/* READMEボタン */}
              <div className="mb-3">
                <button
                  onClick={toggleReadme}
                  className="w-full py-2 px-3 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors flex items-center"
                >
                  <span className="mr-2">📖</span>
                  アプリの使い方を確認する
                </button>
              </div>
              
              {/* 気分設定 */}
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-1">現在の気分:</p>
                <div className="flex space-x-1">
                  {['元気', '普通', '疲れた'].map((moodOption) => (
                    <button
                      key={moodOption}
                      onClick={() => handleMoodChange(moodOption as any)}
                      className={`px-2 py-1 text-xs rounded-md ${
                        mood === moodOption
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {moodOption}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 🔥 修正: 背景テーマ設定（新しいテーマストア対応） */}
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-1">背景テーマ:</p>
                <div className="text-xs text-gray-500 mb-2">
                  現在: {backgroundTheme.name}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {bgThemeOptions.map((option) => (
                    <button
                      key={option.theme.id}
                      onClick={() => handleBgThemeChange(option)}
                      className={`p-2 text-xs rounded border ${
                        backgroundTheme.id === option.theme.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                      style={{ backgroundColor: option.theme.value }}
                    >
                      <div 
                        className="w-full h-4 rounded mb-1 border border-gray-200"
                        style={{ backgroundColor: option.theme.value }}
                      />
                      <div className="text-center font-medium">
                        {option.name}
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* 🔥 追加: ショップテーマへの案内 */}
                <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded">
                  <p className="text-xs text-purple-700 text-center">
                    🛍️ <strong>さらに多くのテーマ</strong><br/>
                    ショップタブで美しいグラデーション<br/>
                    背景テーマを購入できます！
                  </p>
                </div>
              </div>
              
              {/* BGM設定 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm text-gray-600">BGM:</p>
                  <button
                    onClick={handleTogglePlay}
                    className={`text-xs px-2 py-1 rounded ${
                      isPlaying ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                    }`}
                  >
                    {isPlaying ? '停止' : '再生'}
                  </button>
                </div>
                
                {/* 音量スライダー */}
                <div className="flex items-center">
                  <span className="text-xs text-gray-500 mr-2">🔈</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-500 ml-2">🔊</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* READMEモーダル */}
      <AnimatePresence>
        {showReadme && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full h-[80vh] overflow-auto relative"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              {/* 閉じるボタン */}
              <button
                onClick={toggleReadme}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
                aria-label="閉じる"
              >
                <span className="text-xl">✕</span>
              </button>
              
              {/* スクロール可能なコンテンツエリア */}
              <div className="p-6 pt-8">
                <ReadmeContent />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}