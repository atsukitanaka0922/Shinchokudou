import { useState, useEffect } from "react";
import { useTaskStore } from "@/store/taskStore";
import { useAuthStore } from "@/store/auth";
import { useFeedbackStore } from "@/store/feedbackStore";
import { predictTaskPriority, PriorityLevel } from "@/lib/aiPriorityAssignment";
import { motion, AnimatePresence } from "framer-motion";

export default function AddTaskWithPriority() {
  const [taskText, setTaskText] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<PriorityLevel>("medium");
  const [aiSuggestion, setAiSuggestion] = useState<PriorityLevel | null>(null);
  const [aiFactors, setAiFactors] = useState<string[]>([]);
  const [showFactors, setShowFactors] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [priorityUpdated, setPriorityUpdated] = useState(false);
  
  const { addTask } = useTaskStore();
  const { user } = useAuthStore();
  const { setMessage } = useFeedbackStore();

  // タスクテキストが変更されたときに自動的に優先度を予測
  useEffect(() => {
    // 300ms後に予測を実行（タイピング中は実行しない）
    if (typingTimeout) clearTimeout(typingTimeout);
    
    if (taskText.length > 3) {
      const timeout = setTimeout(async () => {
        await predictPriority();
      }, 300);
      
      setTypingTimeout(timeout);
    } else {
      setAiSuggestion(null);
      setAiFactors([]);
    }

    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [taskText, deadline]);

  // AIによる優先度予測を実行
  const predictPriority = async () => {
    if (!taskText) return;
    
    try {
      const result = await predictTaskPriority(
        taskText,
        deadline,
        user ? user.uid : undefined
      );
      
      setAiSuggestion(result.priority);
      setAiFactors(result.factors);
      
      // ユーザーが明示的に優先度を変更していない場合は、AIの提案を採用
      if (!priorityUpdated) {
        setPriority(result.priority);
      }
    } catch (error) {
      console.error("優先度予測エラー:", error);
    }
  };

  // 手動での優先度設定
  const handlePriorityChange = (newPriority: PriorityLevel) => {
    setPriority(newPriority);
    setPriorityUpdated(true);
  };

  // AIの提案を適用
  const applyAiSuggestion = () => {
    if (aiSuggestion) {
      setPriority(aiSuggestion);
      setMessage("AIの提案を適用しました");
    }
  };

  // タスク追加処理
  const handleAdd = async () => {
    if (taskText.trim()) {
      // priorityフィールドを含むタスクを追加
      await addTask(taskText, deadline, priority);
      setTaskText("");
      setDeadline("");
      setPriority("medium");
      setPriorityUpdated(false);
    }
  };

  // 優先度によるスタイル
  const getPriorityStyles = (level: PriorityLevel) => {
    switch (level) {
      case 'urgent':
        return {
          bgColor: 'bg-red-500',
          hoverColor: 'hover:bg-red-600',
          textColor: 'text-white',
          label: '緊急'
        };
      case 'high':
        return {
          bgColor: 'bg-orange-500',
          hoverColor: 'hover:bg-orange-600',
          textColor: 'text-white',
          label: '高'
        };
      case 'medium':
        return {
          bgColor: 'bg-yellow-400',
          hoverColor: 'hover:bg-yellow-500',
          textColor: 'text-gray-800',
          label: '中'
        };
      case 'low':
        return {
          bgColor: 'bg-green-400',
          hoverColor: 'hover:bg-green-500',
          textColor: 'text-gray-800',
          label: '低'
        };
      default:
        return {
          bgColor: 'bg-gray-400',
          hoverColor: 'hover:bg-gray-500',
          textColor: 'text-white',
          label: '中'
        };
    }
  };

  // 現在の優先度のスタイル
  const currentPriorityStyles = getPriorityStyles(priority);
  // AIの提案の優先度のスタイル
  const aiSuggestionStyles = aiSuggestion ? getPriorityStyles(aiSuggestion) : null;

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-lg font-bold mb-4">📝 AIによる優先度予測付きタスク追加</h2>
      
      <div className="space-y-3">
        {/* タスク入力フィールド */}
        <div>
          <label htmlFor="task-text" className="block text-sm font-medium text-gray-700 mb-1">
            タスク内容
          </label>
          <input
            id="task-text"
            type="text"
            value={taskText}
            onChange={(e) => {
              setTaskText(e.target.value);
              setPriorityUpdated(false);
            }}
            placeholder="新しいタスクを追加"
            className="border p-2 rounded w-full"
          />
        </div>

        {/* 期限設定 */}
        <div>
          <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
            期限（任意）
          </label>
          <input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* 優先度設定 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            優先度
          </label>
          <div className="flex space-x-2">
            {(['urgent', 'high', 'medium', 'low'] as PriorityLevel[]).map((level) => {
              const styles = getPriorityStyles(level);
              return (
                <button
                  key={level}
                  onClick={() => handlePriorityChange(level)}
                  className={`px-4 py-2 rounded-lg ${styles.bgColor} ${styles.hoverColor} ${styles.textColor} ${
                    priority === level ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  }`}
                >
                  {styles.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* AI提案表示エリア */}
        {aiSuggestion && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-sm font-medium">AIの優先度提案:</span>
                <span className={`ml-2 px-3 py-1 rounded-lg text-sm ${aiSuggestionStyles?.bgColor} ${aiSuggestionStyles?.textColor}`}>
                  {aiSuggestionStyles?.label}
                </span>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => setShowFactors(!showFactors)}
                  className="text-blue-500 hover:text-blue-700 text-sm mr-2"
                >
                  {showFactors ? '理由を隠す' : '理由を表示'}
                </button>
                <button
                  onClick={applyAiSuggestion}
                  className="px-2 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                >
                  適用
                </button>
              </div>
            </div>
            
            <AnimatePresence>
              {showFactors && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 text-sm text-gray-600"
                >
                  <ul className="list-disc pl-5 space-y-1">
                    {aiFactors.map((factor, index) => (
                      <li key={index}>{factor}</li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 送信ボタン */}
        <button
          onClick={handleAdd}
          className="mt-3 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          追加
        </button>
      </div>
    </div>
  );
}