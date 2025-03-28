/**
 * AIタスク提案コンポーネント
 * 
 * ユーザーの過去のタスク履歴、現在の天気状況などを考慮して
 * AIがパーソナライズされたタスクを提案するコンポーネント
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useTaskStore } from '@/store/taskStore';
import { suggestTasks, SuggestedTask } from '@/lib/aiTaskSuggestion';
import { useWeatherStore, fetchWeather } from '@/lib/weatherService';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AIによるタスク提案コンポーネント
 * 天気情報と連携し、状況に適したタスクを提案する
 */
export default function AITaskSuggestions() {
  // ストアからの状態取得
  const { user } = useAuthStore();
  const { addTask } = useTaskStore();
  const { data: weatherFromStore } = useWeatherStore();
  
  // ローカル状態
  const [suggestions, setSuggestions] = useState<SuggestedTask[]>([]);
  const [weather, setWeather] = useState(weatherFromStore);
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

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
      const aiSuggestions = await suggestTasks(user.uid);
      setSuggestions(aiSuggestions);
    } catch (error) {
      console.error("タスク提案の取得に失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 提案されたタスクをタスクリストに追加する
   * @param task 追加するタスク情報
   */
  const handleAddTask = async (task: SuggestedTask) => {
    // 3日後を期限として設定
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 3);
    const deadlineStr = deadline.toISOString().split('T')[0];

    await addTask(task.text, deadlineStr, task.priority);

    // 追加したタスクを提案リストから削除
    setSuggestions(prev => prev.filter(s => s.text !== task.text));
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

  // ユーザーがログインしていない場合の表示
  if (!user) {
    return (
      <div className="p-4 bg-gray-100 shadow-md rounded-lg">
        <h2 className="text-lg font-semibold mb-2">🤖 AIタスク提案</h2>
        <p className="text-gray-600">ログインすると、あなたの習慣や天気に基づいたタスク提案が表示されます</p>
      </div>
    );
  }

  // データ読み込み中の表示
  if (loading) {
    return (
      <div className="p-4 bg-white shadow-md rounded-lg">
        <h2 className="text-lg font-semibold mb-2">🤖 AIタスク提案</h2>
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
          <h2 className="text-lg font-semibold">🤖 AIタスク提案</h2>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="ml-2 text-gray-500 hover:text-gray-700"
            aria-label="情報"
          >
            ℹ️
          </button>
        </div>
        
        {/* 天気情報の表示 */}
        {weather && (
          <div className="flex items-center text-sm text-gray-700 mr-2">
            <span className="mr-1">{getWeatherEmoji(weather.condition)}</span>
            <span>{weather.temperature}°C</span>
            <span className="ml-1 text-blue-500">💧{weather.humidity}%</span>
          </div>
        )}
        
        {/* 更新ボタン */}
        <button
          onClick={handleRefresh}
          className="p-1 text-blue-500 hover:text-blue-700"
          aria-label="更新"
        >
          🔄
        </button>
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
              あなたの過去のタスク履歴、現在の気分、時間帯、天気状況などを考慮したAIによるタスク提案です。
              「+」ボタンをクリックすると、タスクリストに追加されます。
            </p>
            {weather && (
              <div className="p-2 bg-white rounded border border-blue-100">
                <p className="font-medium text-blue-800">現在の天気状況：</p>
                <p>{weather.description}、気温 {weather.temperature}°C、湿度 {weather.humidity}%</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 天気サマリー表示 */}
      {weather && !showInfo && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md flex items-center">
          <div className="mr-3 text-3xl">{getWeatherEmoji(weather.condition)}</div>
          <div>
            <p className="text-sm font-medium">{weather.description}の日に最適なタスクを提案しています</p>
            <p className="text-xs text-gray-500">気温: {weather.temperature}°C / 湿度: {weather.humidity}%</p>
          </div>
        </div>
      )}

      {/* 提案リスト */}
      {suggestions.length > 0 ? (
        <ul className="space-y-2">
          {suggestions.map((task, index) => (
            <li
              key={index}
              className={`flex justify-between items-center p-3 rounded-md hover:bg-gray-100 transition ${
                task.weatherRelevant ? 'bg-blue-50' : 'bg-gray-50'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="font-medium">{task.text}</span>
                  {task.weatherRelevant && weather && (
                    <span className="ml-2 p-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {getWeatherEmoji(weather.condition)}
                    </span>
                  )}
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{task.reason}</p>
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <span className="mr-3">カテゴリ: {task.category}</span>
                  <span>予想時間: {task.estimatedTime}分</span>
                </div>
              </div>
              <button
                onClick={() => handleAddTask(task)}
                className="ml-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
              >
                +
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center py-4 text-gray-500">タスク提案がありません</p>
      )}
    </div>
  );
}