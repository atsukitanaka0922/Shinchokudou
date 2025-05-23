/**
 * 拡張タスク追加コンポーネント
 * 
 * メモ機能付きのタスク追加フォーム
 * AI優先度提案、期限設定、見積もり時間設定も含む
 */

import { useState, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEnhancedTaskStore } from '@/store/enhancedTaskStore';
import { useAuthStore } from '@/store/auth';
import { suggestPriority, PriorityLevel } from '@/lib/aiPriorityAssignment';
import { useFeedbackStore } from '@/store/feedbackStore';

/**
 * 拡張タスク追加コンポーネント
 */
export default function EnhancedAddTask() {
  // ストアからの状態と関数
  const { addTask } = useEnhancedTaskStore();
  const { user } = useAuthStore();
  const { setMessage } = useFeedbackStore();
  
  // ローカル状態
  const [text, setText] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [memo, setMemo] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
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
      setLoading(true);
      
      // タスクを追加
      const taskId = await addTask(
        text, 
        deadline || undefined, 
        priority, 
        memo || undefined
      );
      
      // 見積もり時間が設定されている場合は追加で更新
      if (estimatedMinutes && typeof estimatedMinutes === 'number') {
        // この処理は addTask 内で行うように後で修正予定
      }
      
      // フォームをリセット
      setText('');
      setDeadline('');
      setPriority('medium');
      setMemo('');
      setEstimatedMinutes('');
      setShowAdvanced(false);
      
      // 入力フィールドにフォーカス
      inputRef.current?.focus();
    } catch (error) {
      console.error('タスク追加エラー:', error);
      setMessage('タスクの追加に失敗しました');
    } finally {
      setLoading(false);
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

  /**
   * 見積もり時間の選択肢を生成
   */
  const getEstimateOptions = () => {
    const options = [
      { value: 15, label: '15分' },
      { value: 30, label: '30分' },
      { value: 45, label: '45分' },
      { value: 60, label: '1時間' },
      { value: 90, label: '1時間30分' },
      { value: 120, label: '2時間' },
      { value: 180, label: '3時間' },
      { value: 240, label: '4時間' },
      { value: 480, label: '8時間' }
    ];
    return options;
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 relative">
      {/* メインのタスク入力フィールド */}
      <div className="mb-3 relative">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="新しいタスクを入力..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
        
        {/* AI処理中のローディング表示 */}
        {loading && (
          <div className="absolute top-2 right-2">
            <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      {/* 詳細設定の表示切り替えボタン */}
      <div className="mb-3 flex justify-between items-center">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          {showAdvanced ? '▼' : '▶'} 詳細設定
        </button>
        
        {/* AI提案中の表示 */}
        {text.length > 5 && (
          <p className="text-xs text-gray-500">
            AI提案: {loading ? '分析中...' : priority === 'high' ? '高優先度' : priority === 'medium' ? '中優先度' : '低優先度'}
          </p>
        )}
      </div>
      
      {/* 詳細設定パネル */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              {/* 期限と優先度の設定 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 期限設定 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    期限
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* 見積もり時間設定 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    見積もり時間
                  </label>
                  <select
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">選択してください</option>
                    {getEstimateOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* 優先度選択ボタングループ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  優先度
                </label>
                <div className="flex space-x-2">
                  {(['high', 'medium', 'low'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium ${
                        priority === p ? getPriorityClass(p) : 'bg-gray-100 text-gray-600 border-gray-300'
                      }`}
                    >
                      {p === 'high' ? '高優先度' : p === 'medium' ? '中優先度' : '低優先度'}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* メモ入力 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メモ・詳細
                </label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="タスクの詳細や備考を入力..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 resize-vertical"
                />
                <p className="text-xs text-gray-500 mt-1">
                  マークダウン記法に対応しています
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 送信ボタン */}
      <motion.button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors disabled:bg-gray-400"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={!text.trim() || loading}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            処理中...
          </span>
        ) : (
          'タスクを追加'
        )}
      </motion.button>
      
      {/* クイックヒント */}
      {!showAdvanced && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          💡 「詳細設定」でメモや見積もり時間を設定できます
        </p>
      )}
    </form>
  );
}