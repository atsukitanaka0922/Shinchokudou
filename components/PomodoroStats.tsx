import { useEffect } from "react";
import { useStatsStore } from "@/store/statsStore";

export default function PomodoroStats() {
  const { stats, loadStats } = useStatsStore();

  useEffect(() => {
    loadStats();
  }, []);

  if (!stats) return <p className="text-gray-600">📡 データ取得中...</p>;

  return (
    <div className="p-4 rounded-lg shadow-md bg-yellow-100">
      <h2 className="text-lg font-semibold">📊 今日のポモドーロ統計</h2>
      <p className="text-md">✅ 完了したポモドーロ: {stats.completedSessions}</p>
    </div>
  );
}
