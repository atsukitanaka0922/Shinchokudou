/**
 * 拡張タスクリストコンポーネント
 * 
 * サブタスクとメモ機能を含む拡張されたタスクリスト
 * 各タスクの詳細表示、編集、サブタスク管理などの機能を提供
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEnhancedTaskStore } from '@/store/enhancedTaskStore';
import { useAuthStore } from '@/store/auth';
import { PriorityLevel } from '@/lib/aiPriorityAssignment';
import { SubTaskUtils, TaskUtils } from '@/lib/taskInterfaces';

/**
 * 拡張タスクリストコンポーネント
 */
export default function EnhancedTaskList() {
  // ストアからタスク機能を取得
  const { 
    tasks, 
    loading,
    loadTasks,
    toggleCompleteTask, 
    removeTask, 
    setDeadline, 
    setPriority, 
    updateTaskMemo,
    setEstimatedTime,
    addSubTask,
    toggleCompleteSubTask,
    removeSubTask,
    startPomodoro
  } = useEnhancedTaskStore();
  
  const { user } = useAuthStore();
  
  // ローカル状態
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{taskId: string, field: string} | null>(null);
  const [editValues, setEditValues] = useState<{[key: string]: any}>({});
  const [newSubTaskText, setNewSubTaskText] = useState<{[taskId: string]: string}>({});
  const [mounted, setMounted] = useState(false);
  
  // コンポーネントのマウント状態を追跡
  useEffect(() => {
    setMounted(true);
    
    // マウント後にタスクを確実に読み込む
    if (user) {
      console.log("拡張タスクリストコンポーネントがマウントされました - タスク読み込み");
      loadTasks();
    }
    
    return () => {
      setMounted(false);
    };
  }, [user, loadTasks]);
  
  /**
   * タスクの展開/収納を切り替え
   */
  const toggleExpand = (taskId: string) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
      setEditingField(null);
    } else {
      setExpandedTaskId(taskId);
      
      // 選択したタスクの現在の値をフォームにセット
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setEditValues({
          [`${taskId}_deadline`]: task.deadline || '',
          [`${taskId}_priority`]: task.priority || 'medium',
          [`${taskId}_memo`]: task.memo || '',
          [`${taskId}_estimatedMinutes`]: task.estimatedMinutes || ''
        });
      }
    }
  };

  /**
   * 編集モードの切り替え
   */
  const toggleEdit = (taskId: string, field: string) => {
    if (editingField?.taskId === taskId && editingField?.field === field) {
      setEditingField(null);
    } else {
      setEditingField({ taskId, field });
    }
  };

  /**
   * 編集内容を保存
   */
  const saveEdit = async (taskId: string, field: string) => {
    const value = editValues[`${taskId}_${field}`];
    
    try {
      switch (field) {
        case 'deadline':
          await setDeadline(taskId, value);
          break;
        case 'priority':
          await setPriority(taskId, value);
          break;
        case 'memo':
          await updateTaskMemo(taskId, value);
          break;
        case 'estimatedMinutes':
          if (value && !isNaN(value)) {
            await setEstimatedTime(taskId, parseInt(value));
          }
          break;
      }
      setEditingField(null);
    } catch (error) {
      console.error('編集保存エラー:', error);
    }
  };

  /**
   * サブタスクを追加
   */
  const handleAddSubTask = async (taskId: string) => {
    const text = newSubTaskText[taskId]?.trim();
    if (!text) return;

    try {
      await addSubTask({ text, parentTaskId: taskId });
      setNewSubTaskText({ ...newSubTaskText, [taskId]: '' });
    } catch (error) {
      console.error('サブタスク追加エラー:', error);
    }
  };

  /**
   * タスク完了からの経過時間を計算
   */
  const getCompletionStatusText = (task: any): string => {
    if (!task.completed || !task.completedAt) return '';
    
    const now = Date.now();
    const diffMs = now - task.completedAt;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今日完了';
    if (diffDays === 1) return '昨日完了';
    
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
          filteredTasks.map((task) => {
            const subTaskProgress = SubTaskUtils.calculateProgress(task.subTasks);
            const totalProgress = TaskUtils.calculateTotalProgress(task);
            const complexity = TaskUtils.calculateComplexity(task);
            
            return (
              <li
                key={task.id}
                className={`p-4 ${task.completed ? 'bg-gray-50' : ''}`}
              >
                <div className="flex items-start">
                  {/* 完了チェックボックス */}
                  <div className="flex-shrink-0 mr-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleCompleteTask(task.id)}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 rounded"
                    />
                  </div>
                  
                  {/* タスク内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-sm font-medium ${
                          task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}
                      >
                        {task.text}
                      </p>
                      
                      {/* 複雑度アイコン */}
                      <div className="flex items-center space-x-1">
                        {complexity === 'complex' && <span className="text-red-500" title="複雑なタスク">🔴</span>}
                        {complexity === 'medium' && <span className="text-yellow-500" title="中程度のタスク">🟡</span>}
                        {complexity === 'simple' && <span className="text-green-500" title="シンプルなタスク">🟢</span>}
                      </div>
                    </div>
                    
                    {/* プログレスバー（サブタスクがある場合） */}
                    {task.subTasks.length > 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>進捗: {subTaskProgress.completed}/{subTaskProgress.total}</span>
                          <span>{totalProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div 
                            className="bg-blue-500 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${totalProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* タスクのメタ情報 */}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
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
                      
                      {/* 見積もり時間 */}
                      {task.estimatedMinutes && (
                        <span className="inline-flex items-center">
                          ⏱️ {task.estimatedMinutes}分
                        </span>
                      )}
                      
                      {/* サブタスク数 */}
                      {task.subTasks.length > 0 && (
                        <span className="inline-flex items-center">
                          📝 {task.subTasks.length}個のサブタスク
                        </span>
                      )}
                      
                      {/* メモアイコン */}
                      {task.memo && (
                        <span className="inline-flex items-center">
                          📄 メモあり
                        </span>
                      )}
                      
                      {/* 完了日時表示 */}
                      {task.completed && task.completedAt && (
                        <span className="inline-flex items-center text-xs text-blue-600">
                          ✓ {getCompletionStatusText(task)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* タスク操作ボタン */}
                  <div className="flex ml-2 space-x-1">
                    {/* 詳細展開ボタン */}
                    <button
                      onClick={() => toggleExpand(task.id)}
                      className="text-gray-400 hover:text-gray-500"
                      title="詳細を表示"
                    >
                      {expandedTaskId === task.id ? '🔽' : '▶️'}
                    </button>
                    
                    {/* ポモドーロ開始ボタン */}
                    <button
                      onClick={() => startPomodoro(task.id)}
                      className="text-gray-400 hover:text-gray-500"
                      disabled={task.completed}
                      title="ポモドーロを開始"
                    >
                      ⏱️
                    </button>
                    
                    {/* 削除ボタン */}
                    <button
                      onClick={() => removeTask(task.id)}
                      className="text-gray-400 hover:text-red-500"
                      title="削除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                {/* タスク詳細パネル */}
                <AnimatePresence>
                  {expandedTaskId === task.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 bg-gray-50 p-4 rounded-md overflow-hidden"
                    >
                      <div className="space-y-4">
                        {/* 基本情報編集セクション */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* 期限編集 */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-sm font-medium text-gray-700">
                                期限
                              </label>
                              <button
                                onClick={() => toggleEdit(task.id, 'deadline')}
                                className="text-xs text-blue-500 hover:text-blue-700"
                              >
                                {editingField?.taskId === task.id && editingField?.field === 'deadline' ? 'キャンセル' : '編集'}
                              </button>
                            </div>
                            
                            {editingField?.taskId === task.id && editingField?.field === 'deadline' ? (
                              <div className="flex">
                                <input
                                  type="date"
                                  value={editValues[`${task.id}_deadline`] || ''}
                                  onChange={(e) => setEditValues({
                                    ...editValues,
                                    [`${task.id}_deadline`]: e.target.value
                                  })}
                                  className="flex-1 text-sm p-2 border rounded"
                                />
                                <button
                                  onClick={() => saveEdit(task.id, 'deadline')}
                                  className="ml-2 px-3 py-1 bg-blue-500 text-white text-xs rounded"
                                >
                                  保存
                                </button>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-600">
                                {task.deadline || '設定されていません'}
                              </p>
                            )}
                          </div>
                          
                          {/* 見積もり時間編集 */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-sm font-medium text-gray-700">
                                見積もり時間
                              </label>
                              <button
                                onClick={() => toggleEdit(task.id, 'estimatedMinutes')}
                                className="text-xs text-blue-500 hover:text-blue-700"
                              >
                                {editingField?.taskId === task.id && editingField?.field === 'estimatedMinutes' ? 'キャンセル' : '編集'}
                              </button>
                            </div>
                            
                            {editingField?.taskId === task.id && editingField?.field === 'estimatedMinutes' ? (
                              <div className="flex">
                                <input
                                  type="number"
                                  value={editValues[`${task.id}_estimatedMinutes`] || ''}
                                  onChange={(e) => setEditValues({
                                    ...editValues,
                                    [`${task.id}_estimatedMinutes`]: e.target.value
                                  })}
                                  placeholder="分"
                                  className="flex-1 text-sm p-2 border rounded"
                                />
                                <button
                                  onClick={() => saveEdit(task.id, 'estimatedMinutes')}
                                  className="ml-2 px-3 py-1 bg-blue-500 text-white text-xs rounded"
                                >
                                  保存
                                </button>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-600">
                                {task.estimatedMinutes ? `${task.estimatedMinutes}分` : '設定されていません'}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* 優先度編集 */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              優先度
                            </label>
                            <button
                              onClick={() => toggleEdit(task.id, 'priority')}
                              className="text-xs text-blue-500 hover:text-blue-700"
                            >
                              {editingField?.taskId === task.id && editingField?.field === 'priority' ? 'キャンセル' : '編集'}
                            </button>
                          </div>
                          
                          {editingField?.taskId === task.id && editingField?.field === 'priority' ? (
                            <div className="flex space-x-2">
                              {(['high', 'medium', 'low'] as const).map((p) => (
                                <button
                                  key={p}
                                  onClick={() => {
                                    setEditValues({
                                      ...editValues,
                                      [`${task.id}_priority`]: p
                                    });
                                    saveEdit(task.id, 'priority');
                                  }}
                                  className={`flex-1 px-3 py-1 text-xs rounded ${
                                    task.priority === p
                                      ? getPriorityClass(p)
                                      : 'bg-gray-200 text-gray-700'
                                  }`}
                                >
                                  {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className={`inline-block px-3 py-1 rounded text-xs ${getPriorityClass(task.priority)}`}>
                              {getPriorityText(task.priority)}優先度
                            </span>
                          )}
                        </div>
                        
                        {/* メモ編集 */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              メモ・詳細
                            </label>
                            <button
                              onClick={() => toggleEdit(task.id, 'memo')}
                              className="text-xs text-blue-500 hover:text-blue-700"
                            >
                              {editingField?.taskId === task.id && editingField?.field === 'memo' ? 'キャンセル' : '編集'}
                            </button>
                          </div>
                          
                          {editingField?.taskId === task.id && editingField?.field === 'memo' ? (
                            <div>
                              <textarea
                                value={editValues[`${task.id}_memo`] || ''}
                                onChange={(e) => setEditValues({
                                  ...editValues,
                                  [`${task.id}_memo`]: e.target.value
                                })}
                                rows={4}
                                className="w-full text-sm p-2 border rounded"
                                placeholder="メモや詳細を入力..."
                              />
                              <div className="flex justify-between mt-2">
                                <p className="text-xs text-gray-500">マークダウン記法に対応</p>
                                <button
                                  onClick={() => saveEdit(task.id, 'memo')}
                                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded"
                                >
                                  保存
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                              {task.memo ? (
                                <pre className="whitespace-pre-wrap">{task.memo}</pre>
                              ) : (
                                <em className="text-gray-400">メモが設定されていません</em>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* サブタスクセクション */}
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-medium text-gray-700">
                              サブタスク ({task.subTasks.length})
                            </h4>
                            {subTaskProgress.total > 0 && (
                              <span className="text-xs text-gray-500">
                                {subTaskProgress.completed}/{subTaskProgress.total} 完了
                              </span>
                            )}
                          </div>
                          
                          {/* サブタスク追加フォーム */}
                          <div className="flex mb-3">
                            <input
                              type="text"
                              value={newSubTaskText[task.id] || ''}
                              onChange={(e) => setNewSubTaskText({
                                ...newSubTaskText,
                                [task.id]: e.target.value
                              })}
                              placeholder="新しいサブタスクを追加..."
                              className="flex-1 text-sm p-2 border rounded-l"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddSubTask(task.id);
                                }
                              }}
                            />
                            <button
                              onClick={() => handleAddSubTask(task.id)}
                              className="px-3 py-2 bg-green-500 text-white text-sm rounded-r hover:bg-green-600"
                            >
                              追加
                            </button>
                          </div>
                          
                          {/* サブタスクリスト */}
                          {task.subTasks.length > 0 ? (
                            <ul className="space-y-2">
                              {SubTaskUtils.sortByOrder(task.subTasks).map((subTask) => (
                                <li key={subTask.id} className="flex items-center bg-white p-2 rounded border">
                                  <input
                                    type="checkbox"
                                    checked={subTask.completed}
                                    onChange={() => toggleCompleteSubTask(task.id, subTask.id)}
                                    className="h-4 w-4 text-blue-600 mr-2"
                                  />
                                  <span className={`flex-1 text-sm ${subTask.completed ? 'line-through text-gray-500' : ''}`}>
                                    {subTask.text}
                                  </span>
                                  {subTask.completed && (
                                    <span className="text-xs text-green-600 mr-2">✓</span>
                                  )}
                                  <button
                                    onClick={() => removeSubTask(task.id, subTask.id)}
                                    className="text-gray-400 hover:text-red-500 text-sm"
                                  >
                                    ×
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-400 text-center py-2 bg-white rounded border border-dashed">
                              サブタスクがありません
                            </p>
                          )}
                        </div>
                        
                        {/* 完了したタスクの場合は自動削除の説明 */}
                        {task.completed && task.completedAt && (
                          <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded">
                            <p>このタスクは完了済みです。完了から1週間後に自動的に削除されます。</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })
        )}
      </ul>
      
      {/* タスク数の表示 */}
      <div className="p-3 text-xs text-gray-500 border-t">
        合計: {filteredTasks.length} / {tasks.length} タスク
        {tasks.length > 0 && (
          <>
            {' • '}
            サブタスク: {tasks.reduce((sum, t) => sum + t.subTasks.length, 0)}個
            {' • '}
            メモ付き: {tasks.filter(t => t.memo && t.memo.length > 0).length}個
          </>
        )}
      </div>
    </div>
  );
}