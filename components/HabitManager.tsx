/**
 * 習慣管理メインコンポーネント（UI改善版）
 * 
 * チェックボタン、ソート機能、改善されたUIを追加
 * より直感的で使いやすい習慣管理インターフェースを提供
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHabitStore } from '@/store/habitStore';
import { useAuthStore } from '@/store/auth';
import { HabitFrequency, Habit, CreateHabitData, HabitUtils } from '@/lib/habitInterfaces';
import { playSound } from '@/lib/audioService';
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
  const [searchQuery, setSearchQuery] = useState('');

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
   * ソート済み・フィルタ済み・検索済み習慣リストを取得
   */
  const getSortedFilteredHabits = (habitList: Habit[]) => {
    let filtered = [...habitList];
    
    // 検索クエリでフィルタ
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(habit => 
        habit.title.toLowerCase().includes(query) ||
        (habit.description && habit.description.toLowerCase().includes(query))
      );
    }
    
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

  /**
   * ソートタイプのラベルを取得
   */
  const getSortTypeLabel = (type: SortType) => {
    const labels = {
      'name': '名前',
      'created': '作成日',
      'streak': 'ストリーク',
      'completion': '完了率',
      'priority': '優先度',
      'reminder': 'リマインダー時間'
    };
    return labels[type];
  };

  /**
   * フィルタのラベルを取得
   */
  const getFilterLabel = (filter: 'all' | 'completed' | 'incomplete') => {
    const labels = {
      'all': 'すべての習慣',
      'completed': '完了済みの習慣',
      'incomplete': '未完了の習慣'
    };
    return labels[filter];
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

        {/* 検索バー */}
        {(selectedTab === 'today' || selectedTab === 'all') && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 text-lg">🔍</span>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchQuery('');
                  }
                }}
                placeholder="習慣を検索... (ESCでクリア)"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="text-lg">✕</span>
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* 改善されたソート・フィルタ コントロール */}
        {(selectedTab === 'today' || selectedTab === 'all') && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-gray-200 shadow-sm"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* ソートセクション */}
              <div className="flex flex-col space-y-2">
                <span className="text-sm font-semibold text-gray-700 flex items-center">
                  <span className="text-base mr-2">📊</span>
                  ソート:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSort('name')}
                    className={`px-3 py-2 text-xs rounded-lg transition-all duration-200 flex items-center space-x-1 ${
                      sortType === 'name' 
                        ? 'bg-blue-500 text-white shadow-md transform scale-105' 
                        : 'bg-white text-gray-700 hover:bg-blue-100 border border-gray-300'
                    }`}
                  >
                    <span>📝</span>
                    <span>名前</span>
                    <span>{getSortIcon('name')}</span>
                  </button>
                  <button
                    onClick={() => handleSort('streak')}
                    className={`px-3 py-2 text-xs rounded-lg transition-all duration-200 flex items-center space-x-1 ${
                      sortType === 'streak' 
                        ? 'bg-orange-500 text-white shadow-md transform scale-105' 
                        : 'bg-white text-gray-700 hover:bg-orange-100 border border-gray-300'
                    }`}
                  >
                    <span>🔥</span>
                    <span>ストリーク</span>
                    <span>{getSortIcon('streak')}</span>
                  </button>
                  <button
                    onClick={() => handleSort('reminder')}
                    className={`px-3 py-2 text-xs rounded-lg transition-all duration-200 flex items-center space-x-1 ${
                      sortType === 'reminder' 
                        ? 'bg-green-500 text-white shadow-md transform scale-105' 
                        : 'bg-white text-gray-700 hover:bg-green-100 border border-gray-300'
                    }`}
                  >
                    <span>⏰</span>
                    <span>時間</span>
                    <span>{getSortIcon('reminder')}</span>
                  </button>
                  <button
                    onClick={() => handleSort('completion')}
                    className={`px-3 py-2 text-xs rounded-lg transition-all duration-200 flex items-center space-x-1 ${
                      sortType === 'completion' 
                        ? 'bg-purple-500 text-white shadow-md transform scale-105' 
                        : 'bg-white text-gray-700 hover:bg-purple-100 border border-gray-300'
                    }`}
                  >
                    <span>📈</span>
                    <span>完了率</span>
                    <span>{getSortIcon('completion')}</span>
                  </button>
                  <button
                    onClick={() => handleSort('created')}
                    className={`px-3 py-2 text-xs rounded-lg transition-all duration-200 flex items-center space-x-1 ${
                      sortType === 'created' 
                        ? 'bg-indigo-500 text-white shadow-md transform scale-105' 
                        : 'bg-white text-gray-700 hover:bg-indigo-100 border border-gray-300'
                    }`}
                  >
                    <span>📅</span>
                    <span>作成日</span>
                    <span>{getSortIcon('created')}</span>
                  </button>
                  <button
                    onClick={() => handleSort('priority')}
                    className={`px-3 py-2 text-xs rounded-lg transition-all duration-200 flex items-center space-x-1 ${
                      sortType === 'priority' 
                        ? 'bg-red-500 text-white shadow-md transform scale-105' 
                        : 'bg-white text-gray-700 hover:bg-red-100 border border-gray-300'
                    }`}
                  >
                    <span>⭐</span>
                    <span>優先度</span>
                    <span>{getSortIcon('priority')}</span>
                  </button>
                </div>
              </div>
              
              {/* 区切り線 */}
              <div className="hidden md:block w-px h-12 bg-gray-300"></div>
              
              {/* フィルタセクション */}
              <div className="flex flex-col space-y-2">
                <span className="text-sm font-semibold text-gray-700 flex items-center">
                  <span className="text-base mr-2">🔍</span>
                  表示フィルタ:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterCompleted('all')}
                    className={`px-3 py-2 text-xs rounded-lg transition-all duration-200 flex items-center space-x-1 ${
                      filterCompleted === 'all'
                        ? 'bg-gray-600 text-white shadow-md transform scale-105'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    <span>📋</span>
                    <span>すべて</span>
                  </button>
                  <button
                    onClick={() => setFilterCompleted('completed')}
                    className={`px-3 py-2 text-xs rounded-lg transition-all duration-200 flex items-center space-x-1 ${
                      filterCompleted === 'completed'
                        ? 'bg-green-600 text-white shadow-md transform scale-105'
                        : 'bg-white text-gray-700 hover:bg-green-100 border border-gray-300'
                    }`}
                  >
                    <span>✅</span>
                    <span>完了済み</span>
                  </button>
                  <button
                    onClick={() => setFilterCompleted('incomplete')}
                    className={`px-3 py-2 text-xs rounded-lg transition-all duration-200 flex items-center space-x-1 ${
                      filterCompleted === 'incomplete'
                        ? 'bg-yellow-600 text-white shadow-md transform scale-105'
                        : 'bg-white text-gray-700 hover:bg-yellow-100 border border-gray-300'
                    }`}
                  >
                    <span>⏳</span>
                    <span>未完了</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* 現在のソート状態の表示 */}
            <div className="mt-3 pt-3 border-t border-gray-300">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-gray-600">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <span>
                    現在のソート: <strong>{getSortTypeLabel(sortType)}</strong> 
                    ({sortOrder === 'asc' ? '昇順' : '降順'})
                  </span>
                  <span className="hidden md:inline">•</span>
                  <span>
                    表示: <strong>{getFilterLabel(filterCompleted)}</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {searchQuery && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      検索: "{searchQuery}"
                    </span>
                  )}
                  <span className="bg-gray-100 px-2 py-1 rounded-full">
                    {selectedTab === 'today' 
                      ? `${getSortedFilteredHabits(todayHabits).length}件表示`
                      : selectedTab === 'all'
                      ? `${getSortedFilteredHabits(habits).length}件表示`
                      : ''}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
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
              {(() => {
                const filteredTodayHabits = getSortedFilteredHabits(todayHabits);
                
                if (todayHabits.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-3">🌱</div>
                      <p>今日実行する習慣がありません</p>
                      <p className="text-sm">新しい習慣を追加してみましょう！</p>
                    </div>
                  );
                }
                
                if (filteredTodayHabits.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-3">🔍</div>
                      <p>検索条件に一致する習慣が見つかりません</p>
                      {searchQuery && (
                        <p className="text-sm">
                          「{searchQuery}」の検索結果: 0件
                        </p>
                      )}
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setFilterCompleted('all');
                        }}
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                      >
                        フィルタをリセット
                      </button>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-3">
                    {filteredTodayHabits.map((habit) => {
                      const isCompleted = HabitUtils.isCompletedToday(habit, new Date());
                      return (
                        <ImprovedHabitCard
                          key={`${habit.id}-${isCompleted}-${Date.now()}`}
                          habit={habit}
                          onToggle={toggleHabitCompletion}
                          onEdit={startEditHabit}
                          onDelete={removeHabit}
                          showActions={true}
                        />
                      );
                    })}
                  </div>
                );
              })()}
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
              {(() => {
                const filteredAllHabits = getSortedFilteredHabits(habits);
                
                if (habits.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-3">📝</div>
                      <p>まだ習慣が登録されていません</p>
                      <p className="text-sm">新しい習慣を追加してみましょう！</p>
                    </div>
                  );
                }
                
                if (filteredAllHabits.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-3">🔍</div>
                      <p>検索条件に一致する習慣が見つかりません</p>
                      {searchQuery && (
                        <p className="text-sm">
                          「{searchQuery}」の検索結果: 0件
                        </p>
                      )}
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setFilterCompleted('all');
                        }}
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                      >
                        フィルタをリセット
                      </button>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-3">
                    {filteredAllHabits.map((habit) => {
                      const isCompleted = HabitUtils.isCompletedToday(habit, new Date());
                      return (
                        <ImprovedHabitCard
                          key={`${habit.id}-${isCompleted}-${habit.completionHistory.length}`}
                          habit={habit}
                          onToggle={toggleHabitCompletion}
                          onEdit={startEditHabit}
                          onDelete={removeHabit}
                          showActions={true}
                        />
                      );
                    })}
                  </div>
                );
              })()}
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
  const completionRate = calculateCompletionRate(habit, 30); // 過去30日間の完了率
  const recentRate = calculateCompletionRate(habit, 7); // 過去7日間の完了率
  
  /**
   * 効果音付きの習慣トグル処理
   */
  const handleToggle = async () => {
    // まず習慣をトグル
    onToggle(habit.id);
    
    // 完了状態に変わる場合は効果音を再生
    if (!isCompleted) {
      try {
        await playSound('habit-complete');
      } catch (error) {
        console.warn('習慣完了効果音の再生に失敗:', error);
      }
    }
  };
  
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
            onClick={handleToggle}
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
                  <span className="text-xs font-medium text-gray-700">30日間完了率</span>
                  <span className="text-xs font-medium text-gray-700">{completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div 
                    className={`h-2 rounded-full ${
                      completionRate >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                      completionRate >= 70 ? 'bg-gradient-to-r from-blue-500 to-green-500' :
                      completionRate >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                      'bg-gradient-to-r from-red-500 to-red-600'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                {/* 最近7日間の表示 */}
                {recentRate !== completionRate && (
                  <>
                    <div className="flex justify-between items-center mb-1 mt-2">
                      <span className="text-xs font-medium text-gray-600">最近7日間</span>
                      <span className="text-xs font-medium text-gray-600">{recentRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <motion.div 
                        className={`h-1 rounded-full ${
                          recentRate >= 90 ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
                          recentRate >= 70 ? 'bg-gradient-to-r from-blue-400 to-green-400' :
                          recentRate >= 50 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                          'bg-gradient-to-r from-red-400 to-red-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${recentRate}%` }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                      />
                    </div>
                  </>
                )}
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
            const completionRate = calculateCompletionRate(habit, 30); // 過去30日間の完了率
            const streak = calculateStreakForHabit(habit);
            const recentCompletionRate = calculateCompletionRate(habit, 7); // 過去7日間の完了率
            
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
                
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">30日完了率</div>
                    <div className="text-lg font-bold text-blue-600">{completionRate}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">7日完了率</div>
                    <div className={`text-lg font-bold ${recentCompletionRate >= 80 ? 'text-green-600' : recentCompletionRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {recentCompletionRate}%
                    </div>
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
                    <span className="text-xs font-medium text-gray-700">30日間の進捗状況</span>
                    <span className="text-xs text-gray-600">{completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div 
                      className={`h-3 rounded-full ${
                        completionRate >= 90 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                        completionRate >= 70 ? 'bg-gradient-to-r from-blue-400 to-green-400' :
                        completionRate >= 50 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                        'bg-gradient-to-r from-red-400 to-red-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${completionRate}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                    />
                  </div>
                  {/* 7日間の完了率も表示 */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-700">最近7日間</span>
                    <span className="text-xs text-gray-600">{recentCompletionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <motion.div 
                      className={`h-2 rounded-full ${
                        recentCompletionRate >= 90 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                        recentCompletionRate >= 70 ? 'bg-gradient-to-r from-blue-400 to-green-400' :
                        recentCompletionRate >= 50 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                        'bg-gradient-to-r from-red-400 to-red-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${recentCompletionRate}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 + 0.2 }}
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
 * 習慣の完了率を計算（改善版）
 * 過去30日間の実行予定日に対する完了率を計算
 */
function calculateCompletionRate(habit: Habit, days: number = 30): number {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  let totalExpectedDays = 0;
  let completedDays = 0;
  
  // 過去30日間の各日をチェック
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    // その日が実行予定日かチェック
    if (HabitUtils.shouldExecuteToday(habit, d)) {
      totalExpectedDays++;
      
      // その日に完了しているかチェック
      const dateStr = d.toISOString().split('T')[0];
      const isCompleted = habit.completionHistory.some(
        completion => completion.date === dateStr && completion.completed
      );
      
      if (isCompleted) {
        completedDays++;
      }
    }
  }
  
  // 実行予定日がない場合は0%を返す
  if (totalExpectedDays === 0) return 0;
  
  return Math.round((completedDays / totalExpectedDays) * 100);
}

/**
 * 習慣のストリーク計算（改善版）
 * 実行予定日の連続完了数を計算
 */
function calculateStreakForHabit(habit: Habit): number {
  const today = new Date();
  let streak = 0;
  let checkDate = new Date(today);
  
  // 今日から過去に向かって連続完了日数をチェック
  while (true) {
    // その日が実行予定日かチェック
    if (HabitUtils.shouldExecuteToday(habit, checkDate)) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const isCompleted = habit.completionHistory.some(
        completion => completion.date === dateStr && completion.completed
      );
      
      if (isCompleted) {
        streak++;
      } else {
        // 未完了の実行予定日が見つかったらストリーク終了
        break;
      }
    }
    
    // 前日に移動
    checkDate.setDate(checkDate.getDate() - 1);
    
    // 過去90日までしか遡らない（無限ループ防止）
    const daysDiff = Math.floor((today.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
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