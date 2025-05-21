/**
 * フィードバック通知コンポーネント
 * 
 * アプリケーション内の操作結果や通知を表示するトースト通知コンポーネント
 * アニメーション付きで表示され、一定時間後に自動的に消えます
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeedbackStore } from '@/store/feedbackStore';

/**
 * フィードバック通知コンポーネント
 * トースト通知を表示する
 */
export default function Feedback() {
  // ストアからメッセージを取得
  const { message, setMessage } = useFeedbackStore();
  
  // タイムアウトID管理用
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // メッセージが変更されたときの処理
  useEffect(() => {
    // 前回のタイムアウトがあればクリア
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // メッセージがある場合は、3秒後に消す
    if (message) {
      const id = setTimeout(() => {
        setMessage(null);
      }, 3000);
      
      setTimeoutId(id);
    }

    // コンポーネントのアンマウント時にタイムアウトをクリア
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [message, setMessage]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <div className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg max-w-md text-center">
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}