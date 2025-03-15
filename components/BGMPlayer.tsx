import { useState, useEffect, useRef } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";

export default function BGMPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedState = localStorage.getItem("bgmPlaying");
      if (storedState === "true") {
        setIsPlaying(true);
      }

      const storedVolume = localStorage.getItem("bgmVolume");
      if (storedVolume) {
        setVolume(parseFloat(storedVolume));
      }
    }
  }, []);

  const toggleBGM = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => console.error("オーディオ再生エラー:", error));
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

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    // ドラッグ&ドロップの位置を更新する処理があれば追加
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="bgm">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            <Draggable draggableId="bgm-player" index={0}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className="fixed bottom-4 left-4 bg-white p-4 rounded-lg shadow-md z-40"
                >
                  <h2 className="text-lg font-semibold mb-2">🎵 Vaporwave BGM</h2>
                  <button
                    onClick={toggleBGM}
                    className={`px-4 py-2 text-white rounded-lg ${isPlaying ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"} transition`}
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
              )}
            </Draggable>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}