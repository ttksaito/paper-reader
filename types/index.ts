// 論文情報の型定義
export interface Paper {
  id: string;
  title: string;
  authors?: string;
  year?: number;
  file_path: string;
  total_pages: number;
  current_page: number;
  status: 'Unread' | 'Reading' | 'Completed';
  created_at: string;
  last_opened_at: string;
}

// ノートの型定義
export interface Note {
  id: string;
  paper_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// アノテーションのポイント
export interface AnnotationPoint {
  x: number; // 0〜1の相対座標
  y: number; // 0〜1の相対座標
  pressure?: number; // 筆圧（0〜1）
}

// アノテーションの型定義
export interface Annotation {
  id: string;
  paper_id: string;
  page: number;
  tool: 'pen' | 'marker' | 'eraser';
  color: string;
  width: number;
  points: AnnotationPoint[];
  created_at: string;
  updated_at: string;
}

// 操作モードの型定義
export type ToolMode = 'view' | 'pen' | 'marker' | 'eraser';

// 描画ストロークの型定義（Undo/Redo用）
export interface Stroke {
  tool: ToolMode;
  points: AnnotationPoint[];
  color?: string;
  width?: number;
}

// PDF表示設定
export interface PDFViewerState {
  scale: number;
  currentPage: number;
  totalPages: number;
}
