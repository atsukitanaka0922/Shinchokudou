import { usePomodoroStore } from "@/store/pomodoroStore";

export default function PomodoroStats() {
  const { pomodoroCount } = usePomodoroStore();

  return (
    <div className="p-4 rounded-lg shadow-md bg-white">
      <h2 className="text-lg font-semibold mb-2">📊 ポモドーロ統計</h2>
      <p className="text-xl font-bold">{pomodoroCount} 回</p>
    </div>
  );
}
