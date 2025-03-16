import React from 'react';
import Image from 'next/image';

interface AppLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function AppLogo({ width = 200, height = 200, className = '' }: AppLogoProps) {
  return (
    <div className={`inline-block ${className}`}>
      {/* Next.jsのImageコンポーネントを使用 */}
      <Image
        src="/logo.png" // パスを修正：publicディレクトリ直下にlogo.pngを配置する前提
        alt="Shinchokudou Logo"
        width={width}
        height={height}
        className="object-contain"
        priority // 優先的に読み込み
      />
    </div>
  );
}