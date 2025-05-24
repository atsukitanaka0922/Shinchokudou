/**
 * README内容表示コンポーネント
 * 
 * アプリケーションの使用方法、機能説明、更新履歴などを表示するコンポーネント
 * アプリのドキュメント機能として機能し、ユーザーガイドを提供します
 * v1.5.0: ゲームセンター機能を含む大幅アップデート
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
            <p className="font-medium">v1.5.0 (最新)</p>
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
      
      {/* 過去のバージョン */}
      <div className="pl-4 mb-3">
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <p className="font-medium">v1.2.2</p>
            <ul className="list-disc pl-5">
              <li>スマホ版で締め切り間近のタスクがあると動かなくなる不具合の修正</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="pl-4 mb-3">
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <p className="font-medium">v1.2.1 </p>
            <ul className="list-disc pl-5">
              <li>ポモドーロタイマーにアラーム停止ボタンを追加</li>
              <li>サウンド再生機能の信頼性向上</li>
            </ul>
          </div>
          
          <div>
            <p className="font-medium">v1.2.0 </p>
            <ul className="list-disc pl-5">
              <li>AIタスク提案機能の追加</li>
              <li>機械学習による自動優先度設定</li>
              <li>ポモドーロタイマーのサウンド修正</li>
              <li>アプリ説明（README）の追加</li>
              <li>天気に基づくタスク提案機能</li>
              <li>ロゴの追加</li>
            </ul>
          </div>
          
          <div>
            <p className="font-medium">v1.1.0</p>
            <ul className="list-disc pl-5">
              <li>タブ型UIの導入</li>
              <li>BGMプレイヤーの追加</li>
              <li>バックグラウンド実行の対応</li>
            </ul>
          </div>
          
          <div>
            <p className="font-medium">v1.0.0</p>
            <ul className="list-disc pl-5">
              <li>初回リリース</li>
              <li>基本的なタスク管理</li>
              <li>ポモドーロタイマー</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* クレジットセクション */}
      <h3 className="text-lg font-semibold mt-4 mb-2">📝 クレジット</h3>
      
      <div className="pl-4 mb-3 space-y-2 text-sm text-gray-700">
        <p><strong>開発:</strong> 田中 敦喜</p>
        <p><strong>デザイン:</strong> 田中 敦喜</p>
        <p><strong>BGM:</strong> Nightwave Plaza</p>
        <p><strong>サウンドエフェクト:</strong> 効果音ラボ、Springin'Sound Stock</p>
        <p><strong>AI機能:</strong> Claude Model by Anthropic</p>
        <p><strong>ゲーム開発:</strong> HTML5 Canvas & JavaScript</p>
        <p><strong>ホスティング:</strong> Vercel</p>
      </div>
      
      {/* お問い合わせセクション */}
      <div className="bg-blue-50 p-3 rounded-lg mt-6 mb-2 text-sm">
        <p className="font-medium text-blue-800 mb-1">🙋‍♀️ サポートが必要ですか？</p>
        <p className="text-blue-700">
          質問やフィードバックがある場合は、<a href={contactUrl} className="font-medium text-blue-600 hover:underline hover:text-blue-800 transition" target="_blank" rel="noopener noreferrer">お問い合わせフォーム</a>からご連絡ください。
        </p>
      </div>
      
      {/* フッターと著作権表示 */}
      <p className="text-center text-xs text-gray-500 mt-6">
        &copy; 2025 進捗堂 - AI搭載タスク管理＆ゲームアプリ
      </p>
    </div>
  );
}