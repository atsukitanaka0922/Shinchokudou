/**
 * タスク追加コンポーネント（優先度設定機能付き）
 * 
 * ユーザーが新しいタスクを入力し、期限と優先度を設定して追加するためのフォーム
 * AIによる優先度提案機能も統合されています
 */

import { useState, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/auth';
import { suggestPriority, PriorityLevel } from '@/lib/aiPriorityAssignment';
import { useFeedbackStore } from '@/store/feedbackStore';

/**
 * 優先度設定付きタスク追加コンポーネント
 */
export default function AddTaskWithPriority() {
  // ストアからの状態と関数
  const { addTask } = useTaskStore();
  const { user } = useAuthStore();
  const { setMessage } = useFeedbackStore();
  
  // ローカル状態
  const [text, setText] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * タスク追加フォーム送信処理
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // テキストが空の場合は処理しない
    if (!text.trim()) return;
    
    if (!user) {
      setMessage('ログインが必要です');
      return;
    }
    
    try {
      // タスクを追加
      await addTask(text, deadline, priority);
      
      // フォームをリセット
      setText('');
      setDeadline('');
      setPriority('medium');
      
      // 入力フィールドにフォーカス
      inputRef.current?.focus();
    } catch (error) {
      console.error('タスク追加エラー:', error);
      setMessage('タスクの追加に失敗しました');
    }
  };

  /**
   * タスクテキストが変更された時のハンドラー
   * AIによる優先度提案を取得
   */
  const handleTextChange = async (value: string) => {
    setText(value);
    
    // テキストが十分な長さの場合、AIによる優先度提案を取得
    if (value.length > 5) {
      setLoading(true);
      try {
        const suggestedPriority = await suggestPriority(value);
        setPriority(suggestedPriority);
      } catch (error) {
        console.error('優先度提案エラー:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  /**
   * 優先度に応じたスタイルクラスを取得
   */
  const getPriorityClass = (currentPriority: PriorityLevel) => {
    switch (currentPriority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // AIによる優先度設定のローディング表示
  const priorityLoadingIndicator = loading && (
    <div className="absolute top-2 right-2">
      <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="mb-4 relative">
      {/* タスク入力フィールド */}
      <div className="mb-3 relative">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="新しいタスクを入力..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {priorityLoadingIndicator}
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
        {/* 期限入力フィールド */}
        <div className="flex-grow">
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        
        {/* 優先度選択ボタングループ */}
        <div className="flex space-x-1">
          {(['high', 'medium', 'low'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`px-3 py-1 rounded-lg border ${
                priority === p ? getPriorityClass(p) : 'bg-gray-100 text-gray-600 border-gray-300'
              }`}
            >
              {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
            </button>
          ))}
        </div>
      </div>
      
      {/* 送信ボタン */}
      <motion.button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={!text.trim()}
      >
        タスクを追加
      </motion.button>
      
      {/* AIによる優先度提案を使用している旨の表示 */}
      <AnimatePresence>
        {text.length > 5 && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-gray-500 mt-2"
          >
            AIによる優先度提案: {loading ? '分析中...' : priority === 'high' ? '高' : priority === 'medium' ? '中' : '低'}
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  );
}