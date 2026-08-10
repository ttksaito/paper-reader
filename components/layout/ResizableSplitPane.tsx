'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface ResizableSplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  defaultLeftWidth?: number; // パーセンテージ（0-100）
  minLeftWidth?: number; // パーセンテージ
  maxLeftWidth?: number; // パーセンテージ
  showRight?: boolean; // 右パネルの表示/非表示
}

export default function ResizableSplitPane({
  left,
  right,
  defaultLeftWidth = 65,
  minLeftWidth = 30,
  maxLeftWidth = 90,
  showRight = true,
}: ResizableSplitPaneProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // 制約を適用
      const clampedWidth = Math.max(minLeftWidth, Math.min(maxLeftWidth, newLeftWidth));
      setLeftWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minLeftWidth, maxLeftWidth]);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  // 右パネルが非表示の場合、左パネルを100%に
  const effectiveLeftWidth = showRight ? leftWidth : 100;

  return (
    <div ref={containerRef} className="flex h-full w-full relative">
      {/* 左パネル */}
      <div
        className="h-full overflow-hidden"
        style={{ width: `${effectiveLeftWidth}%` }}
      >
        {left}
      </div>

      {/* リサイズハンドル */}
      {showRight && (
        <div
          className={`w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors ${
            isDragging ? 'bg-blue-500' : ''
          }`}
          onMouseDown={handleMouseDown}
        />
      )}

      {/* 右パネル */}
      {showRight && (
        <div
          className="h-full overflow-hidden"
          style={{ width: `${100 - effectiveLeftWidth}%` }}
        >
          {right}
        </div>
      )}
    </div>
  );
}
