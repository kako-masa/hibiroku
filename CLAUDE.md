# ひびろく (hibiroku) — Claude Code 指示書

## プロジェクト概要

日々の記録アプリ。React + Vite で構築し、Firebase (Firestore + Google認証) でクラウド同期、Vercel にデプロイ。

## 開発コマンド

```bash
npm run dev      # 開発サーバー起動 (http://localhost:5173)
npm run build    # 本番ビルド
npm run preview  # ビルド結果のプレビュー
npm run lint     # ESLint チェック
```

## ファイル構成

```
src/
  App.jsx              # ルートコンポーネント。状態管理・認証・保存ロジックを担う
  constants.js         # 定数・ユーティリティ関数 (C, SHIFTS, MOODS, TABS, WJ, WE, d2s, pad, tagColor, lsGet, save)
  firebase.js          # Firebase 初期化・auth
  firestoreService.js  # Firestore の read/write (loadAllData, saveToFirestore, migrateFromLocalStorage)
  components/
    DailyPage.jsx      # 日記タブ (メインページ)
    ShiftPage.jsx      # シフト管理 + 買い物リスト
    GoalPage.jsx       # 目標管理
    HistoryPage.jsx    # 履歴閲覧・週次振り返り
    GraphPage.jsx      # データグラフ
    LearningPage.jsx   # 学習記録
    MiniCalendar.jsx   # 共通ミニカレンダー
    ReviewSection.jsx  # 振り返りセクション
    WeeklyReviewSection.jsx  # 週次振り返り
api/
  # Vercel Serverless Functions (本番用 AI API エンドポイント)
```

## 状態管理

状態はすべて `App.jsx` で管理し、`state` / `actions` オブジェクトとして各ページコンポーネントに props で渡す。

| state キー      | localStorage キー  | Firestore ドキュメント       | 型       |
|----------------|--------------------|------------------------------|----------|
| `rec`          | `hbr-rec`          | `users/{uid}/data/rec`       | object   |
| `sh`           | `hbr-sh`           | `users/{uid}/data/sh`        | object   |
| `goals`        | `hbr-goals`        | `users/{uid}/data/goals`     | array    |
| `learn`        | `hbr-learn`        | `users/{uid}/data/learn`     | array    |
| `shTodos`      | `hbr-sh-todos`     | `users/{uid}/data/settings`  | array    |
| `shopping`     | `hbr-shopping`     | `users/{uid}/data/settings`  | array    |
| `weeklyReviews`| `hbr-weekly`       | `users/{uid}/data/weekly`    | array    |

## データ保存の仕組み

- **デュアル保存**: 変更はまず localStorage に即時（debounce 500ms）保存し、その後 Firestore にも保存（debounce 1500ms）
- ログイン時に Firestore が空なら localStorage から自動マイグレーション
- 各 `update*` 関数（`updateRec`, `updateGoals` など）を通じてのみ状態を更新する

## 日付フォーマット

日付は常に `"YYYY-MM-DD"` 文字列で扱う。`d2s(dateObj)` で変換、`new Date(ds.replace(/-/g, '/'))` で復元。

## スタイル規約

- カラーパレットは `constants.js` の `C` オブジェクトから参照する（例: `C.leather`, `C.ink`）
- インラインスタイルを使用（CSS Modules や Tailwind は使わない）
- ノートブック風のアナログデザインが基調

## AI 機能

- 開発時: `vite.config.js` の dev ミドルウェアが `/api/ai` を処理
- 本番時: `api/` 配下の Vercel Serverless Functions が処理
- モデル: `claude-haiku-4-5-20251001`
- API キーは `.env` の `ANTHROPIC_API_KEY` に設定

## 注意事項

- `goals`, `learn`, `weekly` は Firestore に `{ items: [...] }` 形式で保存
- `shTodos`, `shopping` は Firestore の `settings` ドキュメントに merge で保存
- `rec`, `sh` は日付キーのオブジェクトとしてそのまま保存
