/**
 * AI習慣提案コンポーネント
 * 
 * ユーザーの過去の習慣履歴、タスク履歴、現在の天気状況、時間帯などを考慮して
 * AIがパーソナライズされた習慣を提案するコンポーネント
 * v1.6.0: 習慣タスク機能の実装
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useHabitStore } from '@/store/habitStore';
import { suggestHabits } from '@/lib/aiHabitSuggestion';
import { useWeatherStore, fetchWeather } from '@/lib/weatherService';
import { motion, AnimatePresence } from 'framer-motion';
import { HabitSuggestion, CreateHabitData, HabitFrequency } from '@/lib/habitInterfaces';

/**
 * AI習慣提案コンポーネント
 * 天気情報、時間帯、ユーザーの履歴と連携し、最適な習慣を提案する
 */
export default function AIHabitSuggestions() {
  // ストアからの状態取得
  const { user } = useAuthStore();
  const { addHabit, habits } = useHabitStore();
  const { data: weatherFromStore } = useWeatherStore();
  
  // ローカル状態
  const [suggestions, setSuggestions] = useState<HabitSuggestion[]>([]);
  const [weather, setWeather] = useState(weatherFromStore);
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null);

  // コンポーネントマウント時、または認証状態変更時に実行
  useEffect(() => {
    // 天気情報を取得
    async function getWeather() {
      const weatherData = await fetchWeather();
      setWeather(weatherData);
    }
    
    if (!weather) {
      getWeather();
    }
    
    // ユーザーがログインしている場合のみ提案を取得
    if (user) {
      loadSuggestions();
    }
  }, [user, weather]);

  /**
   * AI提案をロードする関数
   */
  const loadSuggestions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const aiSuggestions = await suggestHabits(user.uid);
      setSuggestions(aiSuggestions);
      console.log('AI習慣提案取得成功:', aiSuggestions.length, '件');
    } catch (error) {
      console.error("習慣提案の取得に失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 提案された習慣を習慣リストに追加する
   * @param suggestion 追加する習慣提案情報
   */
  const handleAddHabit = async (suggestion: HabitSuggestion) => {
    const habitData: CreateHabitData = {
      title: suggestion.title,
      description: suggestion.description,
      frequency: suggestion.frequency,
      targetDays: suggestion.targetDays || [],
      reminderTime: suggestion.reminderTime,
      isActive: true
    };

    try {
      await addHabit(habitData);
      
      // 追加した習慣を提案リストから削除
      setSuggestions(prev => prev.filter(s => s.title !== suggestion.title));
      
      console.log('AI提案習慣追加成功:', suggestion.title);
    } catch (error) {
      console.error('AI提案習慣追加エラー:', error);
    }
  };

  /**
   * 提案リストを更新する
   */
  const handleRefresh = () => {
    loadSuggestions();
  };

  /**
   * 天気状態に対応する絵文字を返す
   * @param condition 天気状態
   * @returns 対応する絵文字
   */
  const getWeatherEmoji = (condition: string) => {
    switch (condition) {
      case 'sunny': return '☀️';
      case 'cloudy': return '☁️';
      case 'rainy': return '🌧️';
      case 'snowy': return '❄️';
      case 'stormy': return '⛈️';
      case 'foggy': return '🌫️';
      default: return '🌤️';
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
   * 優先度に応じた色を取得
   */
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  /**
   * 優先度に応じたラベルを取得
   */
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '中';
    }
  };

  /**
   * カテゴリに応じたアイコンを取得
   */
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '健康・運動': return '🏃‍♂️';
      case '学習・自己啓発': return '📚';
      case 'メンタルヘルス': return '🧘‍♀️';
      case '生活習慣': return '🏠';
      case '人間関係': return '👥';
      default: return '✨';
    }
  };

  /**
   * 現在の時間帯を取得
   */
  const getCurrentTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '朝';
    if (hour >= 12 && hour < 17) return '昼';
    if (hour >= 17 && hour < 21) return '夕方';
    return '夜';
  };

  // ユーザーがログインしていない場合の表示
  if (!user) {
    return (
      <div className="p-4 bg-gray-100 shadow-md rounded-lg">
        <h2 className="text-lg font-semibold mb-2">🤖 AI習慣提案</h2>
        <p className="text-gray-600">ログインすると、あなたの行動パターンや環境に基づいた習慣提案が表示されます</p>
      </div>
    );
  }

  // データ読み込み中の表示
  if (loading) {
    return (
      <div className="p-4 bg-white shadow-md rounded-lg">
        <h2 className="text-lg font-semibold mb-2">🤖 AI習慣提案</h2>
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">あなたに最適な習慣を分析中...</span>
        </div>
      </div>
    );
  }

  // メイン表示
  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      {/* ヘッダー部分 */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold">🤖 AI習慣提案</h2>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="ml-2 text-gray-500 hover:text-gray-700"
            aria-label="情報"
          >
            ℹ️
          </button>
        </div>
        
        {/* 天気情報と時間帯の表示 */}
        <div className="flex items-center space-x-3">
          {weather && (
            <div className="flex items-center text-sm text-gray-700">
              <span className="mr-1">{getWeatherEmoji(weather.condition)}</span>
              <span>{weather.temperature}°C</span>
            </div>
          )}
          
          <div className="flex items-center text-sm text-gray-700">
            <span className="mr-1">🕐</span>
            <span>{getCurrentTimeOfDay()}</span>
          </div>
          
          {/* 更新ボタン */}
          <button
            onClick={handleRefresh}
            className="p-1 text-blue-500 hover:text-blue-700"
            aria-label="更新"
          >
            🔄
          </button>
        </div>
      </div>

      {/* 情報表示エリア - アニメーション付き */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-blue-50 rounded-md text-sm text-gray-700"
          >
            <p className="mb-2">
              あなたの過去の習慣履歴、タスクパターン、現在の時間帯、天気状況などを総合的に分析したAIによる習慣提案です。
              「+」ボタンをクリックすると、習慣リストに追加されます。
            </p>
            <div className="p-2 bg-white rounded border border-blue-100">
              <p className="font-medium text-blue-800">現在の分析状況：</p>
              <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                <div>🏃‍♂️ 既存習慣: {habits.length}個</div>
                <div>🕐 時間帯: {getCurrentTimeOfDay()}</div>
                {weather && (
                  <>
                    <div>🌤️ 天気: {weather.description}</div>
                    <div>🌡️ 気温: {weather.temperature}°C</div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 環境サマリー表示 */}
      {!showInfo && (
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-md flex items-center">
          <div className="mr-3 text-2xl">🧠</div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">
              {getCurrentTimeOfDay()}の{weather?.description || '現在の環境'}に最適な習慣を提案中
            </p>
            <p className="text-xs text-gray-600 mt-1">
              既存習慣: {habits.length}個 | 分析モード: パーソナライズ済み
            </p>
          </div>
        </div>
      )}

      {/* 提案リスト */}
      {suggestions.length > 0 ? (
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* メイン情報 */}
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <span className="text-lg">{getCategoryIcon(suggestion.category)}</span>
                      <span className="font-medium text-gray-900">{suggestion.title}</span>
                      
                      {/* 優先度バッジ */}
                      <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(suggestion.priority)}`}>
                        {getPriorityLabel(suggestion.priority)}
                      </span>
                      
                      {/* 頻度バッジ */}
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {getFrequencyText(suggestion.frequency)}
                      </span>
                      
                      {/* 天気関連バッジ */}
                      {weather && suggestion.reason.includes('天気') && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {getWeatherEmoji(weather.condition)} 天気連動
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>📅 {getFrequencyText(suggestion.frequency)}</span>
                      <span>⏰ {suggestion.reminderTime}</span>
                      <span>📂 {suggestion.category}</span>
                    </div>
                  </div>
                  
                  {/* アクションボタン */}
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => setExpandedSuggestion(expandedSuggestion === index ? null : index)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={expandedSuggestion === index ? "詳細を閉じる" : "詳細を表示"}
                    >
                      {expandedSuggestion === index ? '🔼' : '🔽'}
                    </button>
                    <button
                      onClick={() => handleAddHabit(suggestion)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                    >
                      + 追加
                    </button>
                  </div>
                </div>
              </div>
              
              {/* 詳細情報（展開可能） */}
              <AnimatePresence>
                {expandedSuggestion === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-100 bg-gray-50 p-4"
                  >
                    <div className="space-y-3">
                      {/* 提案理由 */}
                      <div>
                        <h4 className="font-medium text-gray-800 mb-1">💡 提案理由</h4>
                        <p className="text-sm text-gray-600">{suggestion.reason}</p>
                      </div>
                      
                      {/* 実行詳細 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">📋 実行詳細</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>• 頻度: {getFrequencyText(suggestion.frequency)}</p>
                            <p>• リマインダー: {suggestion.reminderTime}</p>
                            {suggestion.targetDays && suggestion.targetDays.length > 0 && (
                              <p>• 実行日: {
                                suggestion.frequency === 'weekly' 
                                  ? suggestion.targetDays.map(day => ['日', '月', '火', '水', '木', '金', '土'][day]).join(', ')
                                  : suggestion.targetDays.join(', ') + '日'
                              }</p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">🎯 期待効果</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            {suggestion.category === '健康・運動' && (
                              <>
                                <p>• 体力向上・健康維持</p>
                                <p>• ストレス軽減</p>
                                <p>• 生活リズム改善</p>
                              </>
                            )}
                            {suggestion.category === '学習・自己啓発' && (
                              <>
                                <p>• 知識・スキル向上</p>
                                <p>• 集中力向上</p>
                                <p>• 自己成長促進</p>
                              </>
                            )}
                            {suggestion.category === 'メンタルヘルス' && (
                              <>
                                <p>• 心の安定・リラックス</p>
                                <p>• 自己認識向上</p>
                                <p>• ポジティブ思考促進</p>
                              </>
                            )}
                            {suggestion.category === '生活習慣' && (
                              <>
                                <p>• 生活の質向上</p>
                                <p>• 効率性向上</p>
                                <p>• 環境改善</p>
                              </>
                            )}
                            {suggestion.category === '人間関係' && (
                              <>
                                <p>• コミュニケーション向上</p>
                                <p>• 社会的つながり強化</p>
                                <p>• 相互理解促進</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* 継続のコツ */}
                      <div>
                        <h4 className="font-medium text-gray-800 mb-1">💪 継続のコツ</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>• 小さく始めて徐々に習慣化</p>
                          <p>• 既存の習慣と組み合わせる</p>
                          <p>• 完了時の達成感を味わう</p>
                          <p>• ストリークを意識して継続モチベーション維持</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🤖</div>
          <p className="text-gray-500 mb-2">現在、新しい習慣提案はありません</p>
          <p className="text-sm text-gray-400 mb-4">
            既存の習慣を継続するか、手動で新しい習慣を追加してみましょう
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            🔄 提案を更新
          </button>
        </div>
      )}
      
      {/* フッター統計 */}
      {suggestions.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>🎯 {suggestions.length}件の習慣提案</span>
            <span>
              ⚡ 更新: {new Date().toLocaleTimeString('ja-JP', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}