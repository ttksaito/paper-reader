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
  onPaperSelect: (paper: Paper) => void;
  selectedPaperId?: string;
}

export default function LibrarySidebar({ isOpen, onClose, onPaperSelect, selectedPaperId }: LibrarySidebarProps) {
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

      {/* Sidebar */}
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
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                ✕
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
