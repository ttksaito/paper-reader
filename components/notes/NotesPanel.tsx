'use client';

import { useState, useEffect } from 'react';
import { getNoteByPaperId, upsertNote } from '@/lib/database';

interface NotesPanelProps {
  paperId?: string;
  initialContent?: string;
  onSave?: (content: string) => void;
  onPageJump?: (pageNumber: number) => void;
}

export default function NotesPanel({
  paperId,
  initialContent = '',
  onSave,
  onPageJump,
}: NotesPanelProps) {
  const [content, setContent] = useState<string>(initialContent);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Supabaseからノートを読み込む
  useEffect(() => {
    const loadNote = async () => {
      if (!paperId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const note = await getNoteByPaperId(paperId);
      if (note) {
        setContent(note.content);
      } else {
        setContent(initialContent);
      }
      setIsLoading(false);
    };

    loadNote();
  }, [paperId, initialContent]);

  // 自動保存（3秒後）
  useEffect(() => {
    if (!paperId || isLoading) return;

    const timer = setTimeout(async () => {
      if (content.trim() === '') return; // 空の場合は保存しない

      setIsSaving(true);
      const result = await upsertNote(paperId, content);
      if (result) {
        setLastSaved(new Date());
        if (onSave) {
          onSave(content);
        }
      }
      setIsSaving(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [content, paperId, isLoading, onSave]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  // [Page X] パターンを検出してクリック可能なリンクに変換
  const renderContentWithPageLinks = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIndex) => {
      // [Page X] パターンを検索
      const pagePattern = /\[Page (\d+)\]/g;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;

      while ((match = pagePattern.exec(line)) !== null) {
        // マッチ前のテキスト
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }

        // ページ番号リンク
        const pageNumber = parseInt(match[1], 10);
        parts.push(
          <button
            key={`page-${lineIndex}-${match.index}`}
            onClick={() => onPageJump && onPageJump(pageNumber)}
            className="text-blue-600 hover:text-blue-800 underline font-semibold cursor-pointer"
          >
            {match[0]}
          </button>
        );

        lastIndex = match.index + match[0].length;
      }

      // 残りのテキスト
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      return (
        <div key={lineIndex}>
          {parts.length > 0 ? parts : line}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Notes</h2>
          {isSaving ? (
            <span className="text-xs text-gray-500">保存中...</span>
          ) : lastSaved ? (
            <span className="text-xs text-gray-500">
              保存済み {lastSaved.toLocaleTimeString()}
            </span>
          ) : null}
        </div>

        {/* 編集/プレビュー切り替えタブ */}
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('edit')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'edit'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            編集
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'preview'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            プレビュー
          </button>
        </div>
      </div>

      {/* Notes入力/プレビューエリア */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'edit' ? (
          <textarea
            value={content}
            onChange={handleChange}
            placeholder="メモを入力してください...

選択したテキストを追加するには、PDF上でテキストを選択して「Add to Note」をクリックしてください。"
            className="w-full h-full p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
          />
        ) : (
          <div className="w-full h-full p-4 overflow-y-auto whitespace-pre-wrap">
            {content ? (
              renderContentWithPageLinks(content)
            ) : (
              <p className="text-gray-400">メモがありません</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
