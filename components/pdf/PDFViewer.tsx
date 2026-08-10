'use client';

import { useState, useEffect, useRef, TouchEvent } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

interface PDFViewerProps {
  pdfUrl: string;
  onPageChange?: (page: number) => void;
  initialPage?: number;
}

export default function PDFViewer({ pdfUrl, onPageChange, initialPage = 1 }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [scale, setScale] = useState<number>(1.0);
  const containerRef = useRef<HTMLDivElement>(null);

  // ピンチジェスチャー用の状態
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialScale, setInitialScale] = useState<number>(1.0);

  // PDF.jsワーカーの設定
  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const goToPage = (page: number) => {
    if (page < 1 || page > numPages) return;
    setPageNumber(page);
    if (onPageChange) {
      onPageChange(page);
    }
  };

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

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-auto bg-gray-100"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex justify-center p-4">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-screen">
              <div className="text-gray-500">Loading PDF...</div>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-lg"
          />
        </Document>
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
    </div>
  );
}
