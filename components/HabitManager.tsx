/**
 * 習慣管理メインコンポーネント（UI改善版）
 * 
 * チェックボタン、ソート機能、改善されたUIを追加
 * より直感的で使いやすい習慣管理インターフェースを提供
 * v1.6.0: 習慣タスク機能の実装 + UI大幅改善
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHabitStore } from '@/store/habitStore';
import { useAuthStore } from '@/store/auth';
import { HabitFrequency, Habit, CreateHabitData } from '@/lib/habitInterfaces';
import HabitWarning from './HabitWarning';
import AIHabitSuggestions from './AIHabitSuggestions';

/**
 * ソート方式の定義
 */
type SortType = 'name' | 'created' | 'streak' | 'completion' | 'priority' | 'reminder';
type SortOrder = 'asc' | 'desc';

/**
 * 習慣管理メインコンポーネント（改善版）
 */
export default function ImprovedHabitManager() {
  const { user } = useAuthStore();
  const {
    habits,
    loading,
    loadHabits,
    addHabit,
    toggleHabitCompletion,
    removeHabit,
    updateHabit,
    getHabitStats,
    getTodayHabits,
    getOverdueHabits
  } = useHabitStore();

  // ローカル状態
  const [selectedTab, setSelectedTab] = useState<'today' | 'all' | 'stats' | 'ai'>('today');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [sortType, setSortType] = useState<SortType>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterCompleted, setFilterCompleted] = useState<'all' | 'completed' | 'incomplete'>('all');

  // 新しい習慣フォームの状態
  const [newHabit, setNewHabit] = useState<CreateHabitData>({
    title: '',
    description: '',
    frequency: 'daily',
    targetDays: [],
    reminderTime: '20:00',
    isActive: true
  });

  // データ読み込み
  useEffect(() => {
    if (user) {
      loadHabits();
    }
  }, [user, loadHabits]);

  // 今日の習慣と統計
  const todayHabits = useMemo(() => getTodayHabits(), [habits]);
  const overdueHabits = useMemo(() => getOverdueHabits(), [habits]);
  const stats = useMemo(() => getHabitStats(), [habits]);

  /**
   * ソート済み・フィルタ済み習慣リストを取得
   */
  const getSortedFilteredHabits = (habitList: Habit[]) => {
    let filtered = [...habitList];
    
    // 完了状態でフィルタ
    if (filterCompleted !== 'all') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(habit => {
        const isCompleted = habit.completionHistory.some(
          completion => completion.date === today && completion.completed
        );
        return filterCompleted === 'completed' ? isCompleted : !isCompleted;
      });
    }
    
    // ソート
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortType) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created':
          comparison = (a.createdAt || 0) - (b.createdAt || 0);
          break;
        case 'streak':
          const streakA = calculateStreakForHabit(a);
          const streakB = calculateStreakForHabit(b);
          comparison = streakA - streakB;
          break;
        case 'completion':
          const rateA = calculateCompletionRate(a);
          const rateB = calculateCompletionRate(b);
          comparison = rateA - rateB;
          break;
        case 'priority':
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          const prioA = getPriorityFromTitle(a.title);
          const prioB = getPriorityFromTitle(b.title);
          comparison = priorityOrder[prioA] - priorityOrder[prioB];
          break;
        case 'reminder':
          const timeA = a.reminderTime || '00:00';
          const timeB = b.reminderTime || '00:00';
          comparison = timeA.localeCompare(timeB);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  };

  /**
   * ソート方式を変更
   */
  const handleSort = (type: SortType) => {
    if (sortType === type) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortType(type);
      setSortOrder('asc');
    }
  };

  /**
   * 新しい習慣を追加
   */
  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newHabit.title.trim()) return;
    
    try {
      await addHabit(newHabit);
      
      // フォームをリセット
      setNewHabit({
        title: '',
        description: '',
        frequency: 'daily',
        targetDays: [],
        reminderTime: '20:00',
        isActive: true
      });
      
      setShowAddForm(false);
    } catch (error) {
      console.error('習慣追加エラー:', error);
    }
  };

  /**
   * 習慣の編集を開始
   */
  const startEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setNewHabit({
      title: habit.title,
      description: habit.description || '',
      frequency: habit.frequency,
      targetDays: habit.targetDays || [],
      reminderTime: habit.reminderTime || '20:00',
      isActive: habit.isActive
    });
    setShowAddForm(true);
  };

  /**
   * 習慣の編集を保存
   */
  const handleUpdateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingHabit || !newHabit.title.trim()) return;
    
    try {
      await updateHabit(editingHabit.id, {
        title: newHabit.title,
        description: newHabit.description,
        frequency: newHabit.frequency,
        targetDays: newHabit.targetDays,
        reminderTime: newHabit.reminderTime,
        isActive: newHabit.isActive
      });
      
      // フォームをリセット
      setEditingHabit(null);
      setNewHabit({
        title: '',
        description: '',
        frequency: 'daily',
        targetDays: [],
        reminderTime: '20:00',
        isActive: true
      });
      
      setShowAddForm(false);
    } catch (error) {
      console.error('習慣更新エラー:', error);
    }
  };

  /**
   * フォームをキャンセル
   */
  const cancelForm = () => {
    setShowAddForm(false);
    setEditingHabit(null);
    setNewHabit({
      title: '',
      description: '',
      frequency: 'daily',
      targetDays: [],
      reminderTime: '20:00',
      isActive: true
    });
  };

  /**
   * 頻度に応じた表示テキストを取得
   */
  const getFrequencyText = (frequency: HabitFrequency) => {
    switch (frequency) {
      case 'daily': return '毎日';
      case 'weekly': return '毎週';
      case 'monthly': return '毎月';
      default: return frequency;
    }
  };

  /**
   * 曜日名を取得
   */
  const getDayName = (dayIndex: number) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[dayIndex];
  };

  /**
   * ソートアイコンを取得
   */
  const getSortIcon = (type: SortType) => {
    if (sortType !== type) return '↕️';
    return sortOrder === 'asc' ? '⬆️' : '⬇️';
  };

  // ログインしていない場合
  if (!user) {
    return (
      <div className="p-6 bg-gray-100 rounded-lg shadow-md text-center">
        <h2 className="text-xl font-bold mb-4">🔄 習慣管理</h2>
        <p className="text-gray-600">ログインすると習慣管理機能を利用できます</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* 習慣警告コンポーネント */}
      <HabitWarning />
      
      {/* ヘッダー */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">🔄 習慣管理</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm transition-colors"
            >
              ➕ 新しい習慣
            </button>
          </div>
        </div>
        
        {/* 統計サマリー */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-sm text-blue-600">今日</div>
            <div className="text-lg font-bold text-blue-800">{todayHabits.length}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-sm text-green-600">完了率</div>
            <div className="text-lg font-bold text-green-800">
              {todayHabits.length > 0 
                ? Math.round((stats.completedToday / todayHabits.length) * 100)
                : 0}%
            </div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <div className="text-sm text-orange-600">ストリーク</div>
            <div className="text-lg font-bold text-orange-800">{stats.longestStreak}日</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-sm text-purple-600">総習慣</div>
            <div className="text-lg font-bold text-purple-800">{habits.length}</div>
          </div>
        </div>
        
        {/* タブナビゲーション */}
        <div className="flex space-x-1">
          {(['today', 'ai', 'all', 'stats'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tab === 'today' ? '📅 今日' : 
               tab === 'ai' ? '🤖 AI提案' :
               tab === 'all' ? '📋 すべて' : 
               '📊 統計'}
            </button>
          ))}
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="p-4">
        {/* 習慣追加/編集フォーム */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50"
            >
              <h3 className="text-lg font-medium mb-4">
                {editingHabit ? '習慣を編集' : '新しい習慣を追加'}
              </h3>
              
              <form onSubmit={editingHabit ? handleUpdateHabit : handleAddHabit} className="space-y-4">
                {/* タイトル */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    習慣名 *
                  </label>
                  <input
                    type="text"
                    value={newHabit.title}
                    onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
                    placeholder="例: 毎日30分読書する"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                {/* 説明 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    説明（任意）
                  </label>
                  <textarea
                    value={newHabit.description}
                    onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                    placeholder="習慣の詳細や目標を記入..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* 頻度とリマインダー時間 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      頻度
                    </label>
                    <select
                      value={newHabit.frequency}
                      onChange={(e) => setNewHabit({ ...newHabit, frequency: e.target.value as HabitFrequency })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="daily">毎日</option>
                      <option value="weekly">毎週</option>
                      <option value="monthly">毎月</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      リマインダー時間
                    </label>
                    <input
                      type="time"
                      value={newHabit.reminderTime}
                      onChange={(e) => setNewHabit({ ...newHabit, reminderTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                {/* 週単位の場合の曜日選択 */}
                {newHabit.frequency === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      実行する曜日
                    </label>
                    <div className="flex space-x-2">
                      {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
                        <button
                          key={dayIndex}
                          type="button"
                          onClick={() => {
                            const targetDays = newHabit.targetDays || [];
                            const newTargetDays = targetDays.includes(dayIndex)
                              ? targetDays.filter(d => d !== dayIndex)
                              : [...targetDays, dayIndex];
                            setNewHabit({ ...newHabit, targetDays: newTargetDays });
                          }}
                          className={`px-3 py-2 rounded-md text-sm transition-colors ${
                            (newHabit.targetDays || []).includes(dayIndex)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {getDayName(dayIndex)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 月単位の場合の日付選択 */}
                {newHabit.frequency === 'monthly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      実行する日付
                    </label>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const targetDays = newHabit.targetDays || [];
                            const newTargetDays = targetDays.includes(day)
                              ? targetDays.filter(d => d !== day)
                              : [...targetDays, day];
                            setNewHabit({ ...newHabit, targetDays: newTargetDays });
                          }}
                          className={`px-2 py-1 rounded text-xs transition-colors ${
                            (newHabit.targetDays || []).includes(day)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* アクションボタン */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    {editingHabit ? '更新' : '追加'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ソート・フィルタ コントロール */}
        {(selectedTab === 'today' || selectedTab === 'all') && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap items-center gap-4">
              {/* ソートボタン */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">ソート:</span>
                <button
                  onClick={() => handleSort('name')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    sortType === 'name' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  名前 {getSortIcon('name')}
                </button>
                <button
                  onClick={() => handleSort('streak')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    sortType === 'streak' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  ストリーク {getSortIcon('streak')}
                </button>
                <button
                  onClick={() => handleSort('reminder')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    sortType === 'reminder' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  時間 {getSortIcon('reminder')}
                </button>
                <button
                  onClick={() => handleSort('completion')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    sortType === 'completion' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  完了率 {getSortIcon('completion')}
                </button>
              </div>
              
              {/* フィルタ */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">表示:</span>
                <select
                  value={filterCompleted}
                  onChange={(e) => setFilterCompleted(e.target.value as any)}
                  className="px-3 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">すべて</option>
                  <option value="completed">完了済み</option>
                  <option value="incomplete">未完了</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 習慣リスト */}
        <AnimatePresence mode="wait">
          {selectedTab === 'today' && (
            <motion.div
              key="today"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h3 className="text-lg font-medium mb-4">📅 今日の習慣</h3>
              {todayHabits.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-3">🌱</div>
                  <p>今日実行する習慣がありません</p>
                  <p className="text-sm">新しい習慣を追加してみましょう！</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getSortedFilteredHabits(todayHabits).map((habit) => (
                    <ImprovedHabitCard
                      key={habit.id}
                      habit={habit}
                      onToggle={toggleHabitCompletion}
                      onEdit={startEditHabit}
                      onDelete={removeHabit}
                      showActions={true}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {selectedTab === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AIHabitSuggestions />
            </motion.div>
          )}

          {selectedTab === 'all' && (
            <motion.div
              key="all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h3 className="text-lg font-medium mb-4">📋 すべての習慣</h3>
              {habits.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-3">📝</div>
                  <p>まだ習慣が登録されていません</p>
                  <p className="text-sm">新しい習慣を追加してみましょう！</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getSortedFilteredHabits(habits).map((habit) => (
                    <ImprovedHabitCard
                      key={habit.id}
                      habit={habit}
                      onToggle={toggleHabitCompletion}
                      onEdit={startEditHabit}
                      onDelete={removeHabit}
                      showActions={true}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {selectedTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h3 className="text-lg font-medium mb-4">📊 習慣統計</h3>
              <HabitStats stats={stats} habits={habits} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * 改善された習慣カードコンポーネント
 */
interface ImprovedHabitCardProps {
  habit: Habit;
  onToggle: (habitId: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  showActions: boolean;
}

function ImprovedHabitCard({ habit, onToggle, onEdit, onDelete, showActions }: ImprovedHabitCardProps) {
  const today = new Date().toISOString().split('T')[0];
  const isCompleted = habit.completionHistory.some(
    completion => completion.date === today && completion.completed
  );
  
  const streak = calculateStreakForHabit(habit);
  const completionRate = calculateCompletionRate(habit);
  
  return (
    <motion.div
      className={`p-4 border-2 rounded-xl transition-all duration-300 ${
        isCompleted 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-md' 
          : habit.isActive 
            ? 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg' 
            : 'bg-gray-50 border-gray-200 opacity-75'
      }`}
      whileHover={{ scale: 1.02 }}
      layout
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          {/* 🔥 改善: 明確な枠付きチェックボタン */}
          <button
            onClick={() => onToggle(habit.id)}
            disabled={!habit.isActive}
            className={`mt-1 w-10 h-10 rounded-full border-3 flex items-center justify-center text-xl font-bold transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-3 focus:ring-offset-2 ${
              isCompleted
                ? 'bg-green-500 border-green-600 text-white shadow-lg focus:ring-green-300'
                : habit.isActive
                  ? 'bg-white border-gray-400 text-gray-400 hover:border-green-500 hover:bg-green-50 hover:text-green-600 shadow-sm focus:ring-blue-300'
                  : 'bg-gray-100 border-gray-300 text-gray-300 cursor-not-allowed'
            }`}
            style={{
              boxShadow: isCompleted 
                ? '0 4px 12px rgba(34, 197, 94, 0.3)' 
                : habit.isActive 
                  ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
                  : 'none'
            }}
          >
            {isCompleted ? '✓' : '○'}
          </button>
          
          {/* 習慣情報 */}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className={`font-semibold text-lg ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {habit.title}
              </h4>
              
              {/* ストリークバッジ */}
              {streak > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  🔥 {streak}日
                </span>
              )}
              
              {/* 完了率バッジ */}
              {completionRate > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  📊 {completionRate}%
                </span>
              )}
            </div>
            
            {habit.description && (
              <p className="text-sm text-gray-600 mb-2 leading-relaxed">{habit.description}</p>
            )}
            
            {/* メタ情報 */}
            <div className="flex items-center flex-wrap gap-3 text-xs text-gray-500">
              <span className="flex items-center">
                <span className="mr-1">📅</span>
                {getFrequencyText(habit.frequency)}
              </span>
              {habit.reminderTime && (
                <span className="flex items-center">
                  <span className="mr-1">⏰</span>
                  {habit.reminderTime}
                </span>
              )}
              <span className="flex items-center">
                <span className="mr-1">📈</span>
                実行回数: {habit.completionHistory.filter(h => h.completed).length}回
              </span>
            </div>
            
            {/* 進捗バー */}
            {completionRate > 0 && (
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700">完了率</span>
                  <span className="text-xs font-medium text-gray-700">{completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
            
            {/* 無効化された習慣の表示 */}
            {!habit.isActive && (
              <div className="mt-2">
                <span className="inline-block px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                  ⏸️ 無効
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* アクションボタン */}
        {showActions && (
          <div className="flex flex-col space-y-1 ml-3">
            <button
              onClick={() => onEdit(habit)}
              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all duration-200"
              title="編集"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(habit.id)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
              title="削除"
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * 習慣統計コンポーネント
 */
interface HabitStatsProps {
  stats: any;
  habits: Habit[];
}

function HabitStats({ stats, habits }: HabitStatsProps) {
  return (
    <div className="space-y-6">
      {/* 全体統計 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div 
          className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center border border-blue-200"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="text-3xl font-bold text-blue-800">{stats.totalHabits}</div>
          <div className="text-sm text-blue-600">総習慣数</div>
        </motion.div>
        <motion.div 
          className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg text-center border border-green-200"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="text-3xl font-bold text-green-800">{stats.activeHabits}</div>
          <div className="text-sm text-green-600">アクティブ</div>
        </motion.div>
        <motion.div 
          className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg text-center border border-orange-200"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="text-3xl font-bold text-orange-800">{stats.completedToday}</div>
          <div className="text-sm text-orange-600">今日完了</div>
        </motion.div>
        <motion.div 
          className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg text-center border border-purple-200"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="text-3xl font-bold text-purple-800">
            {stats.averageCompletionRate}%
          </div>
          <div className="text-sm text-purple-600">平均完了率</div>
        </motion.div>
      </div>
      
      {/* 個別習慣の統計 */}
      <div>
        <h4 className="text-md font-medium mb-4 flex items-center">
          <span className="mr-2">📈</span>
          個別習慣の詳細統計
        </h4>
        <div className="space-y-4">
          {habits.map((habit, index) => {
            const completionRate = calculateCompletionRate(habit);
            const streak = calculateStreakForHabit(habit);
            
            return (
              <motion.div 
                key={habit.id} 
                className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-semibold text-gray-900">{habit.title}</h5>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {getFrequencyText(habit.frequency)}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">完了率</div>
                    <div className="text-lg font-bold text-blue-600">{completionRate}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">ストリーク</div>
                    <div className="text-lg font-bold text-orange-600">{streak}日</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">総実行</div>
                    <div className="text-lg font-bold text-green-600">
                      {habit.completionHistory.filter(h => h.completed).length}回
                    </div>
                  </div>
                </div>
                
                {/* 改善された完了率バー */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-700">進捗状況</span>
                    <span className="text-xs text-gray-600">{completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div 
                      className="h-3 rounded-full bg-gradient-to-r from-blue-400 via-green-400 to-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${completionRate}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                    />
                  </div>
                </div>
                
                {/* 最近のアクティビティ */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>最近の実行</span>
                    <div className="flex space-x-1">
                      {Array.from({ length: 7 }, (_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() - (6 - i));
                        const dateStr = date.toISOString().split('T')[0];
                        const isCompleted = habit.completionHistory.some(
                          h => h.date === dateStr && h.completed
                        );
                        return (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-sm ${
                              isCompleted ? 'bg-green-400' : 'bg-gray-200'
                            }`}
                            title={`${date.getMonth() + 1}/${date.getDate()}: ${isCompleted ? '完了' : '未完了'}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* 習慣のヒント */}
      <motion.div 
        className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <h4 className="font-semibold text-indigo-800 mb-2 flex items-center">
          <span className="mr-2">💡</span>
          習慣継続のヒント
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-indigo-700">
          <div className="flex items-start">
            <span className="mr-2 mt-0.5">🎯</span>
            <span>小さく始めて徐々に大きくする</span>
          </div>
          <div className="flex items-start">
            <span className="mr-2 mt-0.5">🔗</span>
            <span>既存の習慣と組み合わせる</span>
          </div>
          <div className="flex items-start">
            <span className="mr-2 mt-0.5">📱</span>
            <span>リマインダーを活用する</span>
          </div>
          <div className="flex items-start">
            <span className="mr-2 mt-0.5">🏆</span>
            <span>達成感を大切にする</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * ヘルパー関数
 */

/**
 * 習慣の完了率を計算
 */
function calculateCompletionRate(habit: Habit): number {
  if (habit.completionHistory.length === 0) return 0;
  
  const completedCount = habit.completionHistory.filter(h => h.completed).length;
  return Math.round((completedCount / habit.completionHistory.length) * 100);
}

/**
 * 習慣のストリーク計算
 */
function calculateStreakForHabit(habit: Habit): number {
  const sortedHistory = habit.completionHistory
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  let streak = 0;
  let checkDate = new Date();
  
  for (const completion of sortedHistory) {
    const completionDate = new Date(completion.date);
    const diffDays = Math.floor((checkDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === streak && completion.completed) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * 頻度に応じた表示テキストを取得
 */
function getFrequencyText(frequency: HabitFrequency): string {
  switch (frequency) {
    case 'daily': return '毎日';
    case 'weekly': return '毎週';
    case 'monthly': return '毎月';
    default: return frequency;
  }
}

/**
 * タイトルから優先度を推定（簡易版）
 */
function getPriorityFromTitle(title: string): 'high' | 'medium' | 'low' {
  const highKeywords = ['重要', '緊急', '必須', '絶対'];
  const lowKeywords = ['気軽', '簡単', '軽く', 'ちょっと'];
  
  const titleLower = title.toLowerCase();
  
  if (highKeywords.some(keyword => titleLower.includes(keyword))) {
    return 'high';
  }
  if (lowKeywords.some(keyword => titleLower.includes(keyword))) {
    return 'low';
  }
  return 'medium';
}