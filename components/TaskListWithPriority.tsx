import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { useTaskStore } from "@/store/taskStore";
import { useDevice } from "@/hooks/useDevice";
import { PriorityLevel } from "@/lib/aiPriorityAssignment";

export default function TaskListWithPriority() {
  const { user } = useAuthStore();
  const { 
    tasks, 
    toggleCompleteTask, 
    removeTask, 
    setDeadline, 
    setPriority,
    moveTaskUp, 
    moveTaskDown, 
    startPomodoro, 
    clearTasks, 
    loadTasks 
  } = useTaskStore();
  const isMobile = useDevice();

  // ユーザーがログアウトしたらタスクをリセット、ログインしたらタスクを再取得
  useEffect(() => {
    if (!user) {
      clearTasks(); // ログアウト時にタスクをリセット
    } else {
      loadTasks(); // ログイン時にタスクを取得
    }
  }, [user, clearTasks, loadTasks]);

  // 優先度に基づくスタイルを取得
  const getPriorityStyles = (priority: PriorityLevel) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 border-l-4 border-red-500';
      case 'high':
        return 'bg-orange-100 border-l-4 border-orange-500';
      case 'medium':
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      case 'low':
        return 'bg-green-50 border-l-4 border-green-500';
      default:
        return 'bg-gray-50';
    }
  };

  // 優先度のラベル
  const getPriorityLabel = (priority: PriorityLevel) => {
    switch (priority) {
      case 'urgent': return '緊急';
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '中';
    }
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-lg font-bold mb-4">📝 タスク一覧</h2>
      {tasks.length === 0 ? (
        <p className="text-gray-500">タスクがありません</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={`${getPriorityStyles(task.priority || 'medium')} rounded-md overflow-hidden ${
                task.completed ? 'opacity-70' : ''
              }`}
            >
              <div className={isMobile ? "p-3" : "p-3 flex items-center justify-between"}>
                {isMobile ? (
                  // モバイル表示（縦長レイアウト）
                  <div className="space-y-2">
                    {/* タスク情報ヘッダー */}
                    <div className="flex justify-between items-center">
                      {/* 優先度バッジ */}
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        task.priority === 'urgent' ? 'bg-red-200 text-red-800' :
                        task.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                        task.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-green-200 text-green-800'
                      }`}>
                        {getPriorityLabel(task.priority || 'medium')}
                      </span>
                      
                      {/* 締め切り */}
                      {task.deadline && (
                        <span className="text-xs text-gray-500">
                          期限: {task.deadline}
                        </span>
                      )}
                    </div>
                    
                    {/* タスク名と完了チェックボックス */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleCompleteTask(task.id)}
                        className="w-5 h-5"
                      />
                      <span className={`text-lg break-words ${task.completed ? "line-through text-gray-400" : "text-gray-800"}`}>
                        {task.text}
                      </span>
                    </div>
                    
                    {/* 設定エリア */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* 締め切り設定 */}
                      <div>
                        <label className="text-xs text-gray-500 block">期限:</label>
                        <input
                          type="date"
                          value={task.deadline || ""}
                          onChange={(e) => setDeadline(task.id, e.target.value)}
                          className="border px-2 py-1 rounded-md text-sm w-full"
                        />
                      </div>
                      
                      {/* 優先度設定 */}
                      <div>
                        <label className="text-xs text-gray-500 block">優先度:</label>
                        <select
                          value={task.priority || 'medium'}
                          onChange={(e) => setPriority(task.id, e.target.value as PriorityLevel)}
                          className="border px-2 py-1 rounded-md text-sm w-full"
                        >
                          <option value="urgent">緊急</option>
                          <option value="high">高</option>
                          <option value="medium">中</option>
                          <option value="low">低</option>
                        </select>
                      </div>
                    </div>

                    {/* タスクの完了時間 (完了済みの場合のみ表示) */}
                    {task.completed && task.completedAt && (
                      <span className="text-sm text-gray-500 block">
                        ✅ 完了: {new Date(task.completedAt).toLocaleString()}
                      </span>
                    )}

                    {/* 操作ボタン */}
                    <div className="flex justify-between mt-2">
                      <div className="flex space-x-2">
                        <button onClick={() => moveTaskUp(task.id)} className="px-2 py-1 bg-blue-500 text-white rounded-md">
                          🔼
                        </button>
                        <button onClick={() => moveTaskDown(task.id)} className="px-2 py-1 bg-blue-500 text-white rounded-md">
                          🔽
                        </button>
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => startPomodoro(task.id)} className="px-2 py-1 bg-green-500 text-white rounded-md">
                          ⏳
                        </button>
                        <button onClick={() => removeTask(task.id)} className="px-2 py-1 bg-red-500 text-white rounded-md">
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // デスクトップ表示（横長レイアウト）
                  <>
                    {/* 左側: タスク名と完了チェックボックス */}
                    <div className="flex items-center space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleCompleteTask(task.id)}
                        className="w-5 h-5"
                      />
                      <div className="flex flex-col">
                        <span className={`text-lg ${task.completed ? "line-through text-gray-400" : "text-gray-800"}`}>
                          {task.text}
                        </span>
                        {task.completed && task.completedAt && (
                          <span className="text-xs text-gray-500">
                            ✅ 完了: {new Date(task.completedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 中央: 優先度と締め切り */}
                    <div className="flex items-center space-x-4 mx-4">
                      {/* 優先度設定 */}
                      <div className="w-24">
                        <label className="text-xs text-gray-500 block">優先度:</label>
                        <select
                          value={task.priority || 'medium'}
                          onChange={(e) => setPriority(task.id, e.target.value as PriorityLevel)}
                          className="border px-2 py-1 rounded-md text-sm w-full"
                        >
                          <option value="urgent">緊急</option>
                          <option value="high">高</option>
                          <option value="medium">中</option>
                          <option value="low">低</option>
                        </select>
                      </div>

                      {/* 締め切り設定 */}
                      <div className="w-40">
                        <label className="text-xs text-gray-500 block">期限:</label>
                        <input
                          type="date"
                          value={task.deadline || ""}
                          onChange={(e) => setDeadline(task.id, e.target.value)}
                          className="border px-2 py-1 rounded-md text-sm w-full"
                        />
                      </div>
                    </div>

                    {/* 右側: 操作ボタン */}
                    <div className="flex space-x-2">
                      <button onClick={() => moveTaskUp(task.id)} className="px-2 py-1 bg-blue-500 text-white rounded-md">
                        🔼
                      </button>
                      <button onClick={() => moveTaskDown(task.id)} className="px-2 py-1 bg-blue-500 text-white rounded-md">
                        🔽
                      </button>
                      <button onClick={() => startPomodoro(task.id)} className="px-2 py-1 bg-green-500 text-white rounded-md">
                        ⏳
                      </button>
                      <button onClick={() => removeTask(task.id)} className="px-2 py-1 bg-red-500 text-white rounded-md">
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}