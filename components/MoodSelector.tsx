import { useMoodStore } from "@/store/moodStore";

export default function MoodSelector() {
  const { mood, setMood } = useMoodStore();

  return (
    <div className="p-4 bg-pink-100 rounded-lg shadow-md">
      <h2>😊 気分を選択</h2>
      {["元気", "普通", "疲れた"].map((m) => (
        <button key={m} onClick={() => setMood(m as "元気" | "普通" | "疲れた")}>
          {m}
        </button>
      ))}
    </div>
  );
}
