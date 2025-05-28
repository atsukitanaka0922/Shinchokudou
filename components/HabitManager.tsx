/**
 * 習慣管理メインコンポーネント
 * 
 * 習慣の追加、編集、完了チェック、統計表示を管理
 * v1.6.1: 習慣タスク機能の実装
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHabitStore } from '@/store/habitStore';
import { useAuthStore } from '@/store/auth';
import { suggestHabits } from '@/lib/aiHabitSuggestion';
import { HabitFrequency, Habit, CreateHabitData } from '@/lib/habitInterfaces';
import HabitWarning from './HabitWarning';

/**
 * 習慣管理メインコンポーネント
 */
export default function HabitManager() {
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
  const [selectedTab, setSelectedTab] = useState<'today' | 'all' | 'stats'>('today');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

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

  // AI提案の取得
  const loadAISuggestions = async () => {
    if (!user) return;
    
    setLoadingSuggestions(true);
    try {
      const suggestions = await suggestHabits(user.uid);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('AI習慣提案の取得に失敗:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // 今日の習慣と統計
  const todayHabits = useMemo(() => getTodayHabits(), [habits]);
  const overdueHabits = useMemo(() => getOverdueHabits(), [habits]);
  const stats = useMemo(() => getHabitStats(), [habits]);

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
   * AI提案から習慣を追加
   */
  const handleAddSuggestedHabit = async (suggestion: any) => {
    const habitData: CreateHabitData = {
      title: suggestion.title,
      description: suggestion.description,
      frequency: suggestion.frequency,
      targetDays: suggestion.targetDays || [],
      reminderTime: suggestion.reminderTime || '20:00',
      isActive: true
    };
    
    try {
      await addHabit(habitData);
      // 追加した提案を除去
      setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    } catch (error) {
      console.error('AI提案習慣追加エラー:', error);
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
   * 習慣の完了状況アイコンを取得
   */
  const getCompletionIcon = (habit: Habit) => {
    const today = new Date().toISOString().split('T')[0];
    const isCompleted = habit.completionHistory.some(
      completion => completion.date === today && completion.completed
    );
    
    return isCompleted ? '✅' : '⭕';
  };

  /**
   * 習慣のストリーク計算
   */
  const calculateStreak = (habit: Habit) => {
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
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              ➕ 新しい習慣
            </button>
            <button
              onClick={loadAISuggestions}
              disabled={loadingSuggestions}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm disabled:bg-gray-400"
            >
              {loadingSuggestions ? '🤖 分析中...' : '🤖 AI提案'}
            </button>
          </div>
        </div>
        
        {/* 統計サマリー */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-sm text-blue-600">今日の習慣</div>
            <div className="text-lg font-bold text-blue-800">{todayHabits.length}個</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-sm text-green-600">完了率</div>
            <div className="text-lg font-bold text-green-800">
              {todayHabits.length > 0 
                ? Math.round((stats.completedToday / todayHabits.length) * 100)
                : 0}%
            </div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <div className="text-sm text-red-600">未完了</div>
            <div className="text-lg font-bold text-red-800">{overdueHabits.length}個</div>
          </div>
        </div>
        
        {/* タブナビゲーション */}
        <div className="flex space-x-1">
          {(['today', 'all', 'stats'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tab === 'today' ? '📅 今日' : 
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                          className={`px-3 py-2 rounded-md text-sm ${
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
                          className={`px-2 py-1 rounded text-xs ${
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
                    onClick={() => {
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
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    {editingHabit ? '更新' : '追加'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI提案セクション */}
        <AnimatePresence>
          {aiSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 border border-purple-200 rounded-lg bg-purple-50"
            >
              <h3 className="text-lg font-medium mb-4 text-purple-800">
                🤖 AI習慣提案
              </h3>
              <div className="space-y-3">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="bg-white p-3 rounded-md border border-purple-100">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>📅 {getFrequencyText(suggestion.frequency)}</span>
                          <span>⏰ {suggestion.reminderTime}</span>
                          <span>💡 {suggestion.reason}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddSuggestedHabit(suggestion)}
                        className="ml-3 px-3 py-1 bg-purple-500 text-white rounded-md hover:bg-purple-600 text-sm"
                      >
                        追加
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                  <p>今日実行する習慣がありません</p>
                  <p className="text-sm">新しい習慣を追加してみましょう！</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayHabits.map((habit) => (
                    <HabitCard
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
                  <p>まだ習慣が登録されていません</p>
                  <p className="text-sm">新しい習慣を追加してみましょう！</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {habits.map((habit) => (
                    <HabitCard
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
 * 習慣カードコンポーネント
 */
interface HabitCardProps {
  habit: Habit;
  onToggle: (habitId: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  showActions: boolean;
}

function HabitCard({ habit, onToggle, onEdit, onDelete, showActions }: HabitCardProps) {
  const today = new Date().toISOString().split('T')[0];
  const isCompleted = habit.completionHistory.some(
    completion => completion.date === today && completion.completed
  );
  
  const streak = calculateStreakForHabit(habit);
  
  return (
    <motion.div
      className={`p-4 border rounded-lg transition-colors ${
        isCompleted 
          ? 'bg-green-50 border-green-200' 
          : habit.isActive 
            ? 'bg-white border-gray-200 hover:border-blue-300' 
            : 'bg-gray-50 border-gray-200'
      }`}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* 完了チェックボタン */}
          <button
            onClick={() => onToggle(habit.id)}
            disabled={!habit.isActive}
            className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm transition-colors ${
              isCompleted
                ? 'bg-green-500 border-green-500 text-white'
                : habit.isActive
                  ? 'border-gray-300 hover:border-green-400'
                  : 'border-gray-200 cursor-not-allowed'
            }`}
          >
            {isCompleted && '✓'}
          </button>
          
          {/* 習慣情報 */}
          <div className="flex-1">
            <h4 className={`font-medium ${isCompleted ? 'line-through text-gray-500' : ''}`}>
              {habit.title}
            </h4>
            {habit.description && (
              <p className="text-sm text-gray-600 mt-1">{habit.description}</p>
            )}
            
            {/* メタ情報 */}
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span>📅 {getFrequencyText(habit.frequency)}</span>
              {habit.reminderTime && (
                <span>⏰ {habit.reminderTime}</span>
              )}
              {streak > 0 && (
                <span className="text-orange-600">
                  🔥 {streak}日連続
                </span>
              )}
            </div>
            
            {/* 無効化された習慣の表示 */}
            {!habit.isActive && (
              <div className="mt-2">
                <span className="inline-block px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                  無効
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* アクションボタン */}
        {showActions && (
          <div className="flex space-x-1 ml-3">
            <button
              onClick={() => onEdit(habit)}
              className="p-1 text-gray-400 hover:text-blue-500"
              title="編集"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(habit.id)}
              className="p-1 text-gray-400 hover:text-red-500"
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
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-800">{stats.totalHabits}</div>
          <div className="text-sm text-blue-600">総習慣数</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-800">{stats.activeHabits}</div>
          <div className="text-sm text-green-600">アクティブ</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-800">{stats.completedToday}</div>
          <div className="text-sm text-orange-600">今日完了</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-800">
            {stats.averageCompletionRate}%
          </div>
          <div className="text-sm text-purple-600">平均完了率</div>
        </div>
      </div>
      
      {/* 個別習慣の統計 */}
      <div>
        <h4 className="text-md font-medium mb-3">📈 個別習慣の統計</h4>
        <div className="space-y-3">
          {habits.map((habit) => {
            const completionRate = calculateCompletionRate(habit);
            const streak = calculateStreakForHabit(habit);
            
            return (
              <div key={habit.id} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="font-medium">{habit.title}</h5>
                  <span className="text-sm text-gray-500">
                    {getFrequencyText(habit.frequency)}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">完了率</div>
                    <div className="font-medium">{completionRate}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">現在のストリーク</div>
                    <div className="font-medium">{streak}日</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">総実行回数</div>
                    <div className="font-medium">
                      {habit.completionHistory.filter(h => h.completed).length}回
                    </div>
                  </div>
                </div>
                
                {/* 完了率バー */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
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