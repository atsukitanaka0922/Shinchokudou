import { useState, useEffect } from "react";
import { useBGMStore } from "@/store/bgmStore";

interface BGMPlayerProps {
  inTabPanel?: boolean;
}

export default function BGMPlayer({ inTabPanel = false }: BGMPlayerProps) {
  const { isPlaying, volume, togglePlay, setVolume, initialize } = useBGMStore();
  
  // コンポーネントの初期化時にBGMストアも初期化
  useEffect(() => {
    initialize();
  }, [initialize]);

  // ラジオボタン音量変更イベント(0.2, 0.5, 0.8の3段階)
  const setVolumePreset = (value: number) => {
    setVolume(value);
  };

  // タブパネル内表示かつ再生中でなければプレイヤーの説明を表示
  if (inTabPanel && !isPlaying) {
    return (
      <div>
        <button
          onClick={togglePlay}
          className="w-full px-4 py-2 text-white rounded-lg bg-green-500 hover:bg-green-600 transition"
        >
          ▶ 再生
        </button>
        
        <div className="mt-3 text-xs text-gray-500">
          <p>Vaporwave風のインターネットラジオです。</p>
          <p>タブを閉じても、バックグラウンドで再生を継続します。</p>
        </div>
      </div>
    );
  }

  // 通常表示：タブパネル内表示または再生中なら表示
  if (inTabPanel || isPlaying) {
    return (
      <div className={inTabPanel ? "" : "fixed bottom-4 right-4 z-40 w-64 bg-white p-4 rounded-lg shadow-md"}>
        {/* タブパネル表示でない場合はヘッダーを表示 */}
        {!inTabPanel && (
          <div className="text-lg font-semibold mb-3">🎵 Vaporwave BGM</div>
        )}
        
        {/* 再生・停止ボタン */}
        <button
          onClick={togglePlay}
          className={`w-full px-4 py-2 text-white rounded-lg ${isPlaying ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"} transition`}
        >
          {isPlaying ? "⏸ 停止" : "▶ 再生"}
        </button>

        {/* 音量設定（スライダー） */}
        <div className="mt-3">
          <label className="text-sm text-gray-600 block mb-1">🔊 音量</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* プリセット音量ボタン */}
        <div className="mt-2 flex justify-between">
          <button
            onClick={() => setVolumePreset(0.2)}
            className={`px-3 py-1 rounded ${Math.abs(volume - 0.2) < 0.01 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            小
          </button>
          <button
            onClick={() => setVolumePreset(0.5)}
            className={`px-3 py-1 rounded ${Math.abs(volume - 0.5) < 0.01 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            中
          </button>
          <button
            onClick={() => setVolumePreset(0.8)}
            className={`px-3 py-1 rounded ${Math.abs(volume - 0.8) < 0.01 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            大
          </button>
        </div>

        {/* BGM説明 */}
        <div className="mt-3 text-xs text-gray-500">
          <p>Vaporwave風のインターネットラジオです。作業に集中したいときにどうぞ。</p>
        </div>
      </div>
    );
  }
  
  // 表示条件を満たさない場合は何も表示しない
  return null;
}