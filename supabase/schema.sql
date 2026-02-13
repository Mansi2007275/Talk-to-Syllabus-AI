-- ============================================
-- Talk-to-Syllabus AI - Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- Table: documents
-- Stores uploaded syllabus PDFs metadata
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'error')),
  chunks_count INTEGER DEFAULT 0,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: chunks
-- Stores text chunks with vector embeddings
-- ============================================
CREATE TABLE IF NOT EXISTS chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(384),  -- all-MiniLM-L6-v2 produces 384-dim vectors
  chunk_index INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: query_cache
-- Caches question-answer pairs to reduce LLM calls
-- ============================================
CREATE TABLE IF NOT EXISTS query_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_hash TEXT NOT NULL UNIQUE,
  course_name TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'simple',
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sources TEXT[] DEFAULT '{}',
  hit_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: analytics
-- Tracks query analytics
-- ============================================
CREATE TABLE IF NOT EXISTS analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_name TEXT NOT NULL,
  question TEXT NOT NULL,
  mode TEXT DEFAULT 'simple',
  cached BOOLEAN DEFAULT FALSE,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for performance
-- ============================================

-- Vector similarity search index (IVFFlat for speed)
CREATE INDEX IF NOT EXISTS chunks_embedding_idx
  ON chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Fast cache lookups
CREATE INDEX IF NOT EXISTS query_cache_hash_idx
  ON query_cache (question_hash);

-- Course-based chunk filtering
CREATE INDEX IF NOT EXISTS chunks_document_id_idx
  ON chunks (document_id);

-- Analytics lookups
CREATE INDEX IF NOT EXISTS analytics_course_idx
  ON analytics (course_name, created_at DESC);

-- ============================================
-- Function: match_chunks
-- Performs vector similarity search
-- ============================================
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding VECTOR(384),
  match_count INT DEFAULT 5,
  filter_course TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  chunk_index INTEGER,
  document_id UUID,
  course_name TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.content,
    c.chunk_index,
    c.document_id,
    d.course_name,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM chunks c
  JOIN documents d ON c.document_id = d.id
  WHERE
    d.status = 'completed'
    AND (filter_course IS NULL OR d.course_name = filter_course)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================
-- RLS Policies (optional - enable if using Supabase Auth)
-- ============================================
-- ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE query_cache ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Public read access (for demo):
-- CREATE POLICY "Public read documents" ON documents FOR SELECT USING (true);
-- CREATE POLICY "Public read chunks" ON chunks FOR SELECT USING (true);

-- ============================================
-- Storage bucket for PDFs
-- ============================================
-- Run in Supabase Dashboard  ->  Storage  ->  Create bucket:
-- Name: syllabus-pdfs
-- Public: false

-- ============================================
-- Seed: Insert sample courses (optional)
-- ============================================
-- INSERT INTO documents (course_name, file_name, status) VALUES
--   ('Data Structures', 'ds_syllabus.pdf', 'completed'),
--   ('Operating Systems', 'os_syllabus.pdf', 'completed'),
--   ('Computer Networks', 'cn_syllabus.pdf', 'completed');
