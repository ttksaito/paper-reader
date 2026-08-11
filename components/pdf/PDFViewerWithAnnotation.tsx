'use client';

import { useState, useRef, useEffect, TouchEvent, forwardRef, useImperativeHandle } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ToolMode } from '@/types';
import AnnotationLayer, { AnnotationLayerRef } from './AnnotationLayer';
import TextSelectionMenu from './TextSelectionMenu';
import TranslationModal from './TranslationModal';
import { translateText } from '@/lib/translation';

// PDF.jsワーカーの設定
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerWithAnnotationProps {
  pdfUrl: string;
  paperId?: string;
  onPageChange?: (page: number) => void;
  initialPage?: number;
  onTextSelect?: (text: string, pageNumber: number) => void;
  onAddToNote?: (text: string, pageNumber: number) => void;
}

export interface PDFViewerWithAnnotationRef {
  goToPage: (page: number) => void;
}

const PDFViewerWithAnnotation = forwardRef<PDFViewerWithAnnotationRef, PDFViewerWithAnnotationProps>(({
  pdfUrl,
  paperId,
  onPageChange,
  initialPage = 1,
  onTextSelect,
  onAddToNote,
}, ref) => {
  console.log('PDFViewerWithAnnotation mounted with pdfUrl:', pdfUrl);

  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [scale, setScale] = useState<number>(1.0);
  const [toolMode, setToolMode] = useState<ToolMode>('view');
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const pageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const annotationLayerRef = useRef<AnnotationLayerRef>(null);

  // ピンチジェスチャー用の状態
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialScale, setInitialScale] = useState<number>(1.0);

  // テキスト選択メニュー用の状態
  const [selectedText, setSelectedText] = useState<string>('');
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showMenu, setShowMenu] = useState<boolean>(false);

  // 翻訳モーダル用の状態
  const [showTranslationModal, setShowTranslationModal] = useState<boolean>(false);
  const [translationOriginal, setTranslationOriginal] = useState<string>('');
  const [translationResult, setTranslationResult] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log('PDF loaded successfully, pages:', numPages);
    setNumPages(numPages);
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF load error:', error);
  }

  // pdfUrlが変更された時のログ
  useEffect(() => {
    console.log('pdfUrl changed to:', pdfUrl);
    console.log('paperId:', paperId);
  }, [pdfUrl, paperId]);

  // ページのサイズを取得
  useEffect(() => {
    if (pageRef.current) {
      const canvas = pageRef.current.querySelector('canvas');
      if (canvas) {
        setCanvasSize({
          width: canvas.clientWidth,
          height: canvas.clientHeight,
        });
      }
    }
  }, [pageNumber, scale]);

  const goToPage = (page: number) => {
    if (page < 1 || page > numPages) return;
    setPageNumber(page);
    if (onPageChange) {
      onPageChange(page);
    }
  };

  // refを通じてgoToPage関数を公開
  useImperativeHandle(ref, () => ({
    goToPage,
  }), [goToPage]);

  const zoom = (delta: number) => {
    setScale((prev) => Math.max(0.5, Math.min(3.0, prev + delta)));
  };

  // 2点間の距離を計算
  const getDistance = (touch1: React.Touch, touch2: React.Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // タッチ開始イベント
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    // 2本指のタッチでピンチ操作を開始
    if (e.touches.length === 2) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      setInitialPinchDistance(distance);
      setInitialScale(scale);
    }
  };

  // タッチ移動イベント
  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    // 2本指でのピンチ操作中
    if (e.touches.length === 2 && initialPinchDistance !== null) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scaleChange = currentDistance / initialPinchDistance;
      const newScale = Math.max(0.5, Math.min(3.0, initialScale * scaleChange));
      setScale(newScale);
    }
  };

  // タッチ終了イベント
  const handleTouchEnd = () => {
    setInitialPinchDistance(null);
  };

  const handleAnnotationChange = (annotations: any[]) => {
    console.log('Annotations changed:', annotations);
    // TODO: アノテーションをステートに保存
  };

  const handleUndo = () => {
    annotationLayerRef.current?.undo();
  };

  const handleRedo = () => {
    annotationLayerRef.current?.redo();
  };

  // テキスト選択を検知
  useEffect(() => {
    const handleMouseUp = () => {
      if (toolMode !== 'view') return; // 閲覧モードのみ

      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 0) {
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();

        if (rect) {
          setSelectedText(text);
          setMenuPosition({
            x: rect.left + rect.width / 2,
            y: rect.top,
          });
          setShowMenu(true);

          if (onTextSelect) {
            onTextSelect(text, pageNumber);
          }
        }
      } else {
        setShowMenu(false);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [toolMode, pageNumber, onTextSelect]);

  const handleTranslate = async (text: string) => {
    console.log('Translate:', text);

    // モーダルを表示し、翻訳開始
    setTranslationOriginal(text);
    setTranslationResult('');
    setIsTranslating(true);
    setShowTranslationModal(true);

    try {
      // 翻訳APIを呼び出す
      const result = await translateText(text, {
        service: 'mymemory', // デフォルトはMyMemory（無料）
        sourceLang: 'en',
        targetLang: 'ja',
      });

      if (result.translatedText) {
        setTranslationResult(result.translatedText);
      } else {
        setTranslationResult('翻訳に失敗しました: ' + (result.error || '不明なエラー'));
      }
    } catch (error) {
      console.error('Translation error:', error);
      setTranslationResult('翻訳中にエラーが発生しました');
    } finally {
      setIsTranslating(false);
    }
  };

  const closeTranslationModal = () => {
    setShowTranslationModal(false);
    setTranslationOriginal('');
    setTranslationResult('');
    setIsTranslating(false);
  };

  const handleAddToNote = (text: string, page: number) => {
    if (onAddToNote) {
      onAddToNote(text, page);
    }
  };

  const closeMenu = () => {
    setShowMenu(false);
    setSelectedText('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* ツールバー */}
      <div className="bg-white border-b border-gray-200 p-2 flex items-center gap-2">
        {/* Undo/Redoボタン */}
        <div className="flex items-center gap-1 mr-2">
          <button
            onClick={handleUndo}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            title="元に戻す"
          >
            ↶
          </button>
          <button
            onClick={handleRedo}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            title="やり直す"
          >
            ↷
          </button>
        </div>

        {/* ツールモード選択 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setToolMode('view')}
            className={`px-3 py-1 rounded ${
              toolMode === 'view' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            閲覧
          </button>
          <button
            onClick={() => setToolMode('pen')}
            className={`px-3 py-1 rounded ${
              toolMode === 'pen' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            ペン
          </button>
          <button
            onClick={() => setToolMode('marker')}
            className={`px-3 py-1 rounded ${
              toolMode === 'marker' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            マーカー
          </button>
          <button
            onClick={() => setToolMode('eraser')}
            className={`px-3 py-1 rounded ${
              toolMode === 'eraser' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            消しゴム
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
          Apple Pencilを使用すると自動的に描画モードになります
        </div>
      </div>

      {/* PDFとアノテーションレイヤー */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-auto bg-gray-100"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex justify-center p-4">
          <div ref={pageRef} className="relative">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center h-screen">
                  <div className="text-gray-500">Loading PDF...</div>
                </div>
              }
              error={
                <div className="flex items-center justify-center h-screen">
                  <div className="text-red-500">PDF読み込みエラー</div>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={false}
                className="shadow-lg"
                canvasBackground="white"
              />
            </Document>

            {/* アノテーションレイヤー */}
            {canvasSize.width > 0 && (
              <AnnotationLayer
                ref={annotationLayerRef}
                width={canvasSize.width}
                height={canvasSize.height}
                toolMode={toolMode}
                paperId={paperId}
                pageNumber={pageNumber}
                onAnnotationChange={handleAnnotationChange}
              />
            )}
          </div>
        </div>

        {/* ページナビゲーション */}
        {numPages > 0 && (
          <div className="fixed bottom-4 left-1/4 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 flex items-center gap-2">
            <button
              onClick={() => goToPage(pageNumber - 1)}
              disabled={pageNumber === 1}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm">
              {pageNumber} / {numPages}
            </span>
            <button
              onClick={() => goToPage(pageNumber + 1)}
              disabled={pageNumber === numPages}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>

            {/* ズームコントロール */}
            <div className="ml-4 flex items-center gap-2">
              <button
                onClick={() => zoom(-0.1)}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                -
              </button>
              <span className="text-sm">{Math.round(scale * 100)}%</span>
              <button
                onClick={() => zoom(0.1)}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* テキスト選択メニュー */}
        {showMenu && (
          <TextSelectionMenu
            selectedText={selectedText}
            position={menuPosition}
            onTranslate={handleTranslate}
            onAddToNote={handleAddToNote}
            onClose={closeMenu}
            pageNumber={pageNumber}
          />
        )}

        {/* 翻訳モーダル */}
        {showTranslationModal && (
          <TranslationModal
            originalText={translationOriginal}
            translatedText={translationResult}
            isLoading={isTranslating}
            onClose={closeTranslationModal}
          />
        )}
      </div>
    </div>
  );
});

PDFViewerWithAnnotation.displayName = 'PDFViewerWithAnnotation';

export default PDFViewerWithAnnotation;
