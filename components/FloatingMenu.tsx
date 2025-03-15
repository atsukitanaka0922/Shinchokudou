import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BGMPlayer from './BGMPlayer';
import PomodoroTimer from './PomodoroTimer';
import BackgroundColorPicker from './BackgroundColorPicker';

type TabType = 'bgm' | 'pomodoro' | 'settings' | null;

export default function FloatingMenu() {
  const [activeTab, setActiveTab] = useState<TabType>(null);

  // ポモドーロタブを開くイベントをリッスン
  useEffect(() => {
    const handleOpenPomodoroTab = () => {
      setActiveTab('pomodoro');
    };

    window.addEventListener('openPomodoroTab', handleOpenPomodoroTab);
    return () => {
      window.removeEventListener('openPomodoroTab', handleOpenPomodoroTab);
    };
  }, []);

  const toggleTab = (tab: TabType) => {
    if (activeTab === tab) {
      setActiveTab(null);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* 開いているタブのコンテンツ */}
      <AnimatePresence>
        {activeTab && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 bg-white rounded-lg shadow-lg overflow-hidden w-72"
          >
            {/* BGMタブ */}
            {activeTab === 'bgm' && (
              <div className="p-4">
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                  <h3 className="font-bold text-lg">🎵 BGMプレイヤー</h3>
                  <button
                    onClick={() => setActiveTab(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <BGMPlayer inTabPanel={true} />
              </div>
            )}

            {/* ポモドーロタブ */}
            {activeTab === 'pomodoro' && (
              <div className="p-4">
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                  <h3 className="font-bold text-lg">⏱️ ポモドーロタイマー</h3>
                  <button
                    onClick={() => setActiveTab(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <PomodoroTimer inTabPanel={true} />
              </div>
            )}

            {/* 設定タブ */}
            {activeTab === 'settings' && (
              <div className="p-4">
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                  <h3 className="font-bold text-lg">⚙️ 設定</h3>
                  <button
                    onClick={() => setActiveTab(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  {/* テーマ設定のみ残す */}
                  <section>
                    <h4 className="font-medium text-gray-700 mb-2">🎨 テーマ設定</h4>
                    <div className="bg-gray-50 p-3 rounded">
                      <BackgroundColorPicker />
                    </div>
                  </section>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 固定の浮遊ボタン */}
      <div className="flex space-x-2">
        <button
          onClick={() => toggleTab('pomodoro')}
          className={`p-3 rounded-full shadow-lg ${
            activeTab === 'pomodoro' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 hover:bg-blue-100'
          }`}
          aria-label="ポモドーロタイマー"
        >
          ⏱️
        </button>
        
        <button
          onClick={() => toggleTab('bgm')}
          className={`p-3 rounded-full shadow-lg ${
            activeTab === 'bgm' ? 'bg-green-600 text-white' : 'bg-white text-gray-800 hover:bg-green-100'
          }`}
          aria-label="BGMプレイヤー"
        >
          🎵
        </button>
        
        <button
          onClick={() => toggleTab('settings')}
          className={`p-3 rounded-full shadow-lg ${
            activeTab === 'settings' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800 hover:bg-gray-200'
          }`}
          aria-label="設定"
        >
          ⚙️
        </button>
      </div>
    </div>
  );
}