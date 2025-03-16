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
      <Image
        src="/images/logo.png" // PNGファイルへのパス（publicフォルダ内のimagesディレクトリにlogo.pngを配置する前提）
        alt="Shinchokudou Logo"
        width={width}
        height={height}
        className="object-contain"
        priority // 優先的に読み込み
      />
    </div>
  );
}