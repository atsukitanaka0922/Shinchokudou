/**
 * アプリケーションロゴコンポーネント
 * 
 * アプリケーションのロゴを表示するためのコンポーネント
 * Next.jsのImageコンポーネントを使用して最適化されたロゴ画像を提供します
 */

import React from 'react';
import Image from 'next/image';

/**
 * AppLogoのプロパティ定義
 */
interface AppLogoProps {
  width?: number;      // ロゴの幅（ピクセル）
  height?: number;     // ロゴの高さ（ピクセル）
  className?: string;  // 追加のCSSクラス
}

/**
 * アプリケーションロゴコンポーネント
 * 
 * @param width ロゴの幅（デフォルト: 200px）
 * @param height ロゴの高さ（デフォルト: 200px）
 * @param className 追加のCSSクラス（オプション）
 */
export default function AppLogo({ 
  width = 200, 
  height = 200, 
  className = '' 
}: AppLogoProps) {
  return (
    <div className={`inline-block ${className}`}>
      {/* Next.jsのImageコンポーネントを使用してロゴを表示
          Imageコンポーネントは自動的に画像の最適化を行います */}
      <Image
        src="/logo.png" // publicディレクトリ直下にlogo.pngを配置
        alt="Shinchokudou Logo"
        width={width}
        height={height}
        className="object-contain" // アスペクト比を維持しながらコンテナにフィット
        priority // LCPを改善するために優先的に読み込み
      />
    </div>
  );
}