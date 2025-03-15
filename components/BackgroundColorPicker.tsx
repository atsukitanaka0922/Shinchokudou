import { useThemeStore } from "@/store/themeStore";

export default function BackgroundColorPicker() {
  const { bgColor, setBgColor } = useThemeStore();

  return (
    <div className="p-4 bg-gray-200 dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold">🎨 背景色を変更</h2>
      <input
        type="color"
        value={bgColor}
        onChange={(e) => setBgColor(e.target.value)}
        className="mt-2 w-full h-10 border-none rounded-lg cursor-pointer"
      />
    </div>
  );
}
