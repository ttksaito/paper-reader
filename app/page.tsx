import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50">
      <main className="flex flex-col items-center gap-8 p-8">
        <h1 className="text-4xl font-bold text-gray-900">
          Paper Reader
        </h1>
        <p className="text-xl text-gray-600 text-center max-w-md">
          iPad向け英語論文PDFリーダー
        </p>

        <div className="flex flex-col gap-4 mt-8">
          <Link
            href="/reader"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-center"
          >
            Reader画面（PDF + Notes）
          </Link>
          <Link
            href="/library"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
          >
            Library画面へ
          </Link>
          <Link
            href="/test-pdf"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-center"
          >
            PDF表示テスト
          </Link>
          <Link
            href="/test-annotation"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center"
          >
            アノテーション機能テスト
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>開発中のMVP機能:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>PDF.jsによるPDF表示</li>
            <li>Apple Pencil対応（ペン、マーカー、消しゴム）</li>
            <li>左右分割レイアウト（PDF + Notes）</li>
            <li>テキスト選択・翻訳機能</li>
            <li>Library管理機能</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
