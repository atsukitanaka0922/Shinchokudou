/**
 * ログイン・会員登録コンポーネント
 * 
 * メールとパスワードによるユーザー登録・ログイン機能と
 * Googleアカウントでのソーシャルログイン機能を提供します
 */

import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import AppLogo from './AppLogo';
import { useFeedbackStore } from '@/store/feedbackStore';

/**
 * ログイン・会員登録コンポーネント
 */
export default function LoginRegister() {
  // 認証ストアからの状態と関数
  const { 
    user, 
    loading, 
    loginWithGoogle, 
    loginWithEmail, 
    registerWithEmail, 
    resetPassword, 
    authError, 
    clearAuthError 
  } = useAuthStore();
  
  // フィードバックストア
  const { setMessage } = useFeedbackStore();
  
  // ローカル状態
  const [isLogin, setIsLogin] = useState(true); // ログインモード（true）か登録モード（false）か
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetMode, setResetMode] = useState(false); // パスワードリセットモード
  
  // エラーが発生した場合は自動的にフィードバックに表示
  useEffect(() => {
    if (authError) {
      setMessage(authError);
      // 一定時間後にエラーをクリア
      setTimeout(() => {
        clearAuthError();
      }, 5000);
    }
  }, [authError, setMessage, clearAuthError]);
  
  /**
   * メールアドレスとパスワードでのログイン
   */
  const handleEmailLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // 入力検証
    if (!email || !password) {
      setMessage('メールアドレスとパスワードを入力してください');
      return;
    }
    
    try {
      await loginWithEmail(email, password);
    } catch (error) {
      console.error('ログインエラー:', error);
    }
  };
  
  /**
   * メールアドレスとパスワードでの会員登録
   */
  const handleEmailRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // 入力検証
    if (!email || !password) {
      setMessage('メールアドレスとパスワードを入力してください');
      return;
    }
    
    if (password !== confirmPassword) {
      setMessage('パスワードが一致しません');
      return;
    }
    
    if (password.length < 6) {
      setMessage('パスワードは6文字以上にしてください');
      return;
    }
    
    try {
      await registerWithEmail(email, password);
      setMessage('アカウントを作成しました');
    } catch (error) {
      console.error('登録エラー:', error);
    }
  };
  
  /**
   * パスワードリセットメールの送信
   */
  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('メールアドレスを入力してください');
      return;
    }
    
    try {
      await resetPassword(email);
      setMessage('パスワードリセットメールを送信しました');
      setResetMode(false);
    } catch (error) {
      console.error('パスワードリセットエラー:', error);
    }
  };
  
  /**
   * モードの切り替え（ログイン⇔登録）
   */
  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearAuthError();
  };

  // ユーザーがすでにログインしている場合は何も表示しない
  if (user) return null;

  return (
    <motion.div 
      className="max-w-md w-full mx-auto p-6 bg-white shadow-xl rounded-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* ロゴ */}
      <div className="text-center mb-6">
        <AppLogo width={120} height={120} />
        <h1 className="text-2xl font-bold mt-2">進捗堂</h1>
        <p className="text-gray-600 text-sm">AI搭載タスク管理アプリ</p>
      </div>
      
      {/* タイトル */}
      <h2 className="text-xl font-semibold mb-4 text-center">
        {resetMode 
          ? 'パスワードをリセット' 
          : isLogin 
            ? 'ログイン' 
            : '新規アカウント登録'}
      </h2>

      {/* パスワードリセットフォーム */}
      {resetMode ? (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                処理中...
              </span>
            ) : 'リセットメールを送信'}
          </button>
          
          <p className="text-center text-sm">
            <button
              type="button"
              onClick={() => setResetMode(false)}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              ログイン画面に戻る
            </button>
          </p>
        </form>
      ) : (
        <>
          {/* ログイン・登録フォーム */}
          <form 
            onSubmit={isLogin ? handleEmailLogin : handleEmailRegister} 
            className="space-y-4"
          >
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
            </div>
            
            {/* 新規登録時のみパスワード確認を表示 */}
            {!isLogin && (
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード（確認）
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  処理中...
                </span>
              ) : isLogin ? 'ログイン' : '登録'}
            </button>
          </form>
          
          {/* ログインモードの場合のみパスワードリセットリンクを表示 */}
          {isLogin && (
            <p className="text-center text-sm mt-2">
              <button
                type="button"
                onClick={() => setResetMode(true)}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                パスワードをお忘れですか？
              </button>
            </p>
          )}
          
          {/* モード切替リンク */}
          <p className="text-center text-sm mt-4">
            {isLogin ? (
              <>
                アカウントをお持ちでない場合は 
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-blue-600 hover:text-blue-800 hover:underline ml-1"
                >
                  新規登録
                </button>
              </>
            ) : (
              <>
                すでにアカウントをお持ちの場合は 
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-blue-600 hover:text-blue-800 hover:underline ml-1"
                >
                  ログイン
                </button>
              </>
            )}
          </p>
          
          {/* 区切り線 */}
          <div className="relative mt-6 mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">または</span>
            </div>
          </div>
          
          {/* Googleログインボタン */}
          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition duration-200"
          >
            <svg 
              className="h-5 w-5 mr-2" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 48 48"
            >
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
            Googleでログイン
          </button>
        </>
      )}
    </motion.div>
  );
}