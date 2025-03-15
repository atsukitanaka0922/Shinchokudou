import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BackgroundColorPicker from "./BackgroundColorPicker";
import { useThemeStore } from "@/store/themeStore";

export default function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { bgColor, setBgColor } = useThemeStore();
  const [showPomodoroTimer, setShowPomodoroTimer] = useState(true);
  const [showBGMPlayer, setShowBGMPlayer] = useState(true);

  // LocalStorageから設定を読み込む
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPomodoroSetting = localStorage.getItem('showPomodoroTimer');
      const storedBGMSetting = localStorage.getItem('showBGMPlayer');
      
      if (storedPomodoroSetting !== null) {
        setShowPomodoroTimer(storedPomodoroSetting === 'true');
      }
      
      if (storedBGMSetting !== null) {
        setShowBGMPlayer(storedBGMSetting === 'true');
      }
    }
  }, []);

  const toggleSettings = () => {
    setIsOpen(!isOpen);
  };

  // ポモドーロタイマーの表示設定を変更
  const togglePomodoroTimer = () => {
    const newValue = !showPomodoroTimer;
    setShowPomodoroTimer(newValue);
    localStorage.setItem('showPomodoroTimer', String(newValue));
    // グローバルにイベントを発火して他のコンポーネントに通知
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pomodoroVisibilityChange', { detail: { visible: newValue } }));
    }
  };

  // BGMプレイヤーの表示設定を変更
  const toggleBGMPlayer = () => {
    const newValue = !showBGMPlayer;
    setShowBGMPlayer(newValue);
    localStorage.setItem('showBGMPlayer', String(newValue));
    // グローバルにイベントを発火して他のコンポーネントに通知
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bgmPlayerVisibilityChange', { detail: { visible: newValue } }));
    }
  };

  // ポモドーロタイマーのリセット
  const resetPosition = () => {
    localStorage.removeItem('pomodoroTimerPosition');
    localStorage.removeItem('bgmPlayerPosition');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resetPositions'));
      alert('ポモドーロタイマーとBGMプレイヤーの位置をリセットしました。ページを再読み込みしてください。');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* 設定ボタン */}
      <button
        onClick={toggleSettings}
        className="bg-gray-800 hover:bg-gray-700 text-white rounded-full p-3 shadow-lg"
        aria-label="設定を開く"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* 設定パネル */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 w-72 bg-white rounded-lg shadow-xl overflow-hidden"
          >
            <div className="p-4 bg-gray-100 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">⚙️ 設定</h2>
              <button
                onClick={toggleSettings}
                className="text-gray-500 hover:text-gray-700"
                aria-label="設定を閉じる"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              {/* 設定項目セクション */}
              <div className="space-y-4">
                <section>
                  <h3 className="font-medium text-gray-700 mb-2">🎨 テーマ設定</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    <BackgroundColorPicker />
                  </div>
                </section>

                <section>
                  <h3 className="font-medium text-gray-700 mb-2">🖥️ 表示設定</h3>
                  <div className="bg-gray-50 p-3 rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="pomodoro-toggle" className="text-sm text-gray-600">
                        ⏱️ ポモドーロタイマーを表示
                      </label>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input
                          type="checkbox"
                          id="pomodoro-toggle"
                          checked={showPomodoroTimer}
                          onChange={togglePomodoroTimer}
                          className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                        />
                        <label
                          htmlFor="pomodoro-toggle"
                          className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                            showPomodoroTimer ? 'bg-green-400' : 'bg-gray-300'
                          }`}
                        ></label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label htmlFor="bgm-toggle" className="text-sm text-gray-600">
                        🎵 BGMプレイヤーを表示
                      </label>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input
                          type="checkbox"
                          id="bgm-toggle"
                          checked={showBGMPlayer}
                          onChange={toggleBGMPlayer}
                          className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                        />
                        <label
                          htmlFor="bgm-toggle"
                          className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                            showBGMPlayer ? 'bg-green-400' : 'bg-gray-300'
                          }`}
                        ></label>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="font-medium text-gray-700 mb-2">🔄 リセット</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    <button
                      onClick={resetPosition}
                      className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                      タイマー・プレイヤーの位置をリセット
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}