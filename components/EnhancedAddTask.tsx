/**
 * 拡張タスク追加コンポーネント（キーボード途切れバグ修正版）
 * 
 * メモ機能付きのタスク追加フォーム
 * AI優先度提案、期限設定、見積もり時間設定も含む
 * v1.6.0: AI優先度提案によるキーボード途切れ問題を修正
 */

import { useState, useRef, FormEvent, useCallback, useMemo } from 'react';
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
  
  // 🔥 追加: AI優先度提案の状態管理
  const [aiSuggestionLoading, setAiSuggestionLoading] = useState(false);
  const [lastSuggestedText, setLastSuggestedText] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * 🔥 修正: デバウンス機能付きAI優先度提案
   * キーボード入力を妨げないように500ms後に実行
   */
  const debouncedSuggestPriority = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      
      return (inputText: string) => {
        // 前回のタイマーをクリア
        clearTimeout(timeoutId);
        
        // 500ms後に実行（ユーザーの入力が止まってから実行）
        timeoutId = setTimeout(async () => {
          // 空文字列や短すぎるテキストはスキップ
          if (!inputText.trim() || inputText.length < 6) {
            return;
          }
          
          // 前回と同じテキストの場合はスキップ
          if (inputText === lastSuggestedText) {
            return;
          }
          
          try {
            setAiSuggestionLoading(true);
            console.log('AI優先度提案開始:', inputText);
            
            const suggestedPriority = await suggestPriority(inputText);
            
            // テキストが変更されていない場合のみ適用
            if (inputText === text) {
              setPriority(suggestedPriority);
              setLastSuggestedText(inputText);
              console.log('AI優先度提案完了:', suggestedPriority);
            }
            
          } catch (error) {
            console.error('AI優先度提案エラー:', error);
          } finally {
            setAiSuggestionLoading(false);
          }
        }, 500);
      };
    })(),
    [text, lastSuggestedText]
  );

  /**
   * 🔥 修正: タスクテキスト変更処理（非同期処理を分離）
   */
  const handleTextChange = useCallback((value: string) => {
    // 即座にテキストを更新（UIの反応性を保つ）
    setText(value);
    
    // AI提案は非同期で実行（キーボード入力を妨げない）
    debouncedSuggestPriority(value);
  }, [debouncedSuggestPriority]);

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
      setLastSuggestedText(''); // 🔥 追加: AI提案履歴をリセット
      
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

  /**
   * 🔥 追加: AI提案の状態表示
   */
  const aiSuggestionStatus = useMemo(() => {
    if (aiSuggestionLoading) {
      return { text: 'AI分析中...', color: 'text-blue-500' };
    }
    if (text.length > 5 && lastSuggestedText === text) {
      const priorityText = priority === 'high' ? '高優先度' : priority === 'medium' ? '中優先度' : '低優先度';
      return { text: `AI提案: ${priorityText}`, color: 'text-green-600' };
    }
    if (text.length > 0 && text.length <= 5) {
      return { text: 'もう少し詳しく入力してください', color: 'text-gray-500' };
    }
    return null;
  }, [text, priority, aiSuggestionLoading, lastSuggestedText]);

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
        
        {/* 🔥 修正: AI処理中のローディング表示（より目立たないように） */}
        {aiSuggestionLoading && (
          <div className="absolute top-2 right-2">
            <div className="h-4 w-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin opacity-60"></div>
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
        
        {/* 🔥 修正: AI提案状態の表示（改善版） */}
        {aiSuggestionStatus && (
          <p className={`text-xs ${aiSuggestionStatus.color} flex items-center`}>
            {aiSuggestionLoading && (
              <div className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin mr-1"></div>
            )}
            {aiSuggestionStatus.text}
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
              {/* 期限と見積もり時間の設定 */}
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
                  {/* 🔥 追加: AI提案の説明 */}
                  {aiSuggestionStatus && lastSuggestedText === text && (
                    <span className="ml-2 text-xs text-green-600">(AI提案済み)</span>
                  )}
                </label>
                <div className="flex space-x-2">
                  {(['high', 'medium', 'low'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        priority === p ? getPriorityClass(p) : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
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
          {text.length > 5 && <span className="ml-2">• AIが自動で優先度を判定します</span>}
        </p>
      )}
    </form>
  );
}