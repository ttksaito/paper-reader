# Supabase セットアップガイド

このドキュメントでは、Paper ReaderアプリケーションのSupabaseセットアップ手順を説明します。

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスし、アカウントを作成
2. 「New Project」をクリック
3. プロジェクト名を入力（例: `paper-reader`）
4. データベースパスワードを設定
5. リージョンを選択（日本の場合: `Northeast Asia (Tokyo)`）
6. 「Create new project」をクリック

## 2. データベースの設定

1. Supabaseダッシュボードで「SQL Editor」を開く
2. `supabase/schema.sql`ファイルの内容をコピー
3. SQL Editorに貼り付けて実行
4. 以下のテーブルが作成されます:
   - `papers`: 論文情報
   - `notes`: ノート
   - `annotations`: アノテーション（描画データ）

## 3. Storageの設定

1. Supabaseダッシュボードで「Storage」を開く
2. 「Create a new bucket」をクリック
3. Bucket名: `pdfs`
4. Public bucket: ✅ ON（PDFファイルに直接アクセスするため）
5. 「Create bucket」をクリック

### Storageポリシーの設定

Storage画面で「Policies」タブを開き、以下のポリシーを追加:

#### アップロードポリシー
```sql
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'pdfs');
```

#### 読み取りポリシー
```sql
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'pdfs');
```

#### 削除ポリシー
```sql
CREATE POLICY "Allow public deletes"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'pdfs');
```

## 4. 環境変数の設定

1. Supabaseダッシュボードで「Settings」→「API」を開く
2. 以下の情報を確認:
   - Project URL
   - anon public key

3. プロジェクトルートに `.env.local` ファイルを作成:
```bash
cp .env.local.example .env.local
```

4. `.env.local` に以下を設定:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 5. 動作確認

1. 開発サーバーを起動:
```bash
npm run dev
```

2. ブラウザで `http://localhost:3000/library` を開く
3. サンプル論文が表示されることを確認

## トラブルシューティング

### データベース接続エラー
- `.env.local`の環境変数が正しく設定されているか確認
- Supabaseプロジェクトが起動しているか確認

### PDFアップロードエラー
- Storageバケット`pdfs`が作成されているか確認
- Storageポリシーが正しく設定されているか確認

### RLSエラー
- Row Level Security (RLS)ポリシーが有効になっているか確認
- `schema.sql`のポリシー設定が実行されているか確認

## 参考リンク

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
