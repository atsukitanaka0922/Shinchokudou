import { useEffect, useState } from "react";
import { useTaskStore } from "@/store/taskStore";
import { motion, AnimatePresence } from "framer-motion";

export default function DeadlineWarning() {
  const { tasks } = useTaskStore();
  const [urgentTasks, setUrgentTasks] = useState<any[]>([]);
  const [notificationShown, setNotificationShown] = useState<{[key: string]: boolean}>({});
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // 現在の日付と3日後の日付を取得
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    
    // 3日後の日付を計算
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);
    const threeDaysLaterStr = threeDaysLater.toISOString().split("T")[0];
    
    // 期限が今日またはそれ以前、もしくは3日以内のタスクを抽出
    const urgent = tasks.filter((task) => {
      return (
        !task.completed && 
        task.deadline && 
        (task.deadline <= todayStr || task.deadline <= threeDaysLaterStr)
      );
    });

    // 優先度別にソート（期限が今日または過去のタスクを先頭に）
    urgent.sort((a, b) => {
      if (a.deadline === todayStr && b.deadline !== todayStr) return -1;
      if (a.deadline !== todayStr && b.deadline === todayStr) return 1;
      if (a.deadline < todayStr && b.deadline >= todayStr) return -1;
      if (a.deadline >= todayStr && b.deadline < todayStr) return 1;
      return a.deadline.localeCompare(b.deadline);
    });
    
    setUrgentTasks(urgent);
    
    // 新しいタスクに対して通知を表示
    urgent.forEach(task => {
      // まだ通知を表示していないタスクがあれば通知を表示
      if (!notificationShown[task.id] && (task.deadline <= todayStr)) {
        showNotification(task);
        // 通知を表示したタスクを記録
        setNotificationShown(prev => ({...prev, [task.id]: true}));
      }
    });
  }, [tasks, notificationShown]);

  // ブラウザ通知を表示する関数
  const showNotification = (task: any) => {
    // ブラウザがNotification APIをサポートしているか確認
    if (!("Notification" in window)) {
      console.log("このブラウザは通知をサポートしていません");
      return;
    }
    
    // 通知の許可を確認
    if (Notification.permission === "granted") {
      // 通知を送信
      const notification = new Notification("締め切り間近のタスクがあります", {
        body: `「${task.text}」の期限は${task.deadline}です`,
        icon: "/favicon.ico" // プロジェクトのファビコンを使用
      });
      
      // 通知をクリックしたときの動作
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      // 効果音再生 (サウンドファイルがある場合)
      try {
        const audio = new Audio("/sounds/notification.mp3");
        audio.play().catch(err => console.log("通知音の再生に失敗:", err));
      } catch (error) {
        console.log("通知音の再生に失敗:", error);
      }
      
    } else if (Notification.permission !== "denied") {
      // 通知の許可を要求
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          showNotification(task);
        }
      });
    }
  };

  // 緊急度によって色分け
  const getUrgencyColor = (deadline: string) => {
    const today = new Date().toISOString().split("T")[0];
    if (deadline < today) {
      return "bg-red-100 border-red-500"; // 期限切れ
    } else if (deadline === today) {
      return "bg-orange-100 border-orange-500"; // 今日が期限
    } else {
      return "bg-yellow-100 border-yellow-500"; // 近日中
    }
  };

  // 期限日の表示を整形
  const formatDeadline = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    
    if (dateStr === today) {
      return "今日";
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    
    if (dateStr === yesterdayStr) {
      return "昨日";
    }
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    
    if (dateStr === tomorrowStr) {
      return "明日";
    }
    
    // その他の日付はYYYY-MM-DDを日本語形式に変換
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 表示する警告がない場合は何も表示しない
  if (urgentTasks.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-5 left-0 right-0 mx-auto z-50 w-full max-w-md"
      >
        <div className="mx-4 rounded-lg shadow-lg overflow-hidden border-l-4 border-red-500">
          <div 
            className="bg-white p-4 cursor-pointer flex justify-between items-center"
            onClick={() => setCollapsed(!collapsed)}
          >
            <div className="flex items-center">
              <span className="text-red-500 text-2xl mr-2">⚠️</span>
              <h3 className="font-bold">期限が近いタスクがあります ({urgentTasks.length}件)</h3>
            </div>
            <button className="text-gray-500">
              {collapsed ? '▼' : '▲'}
            </button>
          </div>
          
          {!collapsed && (
            <div className="bg-white px-4 pb-4">
              <div className="max-h-60 overflow-y-auto">
                <ul className="space-y-2">
                  {urgentTasks.map((task) => (
                    <li 
                      key={task.id} 
                      className={`p-3 rounded border-l-4 ${getUrgencyColor(task.deadline)}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium break-words flex-1">{task.text}</span>
                        <span className="text-sm bg-gray-200 px-2 py-1 rounded ml-2 whitespace-nowrap">
                          期限: {formatDeadline(task.deadline)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}