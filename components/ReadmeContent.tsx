/**
 * README内容表示コンポーネント
 * 
 * アプリケーションの使用方法、機能説明、更新履歴などを表示するコンポーネント
 * アプリのドキュメント機能として機能し、ユーザーガイドを提供します
 * v1.5.1: スマホゲーム動作速度問題修正・レスポンシブデザイン対応
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
        進捗堂 は、AI機能とゲーミフィケーションを活用した次世代のタスク管理・ポモドーロアプリです。タスク完了でポイントを獲得し、ゲームで楽しく消費することで、継続的なモチベーション維持を実現します。
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
      
      {/* ポイントシステム */}
      <h4 className="font-medium mt-3 mb-1">3. ポイントシステム</h4>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          タスク完了やログインボーナスでポイントを獲得できます。獲得したポイントはゲームセンターでのプレイに使用でき、モチベーション維持に役立ちます。
        </p>
        <div className="bg-gray-50 p-2 rounded mt-2 text-xs">
          <strong>ポイント獲得方法:</strong>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>高優先度タスク完了: 15ポイント</li>
            <li>中優先度タスク完了: 10ポイント</li>
            <li>低優先度タスク完了: 5ポイント</li>
            <li>サブタスク完了: 3ポイント</li>
            <li>ログインボーナス: 10-50ポイント（連続日数に応じて）</li>
          </ul>
        </div>
      </div>
      
      {/* ゲームセンター */}
      <h4 className="font-medium mt-3 mb-1">4. ゲームセンター</h4>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          獲得したポイントでミニゲームを楽しめます。1回のプレイに5ポイント必要で、スコアは自動的に記録・統計されます。
        </p>
        <div className="bg-gray-50 p-2 rounded mt-2 text-xs">
          <strong>利用可能なゲーム:</strong>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li><strong>🦕 ディノラン:</strong> Chromeの恐竜ゲーム風アクションゲーム。ジャンプで障害物を避けてスコアを稼ごう</li>
            <li><strong>🐦 フラッピーバード:</strong> 鳥を操作してパイプの隙間を通り抜けるスキルゲーム</li>
          </ul>
          <p className="mt-2 text-orange-600">
            <strong>【重要】:</strong> リトライも新規プレイ扱いで5ポイント消費されます。ポイント不足時はプレイできません。
          </p>
          <p className="mt-1 text-blue-600">
            <strong>【v1.5.1で改善】:</strong> スマートフォンでのゲーム動作速度を最適化し、画面サイズに応じたレスポンシブデザインを実装しました。ディノランでの表示位置問題とフラッピーバードでの誤操作問題も解決済みです。より快適にプレイできます！
          </p>
        </div>
      </div>
      
      {/* ポモドーロタイマー機能 */}
      <h4 className="font-medium mt-3 mb-1">5. ポモドーロタイマー</h4>
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
      
      {/* サブタスクとメモ機能 */}
      <h4 className="font-medium mt-3 mb-1">6. サブタスクとメモ機能</h4>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          大きなタスクを細かいサブタスクに分割して管理できます。また、各タスクにはマークダウン対応のメモを追加できます。
        </p>
        <div className="bg-gray-50 p-2 rounded mt-2 text-xs">
          <strong>機能詳細:</strong>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li><strong>サブタスク:</strong> 無制限に追加可能、個別に完了マークが可能</li>
            <li><strong>進捗表示:</strong> メインタスクの進捗バーでサブタスク完了状況を可視化</li>
            <li><strong>メモ機能:</strong> マークダウン記法対応で詳細な説明や手順を記録</li>
            <li><strong>見積もり時間:</strong> タスクの所要時間を事前に設定可能</li>
          </ul>
        </div>
      </div>
      
      {/* 天気ベースのタスク提案機能 */}
      <h4 className="font-medium mt-3 mb-1">7. 天気に基づいたタスク提案</h4>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          現在の天気状況（晴れ・雨・雪など）、気温、湿度に基づいて最適なタスクを提案します。天気関連のタスクは青い背景で表示され、環境に配慮した効率的な活動をサポートします。
        </p>
      </div>
      
      {/* BGMプレイヤー機能 */}
      <h4 className="font-medium mt-3 mb-1">8. BGMプレイヤー</h4>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          作業に集中するための環境音楽プレイヤーです。Vaporwave風の落ち着いたインターネットラジオを提供しています。画面右下の「🎵」ボタンからアクセスできます。
        </p>
      </div>
      
      {/* デッドライン管理機能 */}
      <h4 className="font-medium mt-3 mb-1">9. デッドライン管理</h4>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          期限が近づいているタスクを自動的に検出し、通知します。期限切れや期限間近のタスクは画面上部に警告表示されます。
        </p>
      </div>
      
      {/* PWA機能 */}
      <h4 className="font-medium mt-3 mb-1">10. PWA対応</h4>
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
            <strong>タスク管理:</strong> タスクの完了、優先度変更、締め切り設定、サブタスクの追加が可能です
          </li>
          <li>
            <strong>ポイント獲得:</strong> タスクを完了してポイントを貯めましょう
          </li>
          <li>
            <strong>ゲームプレイ:</strong> ゲームセンタータブで獲得したポイントを使ってゲームを楽しめます
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
          <strong>・ポイント効率:</strong> 高優先度のタスクを優先して完了すると、より多くのポイントを獲得できます。
        </p>
        <p>
          <strong>・ゲーム戦略:</strong> リトライは新規プレイ扱いで5ポイント消費されるため、集中してプレイしましょう。
        </p>
        <p>
          <strong>・サブタスク活用:</strong> 大きなタスクは細かく分けることで達成感を得やすくなり、ポイントも多く獲得できます。
        </p>
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
        <p>
          <strong>・スマホゲーム:</strong> v1.5.1でスマートフォンでのゲーム動作とレスポンシブデザインを最適化しました。ディノランの表示問題とフラッピーバードの誤操作問題も解決済みです。快適にプレイできます！
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
          <strong>・ゲームが開始できない:</strong> ポイント残高を確認してください。リトライも含めて1回5ポイント必要です。
        </p>
        <p>
          <strong>・ゲーム動作が早すぎる（修正済み）:</strong> v1.5.1でスマートフォンでのゲーム動作速度を最適化しました。問題が解決されない場合はページを再読み込みしてください。
        </p>
        <p>
          <strong>・ゲーム画面がはみ出す（修正済み）:</strong> v1.5.1でスマートフォンの縦画面に最適化されたレスポンシブデザインを実装しました。ゲーム画面が自動的に画面サイズに調整されます。
        </p>
        <p>
          <strong>・ディノランで恐竜が見えない（修正済み）:</strong> v1.5.1で恐竜と障害物の位置計算を完全修正しました。恐竜が床をすり抜けることなく、確実に表示されるようになりました。
        </p>
        <p>
          <strong>・フラッピーバードで誤操作（修正済み）:</strong> v1.5.1でゲームオーバー後3秒間の操作無効化機能を追加しました。連打による誤操作を防げます。
        </p>
        <p>
          <strong>・ポイントが反映されない:</strong> タスクを完了してもポイントが増えない場合は、ページを再読み込みしてください。
        </p>
        <p>
          <strong>・PWAがインストールできない:</strong> ブラウザがPWAに対応しているか確認してください。iOSではSafari、AndroidではChromeを推奨します。
        </p>
        <p>
          <strong>・メール認証メールが届かない:</strong> 迷惑メールフォルダを確認し、認証に関するメールがフィルタリングされていないか確認してください。
        </p>
      </div>
      
      {/* 更新履歴セクション */}
      <h3 className="text-lg font-semibold mt-4 mb-2">🔄 更新履歴</h3>

      {/* 最新バージョン */}
      <div className="pl-4 mb-3">
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <p className="font-medium">v1.5.1 (最新)</p>
            <ul className="list-disc pl-5">
              <li>📱 スマートフォンでのゲーム動作速度問題を修正</li>
              <li>⚡ ゲームのフレームレート制御を60FPSに統一</li>
              <li>🎮 高リフレッシュレート端末でのゲーム動作を最適化</li>
              <li>🔧 タッチイベントの重複処理を防止</li>
              <li>🏃‍♂️ ディノランゲーム: 恐竜が床をすり抜ける問題を完全修正</li>
              <li>🦕 ディノランゲーム: スマホ向けサイズ・位置計算を完全修正</li>
              <li>🐦 フラッピーバードゲーム: ゲームオーバー後3秒間の操作無効化機能追加</li>
              <li>📐 レスポンシブデザイン対応：スマホの縦画面でゲーム画面が最適化</li>
              <li>📏 キャンバスサイズ自動調整：画面サイズに応じてゲーム要素のサイズを調整</li>
              <li>🎯 スマホ専用UI：タッチ操作に最適化されたゲーム説明文</li>
              <li>⏱️ リアルタイムカウントダウン：フラッピーバードでの待機時間表示</li>
              <li>🛠️ デバッグ機能：開発環境でのゲーム要素境界表示</li>
              <li>📚 ヘルプドキュメントにゲーム最適化情報を追加</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="pl-4 mb-3">
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <p className="font-medium">v1.5.0</p>
            <ul className="list-disc pl-5">
              <li>🎮 ゲームセンター機能追加：ポイント消費型ミニゲーム機能</li>
              <li>🦕 ディノランゲーム：Chromeの恐竜ゲーム風アクションゲーム</li>
              <li>🐦 フラッピーバードゲーム：パイプの隙間を通り抜けるスキルゲーム</li>
              <li>💎 ポイントシステム拡張：タスク完了、ログインボーナス、ゲーム消費の統合管理</li>
              <li>📊 ゲーム統計機能：最高スコア、プレイ回数、平均スコア、消費ポイントの記録</li>
              <li>📝 サブタスク機能：大きなタスクを細かく分割して管理</li>
              <li>📄 メモ機能：マークダウン対応のタスク詳細記録</li>
              <li>📈 拡張統計機能：タスクの複雑度計算、進捗可視化</li>
              <li>💰 ポイント取り消し機能：タスク完了取り消し時の総獲得ポイント減算</li>
              <li>🎯 見積もり時間機能：タスクの所要時間予測</li>
              <li>🔄 データ移行機能：既存タスクの新形式への自動移行</li>
              <li>📱 タブ型UI：タスク管理とゲームセンターの切り替え表示</li>
              <li>⚡ リアルタイム更新：ゲーム統計・履歴の即座反映</li>
              <li>🛡️ エラーハンドリング強化：重複処理防止、確実なデータ同期</li>
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
            <p className="font-medium">v1.3.0</p>
            <ul className="list-disc pl-5">
              <li>AI優先度自動設定機能の追加</li>
              <li>BGMプレイヤー機能の追加</li>
              <li>ポモドーロタイマーの改善</li>
              <li>UI/UXの大幅改善</li>
              <li>ログインボーナス機能の追加</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="pl-4 mb-3">
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <p className="font-medium">v1.2.0</p>
            <ul className="list-disc pl-5">
              <li>天気ベースのタスク提案機能追加</li>
              <li>デッドライン管理機能の強化</li>
              <li>ポイントシステムの基盤実装</li>
              <li>タスク統計機能の追加</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="pl-4 mb-3">
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <p className="font-medium">v1.1.0</p>
            <ul className="list-disc pl-5">
              <li>ポモドーロタイマー機能の追加</li>
              <li>AIタスク提案機能の初期実装</li>
              <li>Firebase認証システムの統合</li>
              <li>レスポンシブデザインの改善</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="pl-4 mb-3">
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <p className="font-medium">v1.0.0</p>
            <ul className="list-disc pl-5">
              <li>基本的なタスク管理機能の実装</li>
              <li>優先度設定機能</li>
              <li>期限設定機能</li>
              <li>Google認証ログイン機能</li>
              <li>リアルタイムデータ同期</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* 技術情報 */}
      <h3 className="text-lg font-semibold mt-4 mb-2">🛠️ 技術情報</h3>
      
      <div className="pl-4 mb-3 space-y-2 text-sm text-gray-700">
        <p>
          <strong>・フロントエンド:</strong> Next.js, React, TypeScript, Tailwind CSS, Framer Motion
        </p>
        <p>
          <strong>・バックエンド:</strong> Firebase (Authentication, Firestore)
        </p>
        <p>
          <strong>・状態管理:</strong> Zustand
        </p>
        <p>
          <strong>・デプロイ:</strong> Vercel
        </p>
        <p>
          <strong>・PWA:</strong> Service Worker, Web App Manifest
        </p>
        <p>
          <strong>・ゲーム:</strong> HTML5 Canvas, RequestAnimationFrame
        </p>
      </div>
      
      {/* お問い合わせ */}
      <h3 className="text-lg font-semibold mt-4 mb-2">📞 お問い合わせ</h3>
      
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700 mb-2">
          アプリの不具合報告、機能要望、その他のお問い合わせは以下のフォームからお願いします。
        </p>
        <a 
          href={contactUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
        >
          📝 お問い合わせフォーム
        </a>
      </div>
      
      {/* フッター */}
      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          進捗堂 v1.5.1 - AI搭載タスク管理＆ゲームアプリ
        </p>
        <p className="text-xs text-gray-400 mt-1">
          🎮 スマートフォン最適化完了 | 📱 PWA対応 | ⚡ 60FPS対応
        </p>
      </div>
    </div>
  );
}