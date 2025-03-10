import { useEffect } from "react";
import { useStatsStore } from "@/store/statsStore";
import { useAuthStore } from "@/store/auth"; // ✅ ユーザー情報を取得

export default function PomodoroStats() {
  const { stats, loading, loadStats } = useStatsStore();
  const { user } = useAuthStore(); // ✅ ユーザー情報を取得

  useEffect(() => {
    if (user) {
      console.log("🔄 ログインユーザーが変更されたため、ポモドーロ統計をロード");
      loadStats(); // ✅ ユーザーが取得できたら `loadStats()` を実行
    }
  }, [user]); // ✅ `user` が変わるたびに `loadStats()` を実行

  if (!user) {
    return (
      <div className="p-4 bg-gray-100 shadow-md rounded-lg">
        <h2 className="text-lg font-bold">🔥 ポモドーロ統計</h2>
        <p className="text-gray-500">🔑 ログインするとポモドーロ統計が表示されます</p>
      </div>
    );
  }

  if (loading) return <p>⏳ データ取得中...</p>;

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-lg font-bold">🔥 ポモドーロ統計</h2>
      <p className="text-xl">完了セッション: {stats?.completedSessions ?? 0}</p>
    </div>
  );
}
