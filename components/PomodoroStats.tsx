import { useStatsStore } from "@/store/statsStore";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function PomodoroStats() {
  const { pomodoroCount } = useStatsStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const data = [{ name: "ポモドーロ", 回数: pomodoroCount }];

  if (!isClient) return null; // SSR を防ぐ

  return (
    <div className="p-4 bg-green-100 rounded-lg shadow-md text-center">
      <h2 className="text-lg font-semibold">⏳ ポモドーロ回数</h2>
      <BarChart width={200} height={150} data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="回数" fill="#82ca9d" />
      </BarChart>
    </div>
  );
}
