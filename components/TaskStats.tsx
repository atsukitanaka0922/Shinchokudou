import { useTaskStore } from "@/store/taskStore";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

export default function TaskStats() {
  const { tasks } = useTaskStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const completedTasks = tasks.filter((task) => task.completed).length;
  const remainingTasks = tasks.length - completedTasks;

  const data = [
    { name: "完了", value: completedTasks },
    { name: "未完了", value: remainingTasks },
  ];

  const COLORS = ["#00C49F", "#FF8042"];

  if (!isClient) return null; // SSR を防ぐ

  return (
    <div className="p-4 bg-blue-100 rounded-lg shadow-md text-center">
      <h2 className="text-lg font-semibold">📊 タスク完了率</h2>
      {tasks.length === 0 ? (
        <p className="text-gray-500">タスクがありません</p>
      ) : (
        <PieChart width={200} height={200}>
          <Pie data={data} dataKey="value" cx="50%" cy="50%" outerRadius={50} fill="#8884d8">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      )}
    </div>
  );
}
