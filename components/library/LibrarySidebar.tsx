'use client';

import { useState, useEffect } from 'react';
import dynamicImport from 'next/dynamic';
import { Paper } from '@/types';
import { getAllPapers } from '@/lib/database';
import SyncManager from '@/components/sync/SyncManager';

// AddPaperModalは PDF.js を使用するため、クライアントサイドのみでロード
const AddPaperModal = dynamicImport(
  () => import('@/components/library/AddPaperModal'),
  { ssr: false }
);

interface LibrarySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onPaperSelect: (paper: Paper) => void;
  selectedPaperId?: string;
}

export default function LibrarySidebar({ isOpen, onClose, onOpen, onPaperSelect, selectedPaperId }: LibrarySidebarProps) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'year'>('recent');

  // Supabaseから論文を取得
  const loadPapers = async () => {
    setIsLoading(true);
    const data = await getAllPapers();
    setPapers(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadPapers();
  }, []);

  const filteredPapers = papers
    .filter((paper) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        paper.title.toLowerCase().includes(query) ||
        paper.authors?.toLowerCase().includes(query) ||
        paper.file_path.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.last_opened_at).getTime() - new Date(a.last_opened_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'year':
          return (b.year || 0) - (a.year || 0);
        default:
          return 0;
      }
    });

  const getStatusBadge = (status: Paper['status']) => {
    const styles = {
      Unread: 'bg-gray-200 text-gray-700',
      Reading: 'bg-blue-200 text-blue-700',
      Completed: 'bg-green-200 text-green-700',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const getProgress = (paper: Paper) => {
    if (paper.total_pages === 0) return 0;
    return Math.round((paper.current_page / paper.total_pages) * 100);
  };

  return (
    <>
      {/* Overlay - 開いている時のみ表示 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Collapsed Icon Bar - 閉じている時 */}
      {!isOpen && (
        <div className="fixed left-0 top-0 bottom-0 w-16 bg-white border-r border-gray-200 shadow-md z-50 flex flex-col items-center py-4 gap-3">
          {/* Toggle Button - Open */}
          <button
            onClick={onOpen}
            className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
            title="Libraryを開く"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" fill="none"/>
              <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" fill="none"/>
              <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" fill="none"/>
              <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </button>

          {/* Divider */}
          <div className="w-8 h-px bg-gray-300" />

          {/* Add PDF Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="p-3 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
            title="PDFを追加"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Paper Icons - 最大5件表示 */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 w-full px-2">
            {filteredPapers.slice(0, 5).map((paper) => (
              <button
                key={paper.id}
                onClick={() => {
                  onPaperSelect(paper);
                }}
                className={`p-2 rounded transition-colors ${
                  selectedPaperId === paper.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'hover:bg-gray-100'
                }`}
                title={paper.title}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))}
          </div>

          {/* Sync Status Indicator */}
          <div className="mt-auto">
            <SyncManager />
          </div>
        </div>
      )}

      {/* Full Sidebar - 開いている時 */}
      <div className={`fixed left-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Library</h2>
            <div className="flex items-center gap-2">
              <SyncManager />
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                + PDF
              </button>
              {/* Toggle Button */}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Libraryを閉じる"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Search and Sort */}
          <div className="space-y-2">
            <input
              type="text"
              placeholder="タイトル、著者、ファイル名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">最近読んだ順</option>
              <option value="title">タイトル順</option>
              <option value="year">出版年順</option>
            </select>
          </div>
        </div>

        {/* Paper List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">読み込み中...</div>
            </div>
          ) : filteredPapers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchQuery ? '検索結果がありません' : '論文がまだ追加されていません'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  最初のPDFを追加
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPapers.map((paper) => (
                <div
                  key={paper.id}
                  onClick={() => {
                    onPaperSelect(paper);
                    onClose();
                  }}
                  className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-3 border cursor-pointer ${
                    selectedPaperId === paper.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold line-clamp-2 flex-1">
                      {paper.title}
                    </h3>
                    {getStatusBadge(paper.status)}
                  </div>

                  {paper.authors && (
                    <p className="text-xs text-gray-600 mb-1">{paper.authors}</p>
                  )}

                  {paper.year && (
                    <p className="text-xs text-gray-500 mb-2">{paper.year}</p>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>
                        {paper.current_page} / {paper.total_pages} ページ
                      </span>
                      <span>{getProgress(paper)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${getProgress(paper)}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    最終閲覧: {new Date(paper.last_opened_at).toLocaleDateString('ja-JP')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Paper Modal */}
      <AddPaperModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          loadPapers();
        }}
      />
    </>
  );
}
