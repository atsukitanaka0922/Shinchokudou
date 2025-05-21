import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ja">
      <Head>
        <meta name="application-name" content="進捗堂" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="進捗堂" />
        <meta name="description" content="AIを活用したタスク管理とポモドーロタイマーアプリ" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#3B82F6" />
        
        {/* PWA関連 */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}