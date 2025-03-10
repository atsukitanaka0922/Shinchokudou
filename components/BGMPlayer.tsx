import { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd"; // 🔥 react-rnd を使用

export default function BGMPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 🔥 位置とサイズを `localStorage` に保存
  const [position, setPosition] = useState({ x: 200, y: 200, width: 250, height: 150 });

  useEffect(() => {
    // BGM の状態を `localStorage` から取得
    const storedState = localStorage.getItem("bgmPlaying");
    if (storedState === "true") setIsPlaying(true);

    const storedVolume = localStorage.getItem("bgmVolume");
    if (storedVolume) setVolume(parseFloat(storedVolume));

    const savedPosition = localStorage.getItem("bgmPlayerPosition");
    if (savedPosition) setPosition(JSON.parse(savedPosition));
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
      audioRef.current.play().catch((error) => console.error("Audio play error:", error));
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

  const handleDragStop = (e, d) => {
    const newPosition = { ...position, x: d.x, y: d.y };
    setPosition(newPosition);
    localStorage.setItem("bgmPlayerPosition", JSON.stringify(newPosition));
  };

  return (
    <Rnd
      size={{ width: position.width, height: position.height }}
      position={{ x: position.x, y: position.y }}
      onDragStop={handleDragStop}
      bounds="parent"
      enableResizing={{ right: true, bottom: true, bottomRight: true }}
      onResizeStop={(e, direction, ref, delta, position) => {
        const newSize = {
          width: ref.offsetWidth,
          height: ref.offsetHeight,
          x: position.x,
          y: position.y,
        };
        setPosition(newSize);
        localStorage.setItem("bgmPlayerPosition", JSON.stringify(newSize));
      }}
    >
      <div className="bg-white p-4 rounded-lg shadow-md cursor-move">
        <h2 className="text-lg font-semibold mb-2">🎵 Vaporwave BGM</h2>
        <button
          onClick={toggleBGM}
          className={`px-4 py-2 text-white rounded-lg ${
            isPlaying ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
          }`}
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

        {/* オーディオ要素 (非表示) */}
        <audio ref={audioRef} src="https://radio.plaza.one/mp3" loop />
      </div>
    </Rnd>
  );
}
