/**
 * 効果音設定コンポーネント
 * 
 * 効果音の有効/無効、音量調整を行うUI
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioSettings } from '@/lib/audioService';

interface AudioSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AudioSettings({ isOpen, onClose }: AudioSettingsProps) {
  const { enabled, volume, setEnabled, setVolume, play } = useAudioSettings();
  const [testPlaying, setTestPlaying] = useState<string | null>(null);

  /**
   * テスト効果音を再生
   */
  const playTestSound = async (soundType: 'task-complete' | 'sub-task-complete' | 'habit-complete') => {
    setTestPlaying(soundType);
    try {
      await play(soundType);
    } catch (error) {
      console.warn('テスト効果音の再生に失敗:', error);
    } finally {
      setTimeout(() => setTestPlaying(null), 1000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* オーバーレイ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />
          
          {/* 設定パネル */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-96 max-w-[90vw] max-h-[85vh] sm:max-h-[90vh] flex flex-col"
          >
            {/* ヘッダー */}
            <div className="flex justify-between items-center p-4 sm:p-6 pb-3 sm:pb-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="mr-2">🔊</span>
                効果音設定
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                ✕
              </button>
            </div>

            {/* コンテント（スクロール可能） */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
              {/* 効果音の有効/無効 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">効果音を有効にする</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* 音量調整 */}
              <div className={`transition-opacity ${enabled ? 'opacity-100' : 'opacity-50'}`}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  音量: {Math.round(volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  disabled={!enabled}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                />
              </div>

              {/* テスト効果音 */}
              <div className={`transition-opacity ${enabled ? 'opacity-100' : 'opacity-50'}`}>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  効果音のテスト
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => playTestSound('task-complete')}
                    disabled={!enabled || testPlaying === 'task-complete'}
                    className="w-full px-3 sm:px-4 py-2 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {testPlaying === 'task-complete' ? (
                      <>🔊 再生中...</>
                    ) : (
                      <>📋 タスク完了音</>
                    )}
                  </button>
                  <button
                    onClick={() => playTestSound('sub-task-complete')}
                    disabled={!enabled || testPlaying === 'sub-task-complete'}
                    className="w-full px-3 sm:px-4 py-2 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {testPlaying === 'sub-task-complete' ? (
                      <>🔊 再生中...</>
                    ) : (
                      <>📝 サブタスク完了音</>
                    )}
                  </button>
                  <button
                    onClick={() => playTestSound('habit-complete')}
                    disabled={!enabled || testPlaying === 'habit-complete'}
                    className="w-full px-3 sm:px-4 py-2 text-sm bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {testPlaying === 'habit-complete' ? (
                      <>🔊 再生中...</>
                    ) : (
                      <>🔄 習慣完了音</>
                    )}
                  </button>
                </div>
              </div>

              {/* 説明 */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  タスクや習慣を完了した際に効果音が再生されます。
                  ブラウザの設定で音声が無効になっている場合、効果音は再生されません。
                </p>
              </div>
              </div>
            </div>

            {/* フッター */}
            <div className="flex justify-end p-4 sm:p-6 pt-3 sm:pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm min-w-[80px]"
              >
                完了
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
