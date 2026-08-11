'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ResizableSplitPane from '@/components/layout/ResizableSplitPane';
import NotesPanel from '@/components/notes/NotesPanel';
import LibrarySidebar from '@/components/library/LibrarySidebar';
import { PDFViewerWithAnnotationRef } from '@/components/pdf/PDFViewerWithAnnotation';
import { Paper } from '@/types';
import { updateReadingProgress, getPaperById } from '@/lib/database';

// PDFViewerはクライアントサイドでのみロード（react-pdfはSSRと互換性がないため）
const PDFViewerWithAnnotation = dynamic(
  () => import('@/components/pdf/PDFViewerWithAnnotation'),
  { ssr: false }
);

export default function Home() {
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showNotes, setShowNotes] = useState<boolean>(true);
  const [showLibrary, setShowLibrary] = useState<boolean>(false);
  const [notesContent, setNotesContent] = useState<string>('');
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const pdfViewerRef = useRef<PDFViewerWithAnnotationRef>(null);

  // URLパラメータからPaper IDを取得
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paperId = params.get('id');

    if (paperId) {
      loadPaper(paperId);
    }
    // アイコンバーは常に表示されるので、自動でLibraryを開く必要なし
  }, []);

  const loadPaper = async (paperId: string) => {
    const paper = await getPaperById(paperId);
    if (paper) {
      setSelectedPaper(paper);
      setCurrentPage(paper.current_page || 1);
      // URLを更新
      window.history.pushState({}, '', `/?id=${paperId}`);
    }
  };

  // ページ変更時に閲覧位置を自動保存
  useEffect(() => {
    const saveProgress = async () => {
      if (selectedPaper?.id && currentPage > 0) {
        await updateReadingProgress(selectedPaper.id, currentPage);
      }
    };

    // 1秒後に保存（頻繁な保存を避けるため）
    const timer = setTimeout(saveProgress, 1000);
    return () => clearTimeout(timer);
  }, [selectedPaper?.id, currentPage]);

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

  const handleNotesSave = (content: string) => {
    console.log('Notes saved:', content);
    setNotesContent(content);
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

  const handlePaperSelect = (paper: Paper) => {
    console.log('Paper selected:', paper);
    console.log('PDF URL:', paper.file_path);
    setSelectedPaper(paper);
    setCurrentPage(paper.current_page || 1);
    // URLを更新
    window.history.pushState({}, '', `/?id=${paper.id}`);
  };

  // PDFViewerとNotesPanelを変数として定義
  const pdfViewer = selectedPaper ? (
    <PDFViewerWithAnnotation
      key={selectedPaper.id}
      ref={pdfViewerRef}
      pdfUrl={selectedPaper.file_path}
      paperId={selectedPaper.id}
      onPageChange={setCurrentPage}
      initialPage={currentPage}
      onTextSelect={handleTextSelect}
      onAddToNote={handleAddToNote}
    />
  ) : null;

  const notesPanel = selectedPaper ? (
    <NotesPanel
      key={selectedPaper.id}
      paperId={selectedPaper.id}
      initialContent={notesContent}
      onSave={handleNotesSave}
      onPageJump={handlePageJump}
      onToggle={toggleNotes}
    />
  ) : null;

  return (
    <div className="flex flex-col h-screen">
      {/* Library Sidebar */}
      <LibrarySidebar
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        onOpen={() => setShowLibrary(true)}
        onPaperSelect={handlePaperSelect}
        selectedPaperId={selectedPaper?.id}
      />

      {/* Header - 集中モード時は非表示 */}
      {!focusMode && (
        <header className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">
                {selectedPaper ? selectedPaper.title : 'Paper Reader'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleFocusMode}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                title="集中モード（Escで解除）"
              >
                集中モード
              </button>
            </div>
          </div>

          {selectedPaper && currentPage > 0 && (
            <div className="mt-2 text-sm text-gray-600 flex items-center gap-4">
              <span>現在のページ: {currentPage}</span>
              {selectedPaper.authors && <span>著者: {selectedPaper.authors}</span>}
              {selectedPaper.year && <span>出版年: {selectedPaper.year}</span>}
            </div>
          )}
        </header>
      )}

      {/* 集中モード解除ボタン */}
      {focusMode && selectedPaper && (
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

      {/* メインコンテンツ（分割レイアウト） - Libraryアイコンバー分の左マージン */}
      <div className="flex-1 overflow-hidden relative bg-gray-50" style={{ marginLeft: showLibrary ? '384px' : '64px' }}>
        {/* 右端：Notes開くボタン（Notesが閉じている時のみ） */}
        {!focusMode && selectedPaper && !showNotes && (
          <button
            onClick={toggleNotes}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-[60] bg-gray-600 text-white p-3 rounded-l-lg shadow-lg hover:bg-gray-700 transition-colors"
            title="Notesを開く"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {selectedPaper ? (
          <ResizableSplitPane
            left={pdfViewer}
            right={notesPanel}
            defaultLeftWidth={65}
            minLeftWidth={30}
            maxLeftWidth={90}
            showRight={!focusMode && showNotes}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Paper Reader
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                iPad向け英語論文PDFリーダー
              </p>
              <button
                onClick={() => {
                  console.log('Center Library button clicked');
                  setShowLibrary(true);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                📚 Libraryを開く
              </button>
              <div className="mt-8 text-sm text-gray-500">
                <p className="mb-2">主な機能:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>PDF.jsによるPDF表示</li>
                  <li>Apple Pencil対応（ペン、マーカー、消しゴム）</li>
                  <li>左右分割レイアウト（PDF + Notes）</li>
                  <li>テキスト選択・翻訳機能</li>
                  <li>Library管理機能</li>
                  <li>オフライン対応（PWA）</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
