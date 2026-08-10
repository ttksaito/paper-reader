-- ===================================
-- Paper Reader Database Schema
-- ===================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================
-- Papers Table
-- ===================================
CREATE TABLE IF NOT EXISTS papers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  authors TEXT,
  year INTEGER,
  file_path TEXT NOT NULL,
  total_pages INTEGER NOT NULL DEFAULT 0,
  current_page INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'Unread' CHECK (status IN ('Unread', 'Reading', 'Completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  last_opened_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for searching
CREATE INDEX IF NOT EXISTS idx_papers_title ON papers(title);
CREATE INDEX IF NOT EXISTS idx_papers_authors ON papers(authors);
CREATE INDEX IF NOT EXISTS idx_papers_last_opened ON papers(last_opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_papers_created ON papers(created_at DESC);

-- ===================================
-- Notes Table
-- ===================================
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for notes
CREATE INDEX IF NOT EXISTS idx_notes_paper_id ON notes(paper_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC);

-- ===================================
-- Annotations Table
-- ===================================
CREATE TABLE IF NOT EXISTS annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  page INTEGER NOT NULL,
  tool TEXT NOT NULL CHECK (tool IN ('pen', 'marker', 'eraser')),
  color TEXT NOT NULL DEFAULT '#000000',
  width NUMERIC NOT NULL DEFAULT 2.0,
  points JSONB NOT NULL, -- Array of {x, y, pressure}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for annotations
CREATE INDEX IF NOT EXISTS idx_annotations_paper_id ON annotations(paper_id);
CREATE INDEX IF NOT EXISTS idx_annotations_page ON annotations(paper_id, page);
CREATE INDEX IF NOT EXISTS idx_annotations_created ON annotations(created_at DESC);

-- ===================================
-- Triggers for updated_at
-- ===================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_papers_updated_at BEFORE UPDATE ON papers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annotations_updated_at BEFORE UPDATE ON annotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- Row Level Security (RLS)
-- ===================================
-- 現在は認証なしで全ユーザーがアクセス可能
-- 将来的に認証を追加する場合は、ここでRLSポリシーを設定

ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;

-- すべてのユーザーに読み書き権限を付与（認証なし）
CREATE POLICY "Enable all access for papers" ON papers FOR ALL USING (true);
CREATE POLICY "Enable all access for notes" ON notes FOR ALL USING (true);
CREATE POLICY "Enable all access for annotations" ON annotations FOR ALL USING (true);

-- ===================================
-- Sample Data (Optional)
-- ===================================
-- サンプルデータを挿入
INSERT INTO papers (title, authors, year, file_path, total_pages, current_page, status, last_opened_at)
VALUES 
  ('Attention Is All You Need', 'Vaswani et al.', 2017, 'https://arxiv.org/pdf/1706.03762.pdf', 15, 1, 'Reading', NOW()),
  ('BERT: Pre-training of Deep Bidirectional Transformers', 'Devlin et al.', 2018, 'https://arxiv.org/pdf/1810.04805.pdf', 16, 5, 'Reading', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;
