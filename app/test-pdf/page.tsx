'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// クライアントサイドでのみロード
const PDFViewer = dynamic(
  () => import('@/components/pdf/PDFViewer'),
  { ssr: false }
);

export default function TestPDFPage() {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // サンプルPDFのURL（PDFファイルをアップロードする前のテスト用）
  const samplePdfUrl = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

  const handleLoadSample = () => {
    setPdfUrl(samplePdfUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700"
            >
              ← ホームへ戻る
            </Link>
            <h1 className="text-xl font-bold">PDF表示テスト</h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLoadSample}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              サンプルPDFを読み込む
            </button>
            <label className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 cursor-pointer">
              ファイルを選択
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {currentPage > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            現在のページ: {currentPage}
          </div>
        )}
      </header>

      {/* PDFビューワー */}
      <div className="flex-1 overflow-hidden">
        {pdfUrl ? (
          <PDFViewer
            pdfUrl={pdfUrl}
            onPageChange={setCurrentPage}
            initialPage={1}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-4">PDFファイルが選択されていません</p>
              <p className="text-sm">
                サンプルPDFを読み込むか、ファイルを選択してください
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
