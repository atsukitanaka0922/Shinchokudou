/**
 * README内容表示コンポーネント
 * 
 * アプリケーションの使用方法、機能説明、更新履歴などを表示するコンポーネント
 * アプリのドキュメント機能として機能し、ユーザーガイドを提供します
 */

import React from 'react';

/**
 * README内容コンポーネント
 * アプリの詳細な説明と使用方法を提供
 */
export default function ReadmeContent() {
  // お問い合わせフォームのURL
  const contactUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdENYnpf4xyn8Mli9TumjhRYrV1Zqt1RSJsDNeCREP0_5ghjA/viewform";
  
  return (
    <div className="prose prose-slate max-w-none">
      {/* アプリケーションタイトルと概要 */}
      <h2 className="text-xl font-bold mb-3">進捗堂 📝✨</h2>
      
      <p className="mb-3">
        進捗堂 は、AI機能を活用した次世代のタスク管理・ポモドーロアプリです。あなたの生産性を最大化するための様々な機能を提供します。
      </p>
      
      {/* 主要機能の説明セクション */}
      <h3 className="text-lg font-semibold mt-4 mb-2">🔍 主な機能</h3>
      
      {/* AIタスク提案機能 */}
      <h4 className="font-medium mt-3 mb-1">1. AIタスク提案</h4>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          あなたの過去の行動パターン、現在の気分、時間帯などを分析して、最適なタスクを自動的に提案します。「+」ボタンでタスクリストに直接追加できます。
        </p>
      </div>
      
      {/* AI優先度設定機能 */}
      <h4 className="font-medium mt-3 mb-1">2. AI優先度設定</h4>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          タスクの内容と締め切りを分析し、最適な優先度を自動的に設定します。優先度は「緊急」「高」「中」「低」の4段階で表示され、いつでも手動で調整できます。
        </p>
      </div>
      
      {/* ポモドーロタイマー機能 */}
      <h4 className="font-medium mt-3 mb-1">3. ポモドーロタイマー</h4>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          ポモドーロテクニックを活用した集中管理ツールです。25分の作業と5分の休憩を繰り返すサイクルで、効率的に作業を進められます。タイマーは画面右下の「⏱️」ボタンからアクセスできます。
        </p>
        <div className="bg-gray-50 p-2 rounded mt-2 text-xs">
          <strong>使い方:</strong>
          <ol className="list-decimal pl-5 space-y-1 mt-1">
            <li>タスクリストの「⏳」ボタンをクリックしてポモドーロを開始</li>
            <li>25分間集中して作業に取り組む</li>
            <li>タイマーが終了するとアラーム音でお知らせ</li>
            <li>「🔕 アラームを停止」ボタンでアラームを止められます</li>
            <li>5分間の休憩</li>
            <li>サイクルを繰り返して生産性を高める</li>
          </ol>
          <p className="mt-2 text-orange-600">
            <strong>【重要】アラーム音について：</strong> ブラウザのセキュリティ設定により、サウンドを再生するには事前のユーザー操作が必要です。初回利用時はポモドーロタブの「アラーム音をテスト」ボタンをクリックして、音が正常に鳴ることを確認してください。
          </p>
        </div>
      </div>
      
      {/* 天気ベースのタスク提案機能 */}
      <h4 className="font-medium mt-3 mb-1">4. 天気に基づいたタスク提案</h4>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          現在の天気状況（晴れ・雨・雪など）、気温、湿度に基づいて最適なタスクを提案します。天気関連のタスクは青い背景で表示され、環境に配慮した効率的な活動をサポートします。
        </p>
      </div>
      
      {/* BGMプレイヤー機能 */}
      <h4 className="font-medium mt-3 mb-1">5. BGMプレイヤー</h4>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          作業に集中するための環境音楽プレイヤーです。Vaporwave風の落ち着いたインターネットラジオを提供しています。画面右下の「🎵」ボタンからアクセスできます。
        </p>
      </div>
      
      {/* デッドライン管理機能 */}
      <h4 className="font-medium mt-3 mb-1">6. デッドライン管理</h4>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          期限が近づいているタスクを自動的に検出し、通知します。期限切れや期限間近のタスクは画面上部に警告表示されます。
        </p>
      </div>
      
      {/* PWA機能 */}
      <h4 className="font-medium mt-3 mb-1">7. PWA対応</h4>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          進捗堂はPWA（Progressive Web App）に対応しています。ホーム画面に追加すると、アプリのようにオフラインでも利用できます。ブラウザのインストールオプションを使用するか、「共有」→「ホーム画面に追加」で利用できます。
        </p>
      </div>
      
      {/* 使い始め方の説明 */}
      <h3 className="text-lg font-semibold mt-4 mb-2">🚀 使い始め方</h3>
      
      <div className="pl-4 mb-3">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>
            <strong>アカウント作成:</strong> メールアドレスとパスワードで登録、またはGoogleアカウントでログインできます
          </li>
          <li>
            <strong>タスク追加:</strong> 「新しいタスクを追加」フォームでタスクを作成します
          </li>
          <li>
            <strong>AIの提案活用:</strong> AIタスク提案セクションから提案されたタスクを追加できます
          </li>
          <li>
            <strong>タスク管理:</strong> タスクの完了、優先度変更、締め切り設定が可能です
          </li>
          <li>
            <strong>ポモドーロ活用:</strong> タスクの「⏳」ボタンをクリックしてポモドーロを開始します
          </li>
          <li>
            <strong>通知設定:</strong> ブラウザの通知許可を「許可」に設定すると、タイマー終了時に通知が表示されます
          </li>
          <li>
            <strong>アプリとして使用:</strong> ホーム画面に追加して、ネイティブアプリのように使用できます
          </li>
        </ol>
      </div>
      
      {/* ヒントとコツのセクション */}
      <h3 className="text-lg font-semibold mt-4 mb-2">💡 ヒントとコツ</h3>
      
      <div className="pl-4 mb-3 space-y-2 text-sm text-gray-700">
        <p>
          <strong>・ポモドーロテクニック:</strong> 25分間の集中作業と5分間の休憩を交互に繰り返すことで、脳の集中力を維持します。
        </p>
        <p>
          <strong>・優先度設定:</strong> 「緊急」と「高」優先度のタスクを先に終わらせましょう。「低」優先度のタスクは時間に余裕があるときに取り組みます。
        </p>
        <p>
          <strong>・天気の活用:</strong> AIの天気に基づいた提案を活用して、その日の環境に最適な活動を選びましょう。
        </p>
        <p>
          <strong>・定期的な振り返り:</strong> 完了したタスクの統計を確認して、自分の生産性パターンを把握しましょう。
        </p>
        <p>
          <strong>・オフラインでの使用:</strong> PWAとしてインストールすると、インターネット接続が不安定な環境でも利用できます。
        </p>
      </div>
      
      {/* トラブルシューティングのセクション */}
      <h3 className="text-lg font-semibold mt-4 mb-2">⚙️ トラブルシューティング</h3>
      
      <div className="pl-4 mb-3 space-y-2 text-sm text-gray-700">
        <p>
          <strong>・アラーム音が鳴らない:</strong> ポモドーロタブの「アラーム音をテスト」ボタンをクリックして、ブラウザの音声再生権限を有効にしてください。
        </p>
        <p>
          <strong>・通知が表示されない:</strong> ブラウザの通知設定で、このサイトからの通知を「許可」に設定してください。
        </p>
        <p>
          <strong>・BGMが再生されない:</strong> BGMタブで再生ボタンをクリックして、ブラウザのオーディオ設定を確認してください。
        </p>
        <p>
          <strong>・PWAがインストールできない:</strong> ブラウザがPWAに対応しているか確認してください。iOSではSafari、AndroidではChromeを推奨します。
        </p>
        <p>
          <strong>・メール認証メールが届かない:</strong> 迷惑メールフォルダを確認し、認証に関するメールがフィルタリングされていないか確認してください。
        </p>
        <p>
          <strong>・スマホでゲームが早すぎる:</strong> v1.5.1でスマホ向けのフレームレート調整を行いました。問題が続く場合は設定を確認してください。
        </p>
      </div>
      
      {/* 更新履歴セクション */}
      <h3 className="text-lg font-semibold mt-4 mb-2">🔄 更新履歴</h3>

      {/* 最新バージョン v1.5.1 */}
      <div className="pl-4 mb-3">
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <p className="font-medium">v1.5.1</p>
            <ul className="list-disc pl-5">
              <li>🎮 スマホでのゲームセンターの動作速度を最適化</li>
              <li>📱 スネークゲームとテトリスのフレームレート調整（スマホ：デスクトップより遅く設定）</li>
              <li>🕹️ スマホ用タッチコントロールの応答性改善</li>
              <li>⚡ 記憶ゲームと反応速度ゲームのタイミング調整</li>
              <li>🔧 デバイス判定ロジックの改善</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 過去のバージョン */}
      <div className="pl-4 mb-3">
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <p className="font-medium">v1.5.0</p>
            <ul className="list-disc pl-5">
              <li>💎 ポイントシステム：タスク完了でポイント獲得</li>
              <li>🎁 ログインボーナス：連続ログインで特典</li>
              <li>📝 サブタスク：大きなタスクを細かく分割</li>
              <li>📄 メモ機能：タスクに詳細を追加</li>
              <li>🎮 ゲームセンター：ミニゲーム集</li>
              <li>🔄 データ移行システム：既存ユーザーの自動移行</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="pl-4 mb-3">
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <p className="font-medium">v1.4.0</p>
            <ul className="list-disc pl-5">
              <li>PWA（Progressive Web App）対応：ホーム画面に追加して本格的アプリとして使用可能に</li>
              <li>メールアドレスとパスワードによるユーザー登録/ログイン機能の追加</li>
              <li>デスクトップビューのレイアウト改善</li>
              <li>アプリインストールガイドの追加</li>
              <li>完了したタスクの自動削除機能を追加（完了から1週間後）</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="pl-4 mb-3">
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <p className="font-medium">v1.3.1</p>
            <ul className="list-disc pl-5">
              <li>iOSダークモード時のテキスト表示問題を修正</li>
              <li>天気データの統合サービスを実装し、タスク提案とダッシュボードの天気表示を同期</li>
              <li>天気に基づくタスク提案の精度向上（霧、嵐などの天気状態に対応）</li>
              <li>天気データキャッシュ機能の追加によるパフォーマンス改善</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="pl-4 mb-3">
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <p className="font-medium">v1.3.0</p>
            <ul className="list-disc pl-5">
              <li>UIの大幅改善</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* その他の過去のバージョン */}
      <div className="pl-4 mb-3">
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <p className="font-medium">v1.2.2</p>
            <ul className="list-disc pl-5">
              <li>スマホでのタッチ操作性向上</li>
              <li>レスポンシブデザインの改善</li>
              <li>ポモドーロタイマーの安定性向上</li>
            </ul>
          </div>
          
          <div>
            <p className="font-medium">v1.2.1</p>
            <ul className="list-disc pl-5">
              <li>Googleログインでの認証問題修正</li>
              <li>タスクの自動保存機能改善</li>
              <li>AIタスク提案の精度向上</li>
            </ul>
          </div>
          
          <div>
            <p className="font-medium">v1.2.0</p>
            <ul className="list-disc pl-5">
              <li>天気に基づくタスク提案機能の追加</li>
              <li>AI優先度自動設定機能の改善</li>
              <li>ダッシュボードの天気情報表示</li>
              <li>BGMプレイヤーの追加</li>
            </ul>
          </div>
          
          <div>
            <p className="font-medium">v1.1.0</p>
            <ul className="list-disc pl-5">
              <li>ポモドーロタイマー機能の追加</li>
              <li>アラーム音とバックグラウンド動作対応</li>
              <li>統計ダッシュボードの追加</li>
              <li>デッドライン管理機能の強化</li>
            </ul>
          </div>
          
          <div>
            <p className="font-medium">v1.0.0</p>
            <ul className="list-disc pl-5">
              <li>基本的なタスク管理機能</li>
              <li>AIタスク提案機能</li>
              <li>AI優先度設定機能</li>
              <li>Googleアカウント認証</li>
              <li>ダークモード対応</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* プライバシーとセキュリティのセクション */}
      <h3 className="text-lg font-semibold mt-4 mb-2">🔒 プライバシーとセキュリティ</h3>
      
      <div className="pl-4 mb-3 space-y-2 text-sm text-gray-700">
        <p>
          <strong>・データの保護:</strong> すべてのユーザーデータはFirebaseの高セキュリティ環境で暗号化して保存されます。
        </p>
        <p>
          <strong>・個人情報:</strong> 最小限の個人情報（メールアドレス）のみを収集し、第三者と共有することはありません。
        </p>
        <p>
          <strong>・位置情報:</strong> 天気情報の取得にはIPアドレスベースの大まかな位置情報を使用しますが、正確な位置情報は収集しません。
        </p>
        <p>
          <strong>・オフライン機能:</strong> PWAとしてインストールした場合、一部の機能はオフラインでも利用できます。
        </p>
      </div>
      
      {/* 技術情報のセクション */}
      <h3 className="text-lg font-semibold mt-4 mb-2">🛠️ 技術情報</h3>
      
      <div className="pl-4 mb-3 space-y-2 text-sm text-gray-700">
        <p>
          <strong>・フロントエンド:</strong> React, TypeScript, Tailwind CSS, Framer Motion
        </p>
        <p>
          <strong>・バックエンド:</strong> Firebase (Authentication, Firestore, Hosting)
        </p>
        <p>
          <strong>・状態管理:</strong> Zustand
        </p>
        <p>
          <strong>・PWA:</strong> Service Worker, Web App Manifest
        </p>
        <p>
          <strong>・外部API:</strong> OpenWeatherMap API（天気情報取得）
        </p>
        <p>
          <strong>・対応ブラウザ:</strong> Chrome, Firefox, Safari, Edge（最新版）
        </p>
        <p>
          <strong>・モバイル対応:</strong> iOS Safari, Android Chrome
        </p>
      </div>
      
      {/* サポートと連絡先のセクション */}
      <h3 className="text-lg font-semibold mt-4 mb-2">📞 サポート</h3>
      
      <div className="pl-4 mb-3 space-y-2 text-sm text-gray-700">
        <p>
          問題やご質問がある場合は、以下のお問い合わせフォームからご連絡ください：
        </p>
        <p>
          <a 
            href={contactUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            📝 お問い合わせフォーム
          </a>
        </p>
        <p>
          フィードバックや新機能のご提案も大歓迎です。より良いアプリケーションにするために、ユーザーの皆様の声をお聞かせください。
        </p>
      </div>
      
      {/* 今後の予定のセクション */}
      <h3 className="text-lg font-semibold mt-4 mb-2">🚧 今後の開発予定</h3>
      
      <div className="pl-4 mb-3 space-y-2 text-sm text-gray-700">
        <p>
          <strong>・チーム機能:</strong> 複数人でのタスク共有とコラボレーション機能
        </p>
        <p>
          <strong>・カレンダー連携:</strong> Google カレンダーとの同期機能
        </p>
        <p>
          <strong>・より高度なAI:</strong> 個人の習慣学習と予測機能の向上
        </p>
        <p>
          <strong>・データエクスポート:</strong> タスクデータのCSV/PDF出力機能
        </p>
        <p>
          <strong>・カスタムテーマ:</strong> ユーザー独自のカラーテーマ設定
        </p>
        <p>
          <strong>・ウィジェット:</strong> ホーム画面での簡易タスク表示
        </p>
        <p>
          <strong>・音声入力:</strong> 音声でのタスク追加機能
        </p>
      </div>
      
      {/* フッター情報 */}
      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600">
          進捗堂 v1.5.1 - AI搭載タスク管理・ポモドーロアプリ
        </p>
      </div>
    </div>
  );
}