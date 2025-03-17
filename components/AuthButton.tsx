/**
 * 認証ボタンコンポーネント
 * 
 * ユーザーのログイン状態に応じて、ログインまたはログアウトボタンを表示します
 * ユーザープロフィール情報も併せて表示します
 */

//import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useTaskStore } from '@/store/taskStore';
import { motion } from 'framer-motion';

/**
 * 認証ボタンコンポーネント
 * ログイン状態に応じたボタンとユーザー情報を表示
 */
export default function AuthButton() {
  // ストアから認証情報を取得
  const { user, loading, loginWithGoogle, logout } = useAuthStore();
  const { clearTasks } = useTaskStore();

  // ログアウト処理のハンドラー
  const handleLogout = async () => {
    await logout();
    // ログアウト時にタスクをクリア
    clearTasks();
  };

  // ボタンのアニメーション設定
  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  // 読み込み中の表示
  if (loading) {
    return (
      <div className="flex justify-center my-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // ログインしている場合
  if (user) {
    return (
      <div className="flex items-center justify-between bg-gray-100 p-2 rounded-lg mb-4">
        <div className="flex items-center">
          {/* ユーザーアバター */}
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'ユーザー'}
              className="w-8 h-8 rounded-full mr-2"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2">
              {user.displayName?.charAt(0) || 'U'}
            </div>
          )}
          
          {/* ユーザー名 */}
          <span className="text-sm font-medium">
            {user.displayName || user.email || 'ユーザー'}
          </span>
        </div>
        
        {/* ログアウトボタン */}
        <motion.button
          onClick={handleLogout}
          className="ml-4 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          ログアウト
        </motion.button>
      </div>
    );
  }

  // ログインしていない場合
  return (
    <div className="flex justify-center my-4">
      <motion.button
        onClick={loginWithGoogle}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow"
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
      >
        <svg
          className="w-5 h-5 mr-2"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
        </svg>
        Googleでログイン
      </motion.button>
    </div>
  );
}