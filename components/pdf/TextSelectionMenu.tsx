'use client';

import { useEffect, useState } from 'react';

interface TextSelectionMenuProps {
  selectedText: string;
  position: { x: number; y: number };
  onTranslate: (text: string) => void;
  onAddToNote: (text: string, pageNumber: number) => void;
  onClose: () => void;
  pageNumber: number;
}

export default function TextSelectionMenu({
  selectedText,
  position,
  onTranslate,
  onAddToNote,
  onClose,
  pageNumber,
}: TextSelectionMenuProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleClickOutside = () => {
      setIsVisible(false);
      setTimeout(onClose, 100);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!isVisible || !selectedText) return null;

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-1"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateY(-100%) translateY(-8px)',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex gap-1">
        <button
          onClick={() => {
            onTranslate(selectedText);
            onClose();
          }}
          className="px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors whitespace-nowrap"
        >
          翻訳
        </button>
        <button
          onClick={() => {
            onAddToNote(selectedText, pageNumber);
            onClose();
          }}
          className="px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors whitespace-nowrap"
        >
          Noteに追加
        </button>
      </div>
    </div>
  );
}
