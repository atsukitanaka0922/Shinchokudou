/**
 * README内容表示コンポーネント（習慣管理機能対応版）
 * 
 * アプリケーションの使用方法、機能説明、更新履歴などを表示するコンポーネント
 * アプリのドキュメント機能として機能し、ユーザーガイドを提供します
 * v1.7.0: 効果音システム追加、習慣管理機能追加・チェックボタン改善・ソート機能強化
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
        進捗堂 は、AI機能とゲーミフィケーションを活用した次世代のタスク管理・ポモドーロ・習慣管理アプリです。タスクや習慣の完了でポイントを獲得し、ゲームで楽しく消費することで、継続的なモチベーション維持を実現します。
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
      
      {/* 🔥 新機能: AI習慣提案機能 */}
      <h4 className="font-medium mt-3 mb-1">2. AI習慣提案</h4>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          ユーザーの過去の習慣履歴、タスクパターン、現在の天気、時間帯を総合的に分析し、パーソナライズされた習慣を提案します。継続可能な良い習慣の形成をサポートします。
        </p>
        <div className="bg-blue-50 p-2 rounded mt-2 text-xs">
          <strong>AI習慣提案の特徴:</strong>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>天気情報に基づく屋内・屋外活動の最適化</li>
            <li>時間帯（朝・昼・夕・夜）に応じた適切な習慣提案</li>
            <li>過去のタスク履歴から習慣になりやすいパターンを分析</li>
            <li>カテゴリ別（健康・学習・メンタルヘルス・生活習慣・人間関係）の提案</li>
            <li>詳細な提案理由と期待効果の説明</li>
          </ul>
        </div>
      </div>
      
      {/* AI優先度設定機能 */}
      <h4 className="font-medium mt-3 mb-1">3. AI優先度設定</h4>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          タスクの内容と締め切りを分析し、最適な優先度を自動的に設定します。優先度は「緊急」「高」「中」「低」の4段階で表示され、いつでも手動で調整できます。
        </p>
      </div>
      
      {/* 🔥 新機能: 習慣管理システム */}
      <h4 className="font-medium mt-3 mb-1">4. 習慣管理システム</h4>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          良い習慣の形成と継続をサポートする包括的な習慣管理機能です。小さな習慣の積み重ねで大きな変化を実現できます。
        </p>
        <div className="bg-green-50 p-2 rounded mt-2 text-xs">
          <strong>習慣管理の機能:</strong>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li><strong>頻度設定:</strong> 毎日・毎週・毎月の柔軟な実行頻度</li>
            <li><strong>リマインダー:</strong> 指定時刻での習慣実行のお知らせ</li>
            <li><strong>ストリーク管理:</strong> 連続実行日数の記録と表示</li>
            <li><strong>完了率統計:</strong> 習慣ごとの達成率の可視化</li>
            <li><strong>進捗バー:</strong> アニメーション付きの進捗表示</li>
            <li><strong>7日間カレンダー:</strong> 最近の実行状況をミニカレンダーで確認</li>
            <li><strong>習慣警告:</strong> 20時頃の未完了習慣のリマインダー表示</li>
          </ul>
        </div>
      </div>
      
      {/* ポイントシステム */}
      <h4 className="font-medium mt-3 mb-1">5. ポイントシステム</h4>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          タスクや習慣の完了、ログインボーナスでポイントを獲得できます。獲得したポイントはゲームセンターでのプレイやショップでのテーマ購入に使用でき、モチベーション維持に役立ちます。
        </p>
      </div>
      
      {/* ゲームセンター */}
      <h4 className="font-medium mt-3 mb-1">6. ゲームセンター</h4>
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
      <h4 className="font-medium mt-3 mb-1">7. フローティングポモドーロタイマー</h4>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          ポモドーロテクニックを活用した集中管理ツールです。25分の作業と5分の休憩を繰り返すサイクルで、効率的に作業を進められます。v1.6.0からフローティング機能を追加し、ゲーム中でも継続動作します。
        </p>
        <div className="bg-gray-50 p-2 rounded mt-2 text-xs">
          <strong>使い方:</strong>
          <ol className="list-decimal pl-5 space-y-1 mt-1">
            <li>タスクリストの「⏳」ボタンをクリックしてポモドーロを開始</li>
            <li>フローティングタイマーが画面上に表示されます</li>
            <li>ドラッグで好きな位置に移動可能</li>
            <li>25分間集中して作業に取り組む</li>
            <li>タイマーが終了するとアラーム音でお知らせ</li>
            <li>「🔕 アラームを停止」ボタンでアラームを止められます</li>
            <li>5分間の休憩（ゲーム中でもタイマー継続）</li>
            <li>サイクルを繰り返して生産性を高める</li>
          </ol>
          <p className="mt-2 text-orange-600">
            <strong>【重要】アラーム音について：</strong> ブラウザのセキュリティ設定により、サウンドを再生するには事前のユーザー操作が必要です。初回利用時はポモドーロタブの「アラーム音をテスト」ボタンをクリックして、音が正常に鳴ることを確認してください。
          </p>
        </div>
      </div>
      
      {/* サブタスクとメモ機能 */}
      <h4 className="font-medium mt-3 mb-1">8. サブタスクとメモ機能</h4>
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
      <h4 className="font-medium mt-3 mb-1">9. 天気に基づいたタスク・習慣提案</h4>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          現在の天気状況（晴れ・雨・雪など）、気温、湿度に基づいて最適なタスクや習慣を提案します。天気関連の提案は青い背景で表示され、環境に配慮した効率的な活動をサポートします。
        </p>
      </div>
      
      {/* BGMプレイヤー機能 */}
      <h4 className="font-medium mt-3 mb-1">10. BGMプレイヤー</h4>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          作業に集中するための環境音楽プレイヤーです。Vaporwave風の落ち着いたインターネットラジオを提供しています。画面右下の「🎵」ボタンからアクセスできます。
        </p>
      </div>
      
      {/* デッドライン管理機能 */}
      <h4 className="font-medium mt-3 mb-1">11. デッドライン管理</h4>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          期限が近づいているタスクを自動的に検出し、通知します。期限切れや期限間近のタスクは画面上部に警告表示されます。
        </p>
      </div>
      
      {/* ポイントショップ機能 */}
      <h4 className="font-medium mt-3 mb-1">12. ポイントショップ</h4>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          獲得したポイントで美しいグラデーション背景テーマを購入できます。4段階のレアリティ（コモン・レア・エピック・レジェンダリー）があり、アプリをカスタマイズできます。
        </p>
      </div>
      
      {/* PWA機能 */}
      <h4 className="font-medium mt-3 mb-1">13. PWA対応</h4>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          進捗堂はPWA（Progressive Web App）に対応しています。ホーム画面に追加すると、アプリのようにオフラインでも利用できます。ブラウザのインストールオプションを使用するか、「共有」→「ホーム画面に追加」で利用できます。
        </p>
      </div>
      
      {/* 🔥 新機能: 効果音システム */}
      <h4 className="font-medium mt-3 mb-1">15. 効果音システム</h4>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          タスクや習慣の完了時に心地よい効果音を再生する機能です。達成感を高め、モチベーション維持に役立ちます。
        </p>
        <div className="bg-orange-50 p-2 rounded mt-2 text-xs">
          <strong>効果音の機能:</strong>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li><strong>タスク完了音:</strong> メインタスク完了時の満足感のある効果音</li>
            <li><strong>サブタスク完了音:</strong> サブタスク達成時の軽快な効果音</li>
            <li><strong>習慣完了音:</strong> 習慣継続時の達成感のある効果音</li>
            <li><strong>音量調整:</strong> 0-100%での細かな音量設定</li>
            <li><strong>有効/無効切り替え:</strong> 効果音のON/OFF設定</li>
            <li><strong>テスト再生:</strong> 設定画面で各効果音の試聴が可能</li>
            <li><strong>自動保存:</strong> 設定はローカルストレージに永続化</li>
          </ul>
          <p className="mt-2 text-orange-600">
            <strong>【アクセス方法】:</strong> 右下のフローティングメニュー → 🔊効果音設定ボタンから設定画面にアクセスできます。
          </p>
        </div>
      </div>
      <div className="pl-4 mb-3">
        <p className="text-sm text-gray-700">
          タスクと習慣を効率的に管理するための並び替え・絞り込み機能です。自分の使いやすい方法で整理できます。
        </p>
        <div className="bg-purple-50 p-2 rounded mt-2 text-xs">
          <strong>ソート機能:</strong>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li><strong>名前順:</strong> アルファベット・あいうえお順での並び替え</li>
            <li><strong>ストリーク順:</strong> 習慣の連続実行日数での並び替え</li>
            <li><strong>時間順:</strong> リマインダー時刻での並び替え</li>
            <li><strong>完了率順:</strong> 習慣の達成率での並び替え</li>
            <li><strong>昇順・降順:</strong> ワンクリックで順序を逆転</li>
          </ul>
          <strong>フィルタ機能:</strong>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li><strong>すべて:</strong> 全ての項目を表示</li>
            <li><strong>完了済み:</strong> 今日完了した項目のみ表示</li>
            <li><strong>未完了:</strong> まだ完了していない項目のみ表示</li>
          </ul>
        </div>
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
            <strong>🔥 習慣追加:</strong> 習慣管理タブから「新しい習慣」ボタンで習慣を作成します
          </li>
          <li>
            <strong>AIの提案活用:</strong> AIタスク提案・AI習慣提案セクションから提案された項目を追加できます
          </li>
          <li>
            <strong>タスク・習慣管理:</strong> 完了チェック、優先度変更、締め切り設定、サブタスクの追加が可能です
          </li>
          <li>
            <strong>ポイント獲得:</strong> タスクや習慣を完了してポイントを貯めましょう
          </li>
          <li>
            <strong>ゲームプレイ:</strong> ゲームセンタータブで獲得したポイントを使ってゲームを楽しめます
          </li>
          <li>
            <strong>テーマカスタマイズ:</strong> ショップタブでポイントを使ってアプリの背景をカスタマイズできます
          </li>
          <li>
            <strong>ポモドーロ活用:</strong> タスクの「⏳」ボタンをクリックしてフローティングポモドーロを開始します
          </li>
          <li>
            <strong>通知設定:</strong> ブラウザの通知許可を「許可」に設定すると、タイマー終了時や習慣リマインダーが表示されます
          </li>
          <li>
            <strong>🔥 効果音設定:</strong> フローティングメニューの🔊効果音設定で効果音の有効/無効・音量を調整できます
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
          <strong>・🔥 習慣の継続:</strong> 小さな習慣から始めて徐々に大きくする。ストリークを意識して継続モチベーションを維持しましょう。
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
          <strong>・🔥 ソート機能活用:</strong> 習慣はストリーク順、タスクは優先度順など、状況に応じてソート方法を変更しましょう。
        </p>
        <p>
          <strong>・🔥 効果音活用:</strong> 効果音を有効にすることで、タスクや習慣完了時の達成感が向上し、継続モチベーションが高まります。
        </p>
        <p>
          <strong>・定期的な振り返り:</strong> 完了したタスクと習慣の統計を確認して、自分の生産性パターンを把握しましょう。
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
          <strong>・🔥 効果音が再生されない:</strong> フローティングメニューの🔊効果音設定で効果音が有効になっているか確認。テスト再生ボタンでブラウザの音声権限を確認してください。
        </p>
        <p>
          <strong>・アラーム音が鳴らない:</strong> ポモドーロタブの「アラーム音をテスト」ボタンをクリックして、ブラウザの音声再生権限を有効にしてください。
        </p>
        <p>
          <strong>・通知が表示されない:</strong> ブラウザの通知設定で、このサイトからの通知を「許可」に設定してください。
        </p>
        <p>
          <strong>・🔥 習慣が追加できない:</strong> ログイン状態を確認し、習慣名が入力されているか確認してください。エラーが続く場合はページを再読み込みしてください。
        </p>
        <p>
          <strong>・🔥 習慣完了がチェックできない:</strong> チェックボタンに明確な枠線を表示しているので、枠のある円形ボタンをクリックしてください。
        </p>
        <p>
          <strong>・BGMが再生されない:</strong> BGMタブで再生ボタンをクリックして、ブラウザのオーディオ設定を確認してください。
        </p>
        <p>
          <strong>・ゲームが開始できない:</strong> ポイント残高を確認してください。リトライも含めて1回5ポイント必要です。
        </p>
        <p>
          <strong>・ポイントが反映されない:</strong> タスクや習慣を完了してもポイントが増えない場合は、ページを再読み込みしてください。
        </p>
        <p>
          <strong>・PWAがインストールできない:</strong> ブラウザがPWAに対応しているか確認してください。iOSではSafari、AndroidではChromeを推奨します。
        </p>
        <p>
          <strong>・メール認証メールが届かない:</strong> 迷惑メールフォルダを確認し、認証に関するメールがフィルタリングされていないか確認してください。
        </p>
        <p>
          <strong>・🔥 Firebase権限エラー:</strong> 習慣データの読み込み・書き込みでエラーが出る場合は、一度ログアウトして再ログインを試してください。
        </p>
      </div>
      
      {/* 更新履歴セクション */}
      <h3 className="text-lg font-semibold mt-4 mb-2">🔄 更新履歴</h3>

      {/* 最新バージョン v1.7.0 */}
      <div className="pl-4 mb-3">
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <p className="font-medium text-blue-600">v1.7.0 (最新) - 🔊 効果音システム追加アップデート</p>
            <ul className="list-disc pl-5">
              <li><strong>🔊 効果音機能の実装:</strong> タスク・サブタスク・習慣完了時の心地よい効果音再生</li>
              <li><strong>🎵 3種類の効果音:</strong> タスク・サブタスク・習慣それぞれに専用の効果音</li>
              <li><strong>🎛️ 効果音設定UI:</strong> フローティングメニューから効果音の有効/無効・音量調整</li>
              <li><strong>🎧 テスト再生機能:</strong> 設定画面で各効果音の試聴が可能</li>
              <li><strong>💾 自動設定保存:</strong> ローカルストレージに効果音設定を永続化</li>
              <li><strong>🔧 エラーハンドリング:</strong> ブラウザの音声制限に対応した適切な再生制御</li>
              <li><strong>⚡ プリロード機能:</strong> ページ読み込み時に効果音ファイルを事前読み込み</li>
              <li><strong>🎯 AudioServiceクラス:</strong> シングルトンパターンによる効率的な音声管理</li>
              <li><strong>🔄 React Hook:</strong> useAudioSettingsでコンポーネント間での設定共有</li>
              <li><strong>📦 音声キャッシュ:</strong> HTMLAudioElementのキャッシュ機能でパフォーマンス向上</li>
            </ul>
          </div>
        </div>
      </div>

      {/* v1.6.0 */}
      <div className="pl-4 mb-3">
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <p className="font-medium text-green-600">v1.7.0 - � 効果音システム追加</p>
            <ul className="list-disc pl-5">
              <li><strong>🛍️ ポイントショップ新登場：</strong>グラデーション背景テーマ購入</li>
              <li><strong>🎨 テーマシステム：</strong>4段階レアリティの美しい背景</li>
              <li><strong>⏱️ フローティングポモドーロタイマー：</strong>ゲーム中でも継続動作</li>
              <li><strong>📊 タスクソート機能強化：</strong>複数条件での並び替え</li>
              <li><strong>💫 UI/UXアニメーション追加：</strong>スムーズなユーザー体験</li>
              <li><strong>🔄 習慣管理システム:</strong> 包括的な習慣形成・継続管理機能</li>
              <li><strong>🤖 AI習慣提案:</strong> 天気・時間帯・履歴に基づくパーソナライズ提案</li>
              <li><strong>📊 習慣統計:</strong> ストリーク・完了率・7日間アクティビティの可視化</li>
              <li><strong>⏰ 習慣リマインダー:</strong> 20時頃の未完了習慣警告システム</li>
              <li><strong>🔐 セキュリティ強化:</strong> Firestore習慣データの包括的保護</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="pl-4 mb-3">
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <p className="font-medium">v1.5.1 - スマートフォン最適化</p>
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
            </ul>
          </div>
        </div>
      </div>

      <div className="pl-4 mb-3">
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <p className="font-medium">v1.5.0 - ゲームセンター機能</p>
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
            </ul>
          </div>
        </div>
      </div>

      <div className="pl-4 mb-3">
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <p className="font-medium">v1.4.0 - PWA対応</p>
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
            <p className="font-medium">v1.3.1 - 天気機能強化</p>
            <ul className="list-disc pl-5">
              <li>iOSダークモード時のテキスト表示問題を修正</li>
              <li>天気データの統合サービスを実装し、タスク提案とダッシュボードの天気表示を同期</li>
              <li>天気に基づくタスク提案の精度向上</li>
              <li>天気データキャッシュ機能の追加によるパフォーマンス改善</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="pl-4 mb-3">
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <p className="font-medium">v1.3.0 - AI機能強化</p>
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
            <p className="font-medium">v1.2.0 - AI提案システム</p>
            <ul className="list-disc pl-5">
              <li>AIタスク提案機能追加</li>
              <li>機械学習による自動優先度設定</li>
              <li>天気に基づくタスク提案機能</li>
              <li>ポモドーロタイマーのサウンド修正</li>
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
            <p className="font-medium">v1.1.0 - ポモドーロ機能</p>
            <ul className="list-disc pl-5">
              <li>タブ型UIの導入</li>
              <li>BGMプレイヤーの追加</li>
              <li>バックグラウンド実行の対応</li>
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
            <p className="font-medium">v1.0.0 - 初回リリース</p>
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
        <p>
          <strong>・🔥 習慣管理:</strong> Firebase Firestore, リアルタイム同期, セキュリティルール
        </p>
        <p>
          <strong>・🎵 BGM:</strong> Nightwave Plaza
        </p>
        <p>
          <strong>・🔊 効果音:</strong> 効果音ラボ、Springin'Sound Stock
        </p>
        <p>
          <strong>・AI機能:</strong> 機械学習アルゴリズム, 天気API連携, パターン分析
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
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700">
            <strong>開発者からのメッセージ:</strong> 進捗堂をご利用いただき、ありがとうございます！v1.7.0で効果音システムを追加し、タスクや習慣の完了時により一層の達成感を得られるようになりました。心地よい効果音で継続的なモチベーション維持をサポートします。皆様のフィードバックにより、今後もより良いアプリに進化していきます。継続的な成長と良い習慣形成を一緒に実現しましょう！
          </p>
        </div>
      </div>
      
      {/* フッター */}
      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          進捗堂 v1.7.0 - AI搭載タスク管理・習慣管理・ゲームアプリ
        </p>
        <p className="text-xs text-gray-400 mt-1">
          � 効果音システム追加 | �🔄 習慣管理機能 | 📱 PWA対応 | ⚡ 60FPS対応 | 🎨 テーマカスタマイズ
        </p>
        <p className="text-xs text-gray-400 mt-1">
          © 2025 進捗堂 - 継続的な成長をサポートする生産性アプリ
        </p>
      </div>
    </div>
  );
}