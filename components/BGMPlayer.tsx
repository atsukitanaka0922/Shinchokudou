import { useState, useEffect, useRef } from "react";
import Draggable, { DraggableEvent, DraggableData } from "react-draggable"; // ✅ 型をインポート

export default function BGMPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const storedState = localStorage.getItem("bgmPlaying");
    if (storedState === "true") {
      setIsPlaying(true);
    }

    const storedVolume = localStorage.getItem("bgmVolume");
    if (storedVolume) {
      setVolume(parseFloat(storedVolume));
    }

    const storedPosition = localStorage.getItem("bgmPlayerPosition");
    if (storedPosition) {
      setPosition(JSON.parse(storedPosition));
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const toggleBGM = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => console.error("Audio play error:", error));
    }

    setIsPlaying(!isPlaying);
    localStorage.setItem("bgmPlaying", String(!isPlaying));
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    localStorage.setItem("bgmVolume", String(newVolume));

    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // ✅ 修正: `DraggableEvent` と `DraggableData` を型指定
  const handleDragStop = (_e: DraggableEvent, d: DraggableData) => {
    const newPosition = { ...position, x: d.x, y: d.y };
    setPosition(newPosition);
    localStorage.setItem("bgmPlayerPosition", JSON.stringify(newPosition));
  };

  return (
    <Draggable position={position} onStop={handleDragStop}>
      <div className="fixed bottom-4 left-4 bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">🎵 Vaporwave BGM</h2>
        <button
          onClick={toggleBGM}
          className={`px-4 py-2 text-white rounded-lg ${isPlaying ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
        >
          {isPlaying ? "⏸ 停止" : "▶ 再生"}
        </button>

        <div className="mt-2">
          <label className="text-sm text-gray-600">🔊 音量</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full"
          />
        </div>

        <audio ref={audioRef} src="https://radio.plaza.one/mp3" loop />
      </div>
    </Draggable>
  );
}
