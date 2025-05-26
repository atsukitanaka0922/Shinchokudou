# 進捗堂 (Shinchokudou) 📝✨

**AI搭載タスク管理・ポモドーロアプリケーション**

進捗堂は、最新のAI技術とゲーミフィケーション要素を組み合わせた次世代のタスク管理アプリです。タスク完了でポイントを獲得し、そのポイントでゲームを楽しむことで、継続的なモチベーション維持を実現します。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![PWA](https://img.shields.io/badge/PWA-Ready-green)](https://web.dev/progressive-web-apps/)

## 🌟 主な機能

### 🤖 AI機能
- **AIタスク提案**: 過去の履歴、現在の気分、時間帯、天気状況を考慮した自動タスク提案
- **AI優先度判定**: テキスト解析による自動優先度設定（高・中・低・緊急の4段階）
- **天気連携タスク**: 気象条件に応じた最適なタスク提案

### 📝 拡張タスク管理
- **階層タスク**: メインタスク + サブタスクによる詳細な進捗管理
- **メモ機能**: マークダウン対応の詳細記録
- **期限管理**: デッドライン設定と自動警告通知
- **見積もり時間**: タスクの所要時間予測と実績管理
- **4段階優先度**: 緊急・高・中・低の詳細な優先度管理

### 💎 ポイントシステム & ゲーミフィケーション
- **ポイント獲得**: タスク完了で優先度に応じたポイント獲得（5-15pt）
- **ログインボーナス**: 連続ログインで最大50ポイント
- **ポイント履歴**: 獲得・消費の詳細な記録管理
- **取り消し対応**: タスク完了取り消し時の自動ポイント減算（総獲得ポイントからも減算）

### 🎮 ゲームセンター
- **ディノラン**: Chromeの恐竜ゲームを模したジャンプアクションゲーム
- **フラッピーバード**: パイプの隙間を通り抜ける羽ばたきゲーム
- **ポイント消費**: 1回のプレイに5ポイント必要
- **スコア記録**: 最高スコア、平均スコア、プレイ回数の統計管理
- **リアルタイム更新**: ゲーム履歴と統計の即座反映

### ⏰ ポモドーロタイマー
- **25分作業 + 5分休憩**: 科学的に証明された集中サイクル
- **音声通知**: ベル音 + ブラウザ通知によるアラート
- **バックグラウンド動作**: タブ切り替え時も継続動作
- **統計連携**: 完了セッション数の自動記録

### 🎵 その他の機能
- **BGMプレイヤー**: Vaporwave系インターネットラジオ
- **テーマカスタマイズ**: 5色の背景色から選択可能
- **PWA対応**: オフライン利用、ホーム画面への追加対応
- **完全レスポンシブ**: モバイル・デスクトップ最適化

## 🚀 技術スタック

- **フロントエンド**: Next.js 14, TypeScript, Tailwind CSS
- **状態管理**: Zustand
- **アニメーション**: Framer Motion
- **バックエンド**: Firebase (Authentication, Firestore)
- **PWA**: Service Worker, Web App Manifest
- **デプロイ**: Vercel

## 📱 対応プラットフォーム

- **Webブラウザ**: Chrome, Firefox, Safari, Edge
- **モバイル**: iOS Safari, Android Chrome
- **PWA**: ホーム画面インストール対応
- **オフライン**: 基本機能の限定的利用可能

## 🎯 使い方

### 基本的な使用フロー

1. **アカウント作成**
   - メールアドレス + パスワード
   - Googleアカウントでのソーシャルログイン

2. **タスク管理**
   ```
   AIタスク提案 → タスク追加 → 優先度設定 → ポモドーロ実行 → 完了 → ポイント獲得
   ```

3. **ゲーミフィケーション**
   ```
   ポイント獲得 → ゲームセンター → ゲーム選択 → 5pt消費 → プレイ → スコア記録
   ```

### 📖 詳細な機能説明

#### AIタスク提案の活用
- AIが提案するタスクの「+」ボタンでワンクリック追加
- 天気関連タスクは青い背景で表示
- 過去の履歴を学習して個人に最適化

#### サブタスク機能
- 大きなタスクを小さなステップに分割
- サブタスク完了で3ポイント獲得
- 進捗バーでタスクの進行状況を可視化

#### ポモドーロテクニック
1. タスクの「⏱️」ボタンでタイマー開始
2. 25分間集中作業
3. アラーム音で休憩時間をお知らせ
4. 「🔕 アラームを停止」ボタンで手動停止可能

#### ゲームセンター
- **ディノラン**: スペースキー/タップでジャンプ、障害物回避
- **フラッピーバード**: スペースキー/タップで羽ばたき、パイプ通過
- 統計・履歴・ランキング機能搭載

## 🛠️ セットアップ方法

### 開発環境の構築

```bash
# リポジトリのクローン
git clone https://github.com/your-repo/shinchokudou.git
cd shinchokudou

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# Firebase設定を .env.local に記述

# 開発サーバーの起動
npm run dev
```

### Firebase設定

```bash
# .env.local ファイルに以下を設定
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Firestoreセキュリティルール

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザー認証が必要
    match /{document=**} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
    
    // 統計とログ
    match /stats/{userId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId;
    }
  }
}
```

## 📊 アーキテクチャ

### ディレクトリ構成

```
shinchokudou/
├── components/          # Reactコンポーネント
│   ├── Enhanced*.tsx    # 拡張タスク関連
│   ├── Game*.tsx        # ゲーム関連
│   ├── Points*.tsx      # ポイント関連
│   └── UI共通コンポーネント
├── store/               # Zustand状態管理
│   ├── enhancedTaskStore.ts
│   ├── pointStore.ts
│   ├── gameCenterStore.ts
│   └── その他ストア
├── lib/                 # ユーティリティ
│   ├── firebase.ts
│   ├── aiTaskSuggestion.ts
│   ├── weatherService.ts
│   └── その他ライブラリ
├── hooks/               # カスタムフック
├── pages/               # Next.jsページ
└── public/              # 静的ファイル
    ├── icons/           # PWAアイコン
    ├── sounds/          # 効果音
    └── manifest.json    # PWAマニフェスト
```

### データベース設計

```typescript
// Firestore Collections
/enhancedTasks/{taskId}     // 拡張タスク
/userPoints/{userId}        // ユーザーポイント
/pointHistory/{historyId}   // ポイント履歴
/gameHistory/{historyId}    // ゲーム履歴
/stats/{statsId}            // ポモドーロ統計
/migrationLogs/{logId}      // データ移行ログ
```

## 📈 更新履歴

### v1.5.0 (最新) - 2025年1月
**🎮 ゲーミフィケーション & 拡張機能の大型アップデート**

#### 新機能
- **ポイントシステム**: タスク完了でポイント獲得（優先度別: 5-15pt）
- **ログインボーナス**: 連続ログインで最大50ポイント
- **ゲームセンター**: ディノラン & フラッピーバード（5pt/回）
- **サブタスク機能**: 階層的タスク管理
- **メモ機能**: マークダウン対応の詳細記録
- **見積もり時間**: タスクの所要時間管理

#### 技術的改善
- **データ移行機能**: 既存タスクの自動移行
- **リアルタイム統計**: ゲーム履歴の即座反映
- **ポイント減算**: タスク取り消し時の総獲得ポイント減算
- **PWA最適化**: オフライン動作の改善
- **エラーハンドリング**: 包括的なエラー処理

#### UI/UX改善
- **デスクトップレイアウト**: タブ型インターフェース
- **ゲーム統計**: 詳細なスコア管理
- **プログレスバー**: サブタスク進捗の可視化
- **ポイント履歴**: 獲得・消費の詳細表示

### v1.4.0 - PWA対応
- PWA（Progressive Web App）対応
- メールアドレス・パスワード認証追加
- デスクトップレイアウト改善
- 完了タスクの自動削除（1週間後）

### v1.3.1 - バグ修正
- iOSダークモード表示問題修正
- 天気データ統合サービス実装
- 天気キャッシュ機能追加

### v1.3.0 - UI大幅改善
- UIデザインの全面リニューアル

### v1.2.2 - 緊急修正
- スマホ版クラッシュ問題修正

### v1.2.1 - ポモドーロ改善
- アラーム停止ボタン追加
- サウンド再生安定性向上

### v1.2.0 - AI機能追加
- AIタスク提案機能
- 自動優先度設定
- 天気連携タスク提案
- アプリ説明(README)追加

### v1.1.0 - インターフェース改善
- タブ型UI導入
- BGMプレイヤー追加
- バックグラウンド実行対応

### v1.0.0 - 初回リリース
- 基本的なタスク管理
- ポモドーロタイマー

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### アラーム音が鳴らない
```
解決策: ポモドーロタブの「🔊 通知音をテスト」ボタンをクリックして、
ブラウザの音声再生権限を有効にしてください。
```

#### 通知が表示されない
```
解決策: ブラウザの通知設定で、このサイトからの通知を「許可」に設定してください。
```

#### ゲームのスコアが記録されない
```
解決策: 
1. インターネット接続を確認
2. ゲームセンターで「🔄 データ更新」ボタンをクリック
3. ページを再読み込み
```

#### PWAがインストールできない
```
解決策: 
- iOS: Safariブラウザを使用
- Android: Chromeブラウザを使用
- PC: Chrome、Edgeブラウザを使用
```

## 📞 サポート・お問い合わせ

### バグ報告・機能要望
- **お問い合わせフォーム**: [Google Forms](https://docs.google.com/forms/d/e/1FAIpQLSdENYnpf4xyn8Mli9TumjhRYrV1Zqt1RSJsDNeCREP0_5ghjA/viewform)
- **メール**: atsuki7660@gmail.com

### 開発者情報
- **開発**: 田中 敦喜
- **デザイン**: 田中 敦喜
- **プロジェクト管理**: GitHub

## 📄 ライセンス・クレジット

### オープンソースライセンス
- **ライセンス**: MIT License
- **フレームワーク**: Next.js, React, TypeScript
- **UI**: Tailwind CSS, Framer Motion

### 外部サービス・素材
- **BGM**: Nightwave Plaza (https://plaza.one/)
- **効果音**: 効果音ラボ, Springin' Sound Stock
- **AI機能**: Claude Model by Anthropic
- **ホスティング**: Vercel
- **データベース**: Firebase (Google)

### 謝辞
進捗堂の開発にご協力いただいた全てのテストユーザー、フィードバック提供者、およびオープンソースコミュニティに深く感謝いたします。

---

**進捗堂で、あなたの生産性を次のレベルへ！** 🚀

*© 2025 進捗堂 - All rights reserved*