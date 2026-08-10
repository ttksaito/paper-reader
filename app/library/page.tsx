'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Paper } from '@/types';
import { getAllPapers, deletePaper } from '@/lib/database';
import AddPaperModal from '@/components/library/AddPaperModal';
import SyncManager from '@/components/sync/SyncManager';

export default function LibraryPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

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

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'year'>('recent');

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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-blue-600 hover:text-blue-700">
                ← ホームへ戻る
              </Link>
              <h1 className="text-2xl font-bold">Library</h1>
            </div>

            <div className="flex items-center gap-4">
              <SyncManager />
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + PDF
              </button>
            </div>
          </div>

          {/* 検索とソート */}
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="タイトル、著者、ファイル名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">最近読んだ順</option>
              <option value="title">タイトル順</option>
              <option value="year">出版年順</option>
            </select>
          </div>
        </div>
      </header>

      {/* 論文一覧 */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">読み込み中...</div>
            </div>
          ) : filteredPapers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchQuery ? '検索結果がありません' : '論文がまだ追加されていません'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  最初のPDFを追加
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPapers.map((paper) => (
                <Link
                  key={paper.id}
                  href={`/reader?id=${paper.id}`}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold line-clamp-2 flex-1">
                      {paper.title}
                    </h3>
                    {getStatusBadge(paper.status)}
                  </div>

                  {paper.authors && (
                    <p className="text-sm text-gray-600 mb-1">{paper.authors}</p>
                  )}

                  {paper.year && (
                    <p className="text-sm text-gray-500 mb-3">{paper.year}</p>
                  )}

                  {/* 進捗バー */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>
                        {paper.current_page} / {paper.total_pages} ページ
                      </span>
                      <span>{getProgress(paper)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${getProgress(paper)}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mt-2">
                    最終閲覧: {new Date(paper.last_opened_at).toLocaleDateString('ja-JP')}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* PDF追加モーダル */}
      <AddPaperModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          loadPapers();
        }}
      />
    </div>
  );
}
