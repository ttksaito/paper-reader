# Paper Reader

iPad向け英語論文PDFリーダー Webアプリ

## 概要

Paper Readerは、iPad上で英語論文を効率的に閲覧・読解・整理するためのWebアプリです。Apple Pencilを使用してPDFに直接書き込み、マーカー、下線、手書きメモなどを行えます。

## 主な機能（MVP）

- **PDF表示**: PDF.jsを使用したPDF閲覧
- **Apple Pencil対応**: ペン、マーカー、消しゴム機能
- **左右分割レイアウト**: PDFとノートの同時表示
- **テキスト選択・翻訳**: 英文を選択して日本語訳を表示
- **ノート機能**: 論文ごとのノート作成と自動保存
- **Library機能**: 複数論文の管理と検索
- **PWA対応**: ホーム画面から独立したアプリとして起動

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **PDF処理**: PDF.js, react-pdf
- **データベース**: Supabase (PostgreSQL + Storage)
- **ローカルキャッシュ**: IndexedDB

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、Supabaseの設定を追加します：

```bash
cp .env.local.example .env.local
```

`.env.local`を編集して、Supabaseの認証情報を設定してください。

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### 4. ビルド

```bash
npm run build
```

### 5. 本番環境の起動

```bash
npm start
```

## プロジェクト構造

```
paper-reader/
├── app/              # Next.js App Router
├── components/       # Reactコンポーネント
│   ├── pdf/         # PDF表示関連
│   ├── library/     # Library画面
│   ├── reader/      # Reader画面
│   └── notes/       # Notes機能
├── lib/             # ユーティリティ
├── types/           # TypeScript型定義
└── public/          # 静的ファイル
```

## 開発優先順位

1. PDF表示機能の実装
2. Apple Pencil対応と描画機能
3. Notes機能
4. 英語論文読解支援機能
5. Library画面
6. データ保存（Supabase）
7. PWA対応
8. 最終調整

## ライセンス

Private
