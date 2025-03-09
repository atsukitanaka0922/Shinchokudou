import { useEffect, useRef, useState } from "react";

export default function BGMPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5); // 初期音量 50%
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // クライアント側でのみ localStorage を参照
    const storedState = localStorage.getItem("bgmPlaying");
    if (storedState === "true") {
      setIsPlaying(true);
    }

    const storedVolume = localStorage.getItem("bgmVolume");
    if (storedVolume) {
      setVolume(parseFloat(storedVolume));
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

  return (
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

      {/* オーディオ要素 (非表示) */}
      <audio ref={audioRef} src="https://radio.plaza.one/mp3" loop />
    </div>
  );
}
