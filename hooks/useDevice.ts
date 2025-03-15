import { useState, useEffect } from "react";

export function useDevice() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // 768px 未満ならスマホ
    };

    checkScreenSize(); // 初回チェック
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return isMobile;
}
