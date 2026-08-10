'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import dynamicImport from 'next/dynamic';
import ResizableSplitPane from '@/components/layout/ResizableSplitPane';
import NotesPanel from '@/components/notes/NotesPanel';
import { PDFViewerWithAnnotationRef } from '@/components/pdf/PDFViewerWithAnnotation';
import { updateReadingProgress } from '@/lib/database';

// クライアントサイドでのみロード
const PDFViewerWithAnnotation = dynamicImport(
  () => import('@/components/pdf/PDFViewerWithAnnotation'),
  { ssr: false }
);

export const dynamic = 'force-dynamic';

export default function ReaderPage() {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [paperId, setPaperId] = useState<string>('sample-paper-id');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showNotes, setShowNotes] = useState<boolean>(true);
  const [notesContent, setNotesContent] = useState<string>('');
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const pdfViewerRef = useRef<PDFViewerWithAnnotationRef>(null);

  // ページ変更時に閲覧位置を自動保存
  useEffect(() => {
    const saveProgress = async () => {
      if (paperId && currentPage > 0) {
        await updateReadingProgress(paperId, currentPage);
      }
    };

    // 1秒後に保存（頻繁な保存を避けるため）
    const timer = setTimeout(saveProgress, 1000);
    return () => clearTimeout(timer);
  }, [paperId, currentPage]);

  // Escキーで集中モードを解除
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusMode) {
        setFocusMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusMode]);

  // サンプルPDFのURL
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

  const handleNotesSave = (content: string) => {
    console.log('Notes saved:', content);
    setNotesContent(content);
    // TODO: Supabaseに保存
  };

  const toggleNotes = () => {
    setShowNotes((prev) => !prev);
  };

  const toggleFocusMode = () => {
    setFocusMode((prev) => !prev);
  };

  const handleTextSelect = (text: string, pageNumber: number) => {
    console.log(`Selected text on page ${pageNumber}:`, text);
  };

  const handleAddToNote = (text: string, pageNumber: number) => {
    const timestamp = new Date().toLocaleString('ja-JP');
    const newEntry = `\n\n[Page ${pageNumber}] - ${timestamp}\n${text}`;
    setNotesContent((prev) => prev + newEntry);
    console.log(`Added to notes from page ${pageNumber}:`, text);
  };

  const handlePageJump = (pageNumber: number) => {
    console.log(`Jumping to page ${pageNumber}`);
    if (pdfViewerRef.current) {
      pdfViewerRef.current.goToPage(pageNumber);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* ヘッダー - 集中モード時は非表示 */}
      {!focusMode && (
        <header className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700"
            >
              ← ホームへ戻る
            </Link>
            <h1 className="text-xl font-bold">Paper Reader</h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleFocusMode}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              title="集中モード（Escで解除）"
            >
              {focusMode ? '通常モード' : '集中モード'}
            </button>
            <button
              onClick={toggleNotes}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              {showNotes ? 'Notes非表示' : 'Notes表示'}
            </button>
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
      )}

      {/* 集中モード解除ボタン */}
      {focusMode && pdfUrl && (
        <div className="absolute top-0 left-0 right-0 z-50 flex justify-center">
          <div className="bg-black/70 text-white px-6 py-2 rounded-b-lg shadow-lg opacity-0 hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={toggleFocusMode}
              className="flex items-center gap-2 text-sm"
            >
              <span>集中モードを解除</span>
              <span className="text-xs text-gray-300">(Escキー)</span>
            </button>
          </div>
        </div>
      )}

      {/* メインコンテンツ（分割レイアウト） */}
      <div className="flex-1 overflow-hidden">
        {pdfUrl ? (
          <ResizableSplitPane
            left={
              <PDFViewerWithAnnotation
                ref={pdfViewerRef}
                pdfUrl={pdfUrl}
                paperId={paperId}
                onPageChange={setCurrentPage}
                initialPage={1}
                onTextSelect={handleTextSelect}
                onAddToNote={handleAddToNote}
              />
            }
            right={
              <NotesPanel
                paperId={paperId}
                initialContent={notesContent}
                onSave={handleNotesSave}
                onPageJump={handlePageJump}
              />
            }
            defaultLeftWidth={65}
            minLeftWidth={30}
            maxLeftWidth={90}
            showRight={!focusMode && showNotes}
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
