import { useMoodStore } from "@/store/moodStore";

export default function MoodSelector() {
  const { setMood } = useMoodStore(); // `mood` を削除し、使われていない変数を削除

  return (
    <div className="p-4 bg-pink-100 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold">😊 気分を選択</h2>
      <div className="flex gap-2 mt-2">
        {["元気", "普通", "疲れた"].map((m) => (
          <button
            key={m}
            onClick={() => setMood(m as "元気" | "普通" | "疲れた")}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}
