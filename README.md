# 進捗堂 (Shinchokudou) - AI搭載タスク管理アプリ

<div align="center">
  <img src="public/logo.png" alt="進捗堂ロゴ" width="200"/>
  <p>生産性向上のためのAI搭載タスク管理ソリューション</p>
</div>

## 📱 概要

**進捗堂**（Shinchokudou）は、AIを活用した次世代のタスク管理＆ポモドーロアプリです。ユーザーの習慣、天気、時間帯などを考慮し、パーソナライズされたタスク提案を提供します。シンプルなUIと強力な機能を組み合わせ、生産性向上をサポートします。

## ✨ 主要機能

### 🤖 AIタスク提案
- ユーザーの過去のタスク履歴を分析
- 現在の天気状況に基づいたタスク提案
- 時間帯に最適化されたアクティビティの推奨

### 📊 AIによる優先度設定
- タスクのコンテンツから自動的に優先度を判定
- キーワード分析による重要度の判別
- 期限との組み合わせによる最適な優先順位付け

### ⏱️ ポモドーロタイマー
- 25分の作業/5分の休憩のサイクル管理
- タスクに直接リンクされたタイマー
- 通知とサウンドアラート機能

### 🌤️ 天気連携
- 現在の天気に基づいたタスク提案
- 屋内/屋外活動の最適化
- 天気変化に応じた行動推奨

### 📅 デッドライン管理
- 期限切れや期限間近のタスクの視覚的警告
- タスク期限の簡単な設定と管理
- ダッシュボードで今日の締め切りを一目で把握

### 🎵 BGMプレイヤー
- 集中力を高める環境音楽
- ボリューム調整可能
- バックグラウンド再生対応

### 📱 PWA対応
- ホーム画面にインストール可能
- オフライン対応
- ネイティブアプリに近い操作感

### 🔄 自動タスク整理
- 完了したタスクは1週間後に自動削除
- 削除までの残り日数表示
- タスクリストの自動クリーンアップ

### 🔐 複数ログイン方法
- メールアドレスとパスワードでの会員登録
- Googleアカウントでのソーシャルログイン
- パスワードリセット機能

## 🛠️ 技術スタック

- **フロントエンド**: Next.js, React, TypeScript
- **スタイリング**: Tailwind CSS, Framer Motion
- **状態管理**: Zustand
- **バックエンド**: Firebase (Authentication, Firestore)
- **PWA**: next-pwa
- **デプロイ**: Vercel

## 📦 プロジェクト構造

```
/
├── components/         # Reactコンポーネント
├── hooks/              # カスタムReactフック
├── lib/                # ユーティリティ関数・サービス
├── pages/              # Next.jsページコンポーネント
├── public/             # 静的アセット
│   ├── icons/          # PWA用アイコン
│   └── sounds/         # 効果音
├── store/              # Zustandストア定義
└── styles/             # グローバルCSS定義
```

## 🚀 開発環境のセットアップ

### 前提条件
- Node.js 16.x以上
- npm または yarn
- Firebase プロジェクト

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/shinchokudou.git
cd shinchokudou

# 依存関係のインストール
npm install
# または
yarn install

# .env.localファイルをプロジェクトルートに作成し、必要な環境変数を設定
# Firebase設定
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# 開発サーバーの起動
npm run dev
# または
yarn dev
```

## 🔄 更新履歴

### v1.4.0
- PWA（Progressive Web App）対応：ホーム画面に追加して本格的アプリとして使用可能に
- メールアドレスとパスワードによるユーザー登録/ログイン機能の追加
- ログイン画面のUIを全面刷新
- パスワードリセット機能の追加
- デスクトップビューのレイアウト改善
- アプリインストールガイドの追加
- 完了したタスクの自動削除機能を追加（完了から1週間後）

### v1.3.1
- iOSダークモード時のテキスト表示問題を修正
- 天気データの統合サービスを実装し、タスク提案とダッシュボードの天気表示を同期
- 天気に基づくタスク提案の精度向上（霧、嵐などの天気状態に対応）
- 天気データキャッシュ機能の追加によるパフォーマンス改善

### v1.3.0
- UIの大幅改善

### v1.2.2
- スマホ版で締め切り間近のタスクがあると動かなくなる不具合の修正

### v1.2.1
- ポモドーロタイマーにアラーム停止ボタンを追加
- サウンド再生機能の信頼性向上

### v1.2.0
- AIタスク提案機能の追加
- 機械学習による自動優先度設定
- ポモドーロタイマーのサウンド修正
- アプリ説明（README）の追加
- 天気に基づくタスク提案機能
- ロゴの追加

### v1.1.0
- タブ型UIの導入
- BGMプレイヤーの追加
- バックグラウンド実行の対応

### v1.0.0
- 初回リリース
- 基本的なタスク管理
- ポモドーロタイマー

## 🤝 貢献

貢献は大歓迎です！バグ報告、機能リクエスト、プルリクエストなど、どんな形でも構いません。大きな変更を加える前に、まずはissueで提案してください。

## 👨‍💻 開発者

- **田中 敦喜** - [GitHub](https://github.com/atsukitanaka0922)