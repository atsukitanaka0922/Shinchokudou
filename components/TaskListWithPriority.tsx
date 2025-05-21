/**
 * 優先度付きタスクリストコンポーネント
 * 
 * タスクを優先度別に表示し、完了/未完了でフィルタリングするリスト
 * 各タスクの編集、削除、ポモドーロ開始などの機能を提供します
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/auth';
import { PriorityLevel } from '@/lib/aiPriorityAssignment';

/**
 * 優先度付きタスクリストコンポーネント
 * タスクの表示、操作などの機能を提供
 */
export default function TaskListWithPriority() {
  // ストアからタスク機能を取得
  const { 
    tasks, 
    loading,
    loadTasks,
    toggleCompleteTask, 
    removeTask, 
    setDeadline, 
    setPriority, 
    startPomodoro
  } = useTaskStore();
  
  const { user } = useAuthStore();
  
  // ローカル状態
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [editDeadline, setEditDeadline] = useState<string>('');
  const [editPriority, setEditPriority] = useState<PriorityLevel>('medium');
  const [mounted, setMounted] = useState(false);
  
  // コンポーネントのマウント状態を追跡
  useEffect(() => {
    setMounted(true);
    
    // マウント後にタスクを確実に読み込む
    if (user) {
      console.log("タスクリストコンポーネントがマウントされました - タスク読み込み");
      loadTasks();
    }
    
    return () => {
      setMounted(false);
    };
  }, [user, loadTasks]);
  
  // タスクの展開/収納を切り替え
  const toggleExpand = (taskId: string) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    } else {
      setExpandedTaskId(taskId);
      
      // 選択したタスクの現在の値をフォームにセット
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setEditDeadline(task.deadline || '');
        setEditPriority(task.priority || 'medium');
      }
    }
  };
  
  // 期限の更新処理
  const handleUpdateDeadline = (taskId: string) => {
    setDeadline(taskId, editDeadline);
    setExpandedTaskId(null); // 編集パネルを閉じる
  };
  
  // 優先度の更新処理
  const handleUpdatePriority = (taskId: string, priority: PriorityLevel) => {
    setPriority(taskId, priority);
    setEditPriority(priority);
  };
  
  // タスク完了からの経過時間を計算
  const getCompletionStatusText = (task: any): string => {
    if (!task.completed || !task.completedAt) return '';
    
    const now = Date.now();
    const diffMs = now - task.completedAt;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今日完了';
    if (diffDays === 1) return '昨日完了';
    
    // 残り何日で削除されるかを計算
    const daysUntilDeletion = 7 - diffDays;
    if (daysUntilDeletion > 0) {
      return `${diffDays}日前に完了（あと${daysUntilDeletion}日で削除）`;
    } else {
      return `${diffDays}日前に完了（もうすぐ削除）`;
    }
  };
  
  // フィルター条件に基づいてタスクをフィルタリング
  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });
  
  // クライアントサイドレンダリングの確認
  if (!mounted) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">📋 タスク一覧</h2>
        <div className="py-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  // ユーザーがログインしていない場合
  if (!user) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">📋 タスク一覧</h2>
        <p className="text-gray-600">ログインするとタスクが表示されます</p>
      </div>
    );
  }
  
  // データ読み込み中の表示
  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">📋 タスク一覧</h2>
        <div className="py-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
        <p className="text-center text-gray-500">タスクを読み込んでいます...</p>
      </div>
    );
  }
  
  // タスクがない場合
  if (tasks.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">📋 タスク一覧</h2>
        <p className="text-gray-600">タスクがありません。新しいタスクを追加してください。</p>
        <button 
          onClick={() => loadTasks()} 
          className="mt-2 text-sm text-blue-500 hover:text-blue-700"
        >
          🔄 再読み込み
        </button>
      </div>
    );
  }
  
  // 優先度に応じたスタイルクラスを取得
  const getPriorityClass = (priority: PriorityLevel) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  // 優先度表示テキストを取得
  const getPriorityText = (priority: PriorityLevel) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '中';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* フィルタータブ */}
      <div className="flex border-b">
        {(['all', 'active', 'completed'] as const).map((option) => (
          <button
            key={option}
            onClick={() => setFilter(option)}
            className={`flex-1 py-2 text-center text-sm font-medium ${
              filter === option
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {option === 'all' ? 'すべて' : option === 'active' ? '未完了' : '完了済み'}
          </button>
        ))}
      </div>
      
      {/* タスク件数と再読み込みボタン */}
      <div className="flex justify-between items-center px-3 py-2 border-b">
        <p className="text-xs text-gray-500">
          タスク: {tasks.length}件 (表示: {filteredTasks.length}件)
        </p>
        <button 
          onClick={() => loadTasks()} 
          className="text-xs text-blue-500 hover:text-blue-700"
        >
          🔄 再読み込み
        </button>
      </div>
      
      {/* タスクリスト */}
      <ul className="divide-y divide-gray-200">
        {filteredTasks.length === 0 ? (
          <li className="p-4 text-center text-gray-500">
            現在の表示条件では該当するタスクがありません
          </li>
        ) : (
          filteredTasks.map((task) => (
            <li
              key={task.id}
              className={`p-4 ${task.completed ? 'bg-gray-50' : ''}`}
            >
              <div className="flex items-start">
                {/* 完了チェックボックス */}
                <div className="flex-shrink-0 mr-2">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleCompleteTask(task.id)}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 rounded"
                  />
                </div>
                
                {/* タスク内容 */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}
                  >
                    {task.text}
                  </p>
                  
                  {/* タスクのメタ情報 */}
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                    {/* 期限表示 */}
                    {task.deadline && (
                      <span className="inline-flex items-center">
                        📅 {task.deadline}
                      </span>
                    )}
                    
                    {/* 優先度表示 */}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                        getPriorityClass(task.priority)
                      }`}
                    >
                      {getPriorityText(task.priority)}
                    </span>
                    
                    {/* 完了日時表示 */}
                    {task.completed && task.completedAt && (
                      <span className="inline-flex items-center text-xs text-blue-600">
                        ✓ {getCompletionStatusText(task)}
                      </span>
                    )}
                    
                    {/* 作成日時表示 */}
                    {task.createdAt && !task.completed && (
                      <span className="inline-flex items-center">
                        作成: {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* タスク操作ボタン */}
                <div className="flex ml-2 space-x-1">
                  {/* 編集ボタン */}
                  <button
                    onClick={() => toggleExpand(task.id)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    ✏️
                  </button>
                  
                  {/* ポモドーロ開始ボタン */}
                  <button
                    onClick={() => startPomodoro(task.id)}
                    className="text-gray-400 hover:text-gray-500"
                    disabled={task.completed}
                  >
                    ⏱️
                  </button>
                  
                  {/* 削除ボタン */}
                  <button
                    onClick={() => removeTask(task.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              {/* タスク編集パネル */}
              <AnimatePresence>
                {expandedTaskId === task.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 bg-gray-50 p-3 rounded-md overflow-hidden"
                  >
                    <div className="space-y-3">
                      {/* 期限編集 */}
                      <div>
                        <label className="block text-xs text-gray-700 mb-1">
                          期限:
                        </label>
                        <div className="flex">
                          <input
                            type="date"
                            value={editDeadline}
                            onChange={(e) => setEditDeadline(e.target.value)}
                            className="flex-1 text-sm p-1 border rounded"
                          />
                          <button
                            onClick={() => handleUpdateDeadline(task.id)}
                            className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded"
                          >
                            更新
                          </button>
                        </div>
                      </div>
                      
                      {/* 優先度編集 */}
                      <div>
                        <label className="block text-xs text-gray-700 mb-1">
                          優先度:
                        </label>
                        <div className="flex space-x-1">
                          {(['high', 'medium', 'low'] as const).map((p) => (
                            <button
                              key={p}
                              onClick={() => handleUpdatePriority(task.id, p)}
                              className={`flex-1 px-2 py-1 text-xs rounded ${
                                task.priority === p
                                  ? getPriorityClass(p)
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* 完了したタスクの場合は自動削除の説明 */}
                      {task.completed && task.completedAt && (
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                          <p>このタスクは完了済みです。完了から1週間後に自動的に削除されます。</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          ))
        )}
      </ul>
      
      {/* タスク数の表示 */}
      <div className="p-3 text-xs text-gray-500 border-t">
        合計: {filteredTasks.length} / {tasks.length} タスク
      </div>
    </div>
  );
}