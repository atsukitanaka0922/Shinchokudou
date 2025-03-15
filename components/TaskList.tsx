import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { useTaskStore } from "@/store/taskStore";
import { useDevice } from "@/hooks/useDevice";

export default function TaskList() {
  const { user } = useAuthStore();
  const { tasks, toggleCompleteTask, removeTask, setDeadline, moveTaskUp, moveTaskDown, startPomodoro, clearTasks, loadTasks } = useTaskStore();
  const isMobile = useDevice();

  // ユーザーがログアウトしたらタスクをリセット、ログインしたらタスクを再取得
  useEffect(() => {
    if (!user) {
      clearTasks(); // ログアウト時にタスクをリセット
    } else {
      loadTasks(); // ログイン時にタスクを取得
    }
  }, [user, clearTasks, loadTasks]);

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-lg font-bold mb-4">📝 タスク一覧</h2>
      {tasks.length === 0 ? (
        <p className="text-gray-500">タスクがありません</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li key={task.id} className={`border rounded-md ${isMobile ? "p-3" : "p-2 flex items-center justify-between"}`}>
              {isMobile ? (
                // モバイル表示（縦長レイアウト）
                <div className="space-y-2">
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

                  {/* 締め切り設定 */}
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">期限:</span>
                    <input
                      type="date"
                      value={task.deadline || ""}
                      onChange={(e) => setDeadline(task.id, e.target.value)}
                      className="border px-2 py-1 rounded-md text-sm flex-1"
                    />
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
                  {/* タスク名と完了チェックボックス */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleCompleteTask(task.id)}
                      className="w-5 h-5"
                    />
                    <span className={`text-lg ${task.completed ? "line-through text-gray-400" : "text-gray-800"}`}>
                      {task.text}
                    </span>
                  </div>

                  {/* 締め切り設定 */}
                  <input
                    type="date"
                    value={task.deadline || ""}
                    onChange={(e) => setDeadline(task.id, e.target.value)}
                    className="border px-2 py-1 rounded-md text-sm"
                  />

                  {/* タスクの完了時間 (完了済みの場合のみ表示) */}
                  {task.completed && task.completedAt && (
                    <span className="text-sm text-gray-500">
                      ✅ 完了: {new Date(task.completedAt).toLocaleString()}
                    </span>
                  )}

                  {/* 操作ボタン */}
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}