/**
 * 習慣警告コンポーネント
 * 
 * 20時頃に未完了の習慣がある場合に警告バナーを表示
 * DeadlineWarningと同様のスタイルで習慣の実行を促す
 * v1.6.1: 習慣タスク機能の実装
 */

import { useState, useEffect } from 'react';
import { useHabitStore } from '@/store/habitStore';
import { useAuthStore } from '@/store/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { HabitUtils } from '@/lib/habitInterfaces';

/**
 * 習慣警告コンポーネント
 */
export default function HabitWarning() {
  const { user } = useAuthStore();
  const { habits, getOverdueHabits, markHabitComplete } = useHabitStore();
  
  // 警告表示の状態
  const [showWarning, setShowWarning] = useState(false);
  const [overdueHabits, setOverdueHabits] = useState<string[]>([]);
  const [incompleteHabits, setIncompleteHabits] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 1分ごとに時刻を更新
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1分ごと

    return () => clearInterval(interval);
  }, []);

  // 習慣の警告チェック（リアルタイム）
  useEffect(() => {
    if (!user || dismissed) {
      setShowWarning(false);
      return;
    }
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // 20:00以降のみチェック
    if (currentHour < 20) {
      setShowWarning(false);
      setOverdueHabits([]);
      setIncompleteHabits([]);
      return;
    }
    
    if (habits.length === 0) {
      setShowWarning(false);
      setOverdueHabits([]);
      setIncompleteHabits([]);
      return;
    }
    
    const today = new Date();
    
    // 今日実行すべき習慣を取得
    const todayHabits = habits.filter(habit => 
      HabitUtils.shouldExecuteToday(habit, today)
    );
    
    // 期限切れの習慣（リマインダー時間を過ぎた未完了習慣）
    const overdueList: string[] = [];
    const incompleteList: string[] = [];
    
    todayHabits.forEach(habit => {
      const isCompleted = HabitUtils.isCompletedToday(habit, today);
      
      if (!isCompleted) {
        // リマインダー時間をチェック
        if (habit.reminderTime) {
          const [reminderHour, reminderMinute] = habit.reminderTime.split(':').map(Number);
          const reminderTotalMinutes = reminderHour * 60 + reminderMinute;
          const currentTotalMinutes = currentHour * 60 + currentMinute;
          
          if (currentTotalMinutes >= reminderTotalMinutes) {
            overdueList.push(habit.title);
          } else {
            incompleteList.push(habit.title);
          }
        } else {
          // リマインダー時間が設定されていない場合は20:00を基準
          incompleteList.push(habit.title);
        }
      }
    });
    
    // 状態を更新
    setOverdueHabits(overdueList);
    setIncompleteHabits(incompleteList);
    setShowWarning(overdueList.length > 0 || (currentHour >= 20 && incompleteList.length > 0));
    
  }, [user, habits, dismissed, currentTime]); // currentTimeのみ依存関係として残す

  /**
   * 習慣を即座に完了させる
   */
  const handleQuickComplete = async (habitTitle: string) => {
    const habit = habits.find(h => h.title === habitTitle);
    if (!habit) return;
    
    try {
      // 即座にローカル状態を更新（オプティミスティック更新）
      setOverdueHabits(prev => prev.filter(title => title !== habitTitle));
      setIncompleteHabits(prev => prev.filter(title => title !== habitTitle));
      
      // Firestoreを更新
      await markHabitComplete(habit.id);
      
      console.log(`習慣「${habitTitle}」を完了しました`);
    } catch (error) {
      console.error('習慣の即座完了に失敗:', error);
      
      // エラーの場合はローカル状態を元に戻す
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      if (HabitUtils.shouldExecuteToday(habit, today)) {
        const currentTime = new Date();
        const currentHour = currentTime.getHours();
        const currentMinute = currentTime.getMinutes();
        
        if (habit.reminderTime) {
          const [reminderHour, reminderMinute] = habit.reminderTime.split(':').map(Number);
          const reminderTotalMinutes = reminderHour * 60 + reminderMinute;
          const currentTotalMinutes = currentHour * 60 + currentMinute;
          
          if (currentTotalMinutes >= reminderTotalMinutes) {
            setOverdueHabits(prev => [...prev, habitTitle]);
          } else {
            setIncompleteHabits(prev => [...prev, habitTitle]);
          }
        } else {
          setIncompleteHabits(prev => [...prev, habitTitle]);
        }
      }
    }
  };

  /**
   * 現在時刻の表示用フォーマット
   */
  const formatCurrentTime = () => {
    return currentTime.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * 警告メッセージのレベルを決定
   */
  const getWarningLevel = () => {
    const currentHour = currentTime.getHours();
    
    if (overdueHabits.length > 0) {
      return 'danger'; // 期限切れ
    } else if (currentHour >= 21) {
      return 'warning'; // 21時以降
    } else {
      return 'info'; // 20時台
    }
  };

  /**
   * 警告レベルに応じたスタイルを取得
   */
  const getWarningStyle = () => {
    const level = getWarningLevel();
    
    switch (level) {
      case 'danger':
        return 'bg-red-100 border-red-300';
      case 'warning':
        return 'bg-orange-100 border-orange-300';
      case 'info':
      default:
        return 'bg-yellow-100 border-yellow-300';
    }
  };

  /**
   * 警告アイコンを取得
   */
  const getWarningIcon = () => {
    const level = getWarningLevel();
    
    switch (level) {
      case 'danger':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return '⏰';
    }
  };

  /**
   * 警告タイトルを取得
   */
  const getWarningTitle = () => {
    const level = getWarningLevel();
    const currentHour = currentTime.getHours();
    
    if (overdueHabits.length > 0) {
      return '習慣の期限切れ';
    } else if (currentHour >= 21) {
      return '習慣の確認 (21時を過ぎました)';
    } else {
      return '習慣のリマインダー';
    }
  };

  // ユーザーがログインしていない、または警告がない場合は表示しない
  if (!user || !showWarning || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed top-0 left-0 right-0 z-50 p-4 shadow-lg border-b-2 ${getWarningStyle()}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        exit={{ y: -100 }}
        transition={{ type: 'spring', stiffness: 120 }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* ヘッダー */}
              <div className="flex items-center mb-2">
                <span className="text-xl mr-2">{getWarningIcon()}</span>
                <h3 className="font-bold text-gray-800">
                  {getWarningTitle()}
                </h3>
                <span className="ml-3 text-sm text-gray-600 bg-white px-2 py-1 rounded">
                  現在時刻: {formatCurrentTime()}
                </span>
              </div>
              
              {/* 期限切れ習慣の表示 */}
              {overdueHabits.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-semibold text-red-700 mb-2">
                    ⏰ リマインダー時間を過ぎた習慣:
                  </p>
                  <div className="space-y-1">
                    {overdueHabits.map((habitTitle, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-2 rounded border border-red-200">
                        <span className="text-sm text-red-800 font-medium">
                          📋 {habitTitle.length > 40 ? `${habitTitle.substring(0, 40)}...` : habitTitle}
                        </span>
                        <button
                          onClick={() => handleQuickComplete(habitTitle)}
                          className="ml-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                        >
                          ✓ 完了
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 未完了習慣の表示 */}
              {incompleteHabits.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-semibold text-orange-700 mb-2">
                    📝 今日まだ未完了の習慣:
                  </p>
                  <div className="space-y-1">
                    {incompleteHabits.map((habitTitle, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-2 rounded border border-orange-200">
                        <span className="text-sm text-orange-800">
                          📋 {habitTitle.length > 40 ? `${habitTitle.substring(0, 40)}...` : habitTitle}
                        </span>
                        <button
                          onClick={() => handleQuickComplete(habitTitle)}
                          className="ml-2 px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors"
                        >
                          ✓ 完了
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 励ましメッセージ */}
              <div className="mt-3 p-2 bg-white bg-opacity-70 rounded text-sm">
                {overdueHabits.length > 0 ? (
                  <p className="text-gray-700">
                    💪 まだ間に合います！習慣の継続は小さな積み重ねから始まります。
                  </p>
                ) : (
                  <p className="text-gray-700">
                    🌟 今日の習慣を完了させて、素晴らしい一日を締めくくりましょう！
                  </p>
                )}
              </div>
            </div>
            
            {/* 閉じるボタン */}
            <button
              onClick={() => setDismissed(true)}
              className="ml-4 text-gray-600 hover:text-gray-800 p-1"
              aria-label="閉じる"
            >
              <span className="text-lg">✕</span>
            </button>
          </div>
          
          {/* 追加情報 */}
          <div className="mt-3 flex justify-between items-center text-xs text-gray-600">
            <span>
              💡 ヒント: 習慣管理タブから詳細を確認できます
            </span>
            <span>
              総習慣数: {overdueHabits.length + incompleteHabits.length}個
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}