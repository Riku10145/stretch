# ストレッチタイマー

ワーク（運動）と休憩を繰り返すストレッチ用インターバルタイマー。
React + TypeScript + Next.js（App Router）で構築しています。

## 機能

- ワーク／休憩の自動切り替えとカウントダウン
- Web Audio API によるビープ音（開始・カウントダウン・フェーズ切替・完了）
- メニュー一覧表示と現在地のハイライト
- Picture-in-Picture（PiP）でのタイマー表示
- 完了後の X（Twitter）シェア

## 開発

```bash
npm install
npm run dev      # 開発サーバー（http://localhost:3000）
npm run build    # 本番ビルド
npm run start    # 本番サーバー
npm run lint     # ESLint
```

## 構成

```
app/                     # Next.js App Router
  layout.tsx             # ルートレイアウト / メタデータ
  page.tsx               # トップページ
  globals.css            # グローバルスタイル
components/               # プレゼンテーション層（React コンポーネント）
  StretchTimer.tsx       # 全体を束ねるコンテナ
  TimerDisplay.tsx       # ステータス見出し + タイマー表示
  Controls.tsx           # 各種操作ボタン
  ExerciseList.tsx       # メニュー一覧
  PiPSurface.tsx         # PiP 用の canvas / video
hooks/                   # ロジック層（カスタムフック）
  useStretchTimer.ts     # タイマー本体の状態管理
  usePictureInPicture.ts # PiP の描画・開始終了
lib/                     # ドメイン / ユーティリティ
  config.ts              # メニューや時間の設定
  constants.ts           # 音の周波数・UI 状態クラス
  types.ts               # 型定義
  session.ts             # フェーズ遷移・tick・ビープ判定（純粋関数）
  audioPlayer.ts         # Web Audio ラッパー
  display.ts             # 表示文字列・状態クラス・ボタン表示の導出（純粋関数）
  share.ts               # シェア処理
```

## 設計メモ

- タイマーの実時間カウントは `useStretchTimer` 内の `engineRef`（ミュータブルな
  真の状態）で保持し、各 tick で React state に反映して再描画します。`delta`
  ベースで残り時間を計算するため、タブ非アクティブ時のズレに強い構成です。
- 表示用の文字列・状態クラスは `lib/display.ts` の純粋関数に集約し、画面表示と
  PiP canvas の描画で共有しています。
