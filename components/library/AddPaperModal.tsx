'use client';

import { useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { uploadPDF, createPaper } from '@/lib/database';

// PDF.jsワーカーの設定
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface AddPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPaperModal({ isOpen, onClose, onSuccess }: AddPaperModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>('');
  const [authors, setAuthors] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError('');

      // ファイル名からタイトルを推測
      const fileName = file.name.replace('.pdf', '');
      if (!title) {
        setTitle(fileName);
      }
    } else {
      setError('PDFファイルを選択してください');
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('PDFファイルを選択してください');
      return;
    }

    if (!title.trim()) {
      setError('タイトルを入力してください');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setError('');

    try {
      // 一意のIDを生成
      const paperId = `paper_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // PDF.jsでページ数を取得
      setUploadProgress(20);

      // PDFをSupabase Storageにアップロード
      setUploadProgress(40);
      const fileUrl = await uploadPDF(selectedFile, paperId);

      if (!fileUrl) {
        throw new Error('PDFのアップロードに失敗しました');
      }

      setUploadProgress(70);

      // 論文情報をSupabase Databaseに保存
      const paper = await createPaper({
        title: title.trim(),
        authors: authors.trim() || undefined,
        year: year ? parseInt(year, 10) : undefined,
        file_path: fileUrl,
        total_pages: numPages,
        current_page: 1,
        status: 'Unread',
      });

      if (!paper) {
        throw new Error('論文情報の保存に失敗しました');
      }

      setUploadProgress(100);

      // 成功
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 500);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setTitle('');
    setAuthors('');
    setYear('');
    setNumPages(0);
    setIsUploading(false);
    setUploadProgress(0);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold">PDFを追加</h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* コンテンツ */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* ファイル選択 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PDFファイル *
            </label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                ファイルを選択
              </button>
              {selectedFile && (
                <span className="text-sm text-gray-600">{selectedFile.name}</span>
              )}
            </div>
          </div>

          {/* PDFプレビュー（ページ数取得のため） */}
          {selectedFile && (
            <div className="hidden">
              <Document
                file={selectedFile}
                onLoadSuccess={onDocumentLoadSuccess}
              >
                <Page pageNumber={1} width={100} />
              </Document>
            </div>
          )}

          {/* タイトル */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              タイトル *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
              placeholder="論文のタイトルを入力"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              required
            />
          </div>

          {/* 著者 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              著者
            </label>
            <input
              type="text"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              disabled={isUploading}
              placeholder="例: Smith et al."
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          {/* 出版年 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              出版年
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              disabled={isUploading}
              placeholder="例: 2023"
              min="1900"
              max={new Date().getFullYear() + 1}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          {/* ページ数表示 */}
          {numPages > 0 && (
            <div className="mb-4 text-sm text-gray-600">
              ページ数: {numPages}
            </div>
          )}

          {/* エラーメッセージ */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* アップロード進行状況 */}
          {isUploading && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>アップロード中...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* ボタン */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile || !title.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'アップロード中...' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
