import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>進捗堂 | AI搭載タスク管理アプリ</title>
        <meta name="description" content="進捗堂（Shinchokudou）- AIを活用したタスク管理とポモドーロタイマーアプリ" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#3B82F6" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}