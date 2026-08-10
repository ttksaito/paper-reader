'use client';

import { useEffect } from 'react';

interface TranslationModalProps {
  originalText: string;
  translatedText: string;
  isLoading: boolean;
  onClose: () => void;
}

export default function TranslationModal({
  originalText,
  translatedText,
  isLoading,
  onClose,
}: TranslationModalProps) {
  // ESCキーで閉じる
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">翻訳</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* 元のテキスト */}
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-600 mb-2">原文</div>
            <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
              {originalText}
            </div>
          </div>

          {/* 翻訳結果 */}
          <div>
            <div className="text-sm font-semibold text-gray-600 mb-2">翻訳結果</div>
            <div className="bg-blue-50 p-3 rounded border border-blue-200 text-sm">
              {isLoading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  翻訳中...
                </div>
              ) : translatedText ? (
                translatedText
              ) : (
                <div className="text-red-600">翻訳に失敗しました</div>
              )}
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
