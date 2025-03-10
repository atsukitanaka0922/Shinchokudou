import { useAuthStore } from "@/store/auth";

export default function AuthButton() {
  const { user, loading, loginWithGoogle, logout } = useAuthStore();

  if (loading) return <p>🔄 読み込み中...</p>;

  return (
    <div className="p-4 flex justify-end">
      {user ? (
        <div className="flex items-center space-x-4">
          <p className="text-gray-700">こんにちは, {user.displayName}!</p>
          <button onClick={logout} className="px-4 py-2 bg-red-500 text-white rounded-lg">
            🚪 ログアウト
          </button>
        </div>
      ) : (
        <button onClick={loginWithGoogle} className="px-4 py-2 bg-blue-500 text-white rounded-lg">
          🔵 Google でログイン
        </button>
      )}
    </div>
  );
}
