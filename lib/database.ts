/**
 * Database helper functions for Supabase
 *
 * This module provides CRUD operations for:
 * - Papers (論文管理)
 * - Notes (ノート管理)
 * - Annotations (アノテーション管理)
 */

import { supabase } from './supabase';
import { Paper, Note, Annotation } from '@/types';

// ========================================
// Papers (論文) CRUD
// ========================================

/**
 * 全ての論文を取得
 */
export async function getAllPapers(): Promise<Paper[]> {
  const { data, error } = await supabase
    .from('papers')
    .select('*')
    .order('last_opened_at', { ascending: false });

  if (error) {
    console.error('Error fetching papers:', error);
    return [];
  }

  return data || [];
}

/**
 * IDで論文を取得
 */
export async function getPaperById(id: string): Promise<Paper | null> {
  const { data, error } = await supabase
    .from('papers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching paper:', error);
    return null;
  }

  return data;
}

/**
 * 新しい論文を追加
 */
export async function createPaper(
  paper: Omit<Paper, 'id' | 'created_at' | 'last_opened_at'>
): Promise<Paper | null> {
  const { data, error } = await supabase
    .from('papers')
    .insert([paper])
    .select()
    .single();

  if (error) {
    console.error('Error creating paper:', error);
    return null;
  }

  return data;
}

/**
 * 論文情報を更新
 */
export async function updatePaper(
  id: string,
  updates: Partial<Omit<Paper, 'id' | 'created_at'>>
): Promise<Paper | null> {
  const { data, error } = await supabase
    .from('papers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating paper:', error);
    return null;
  }

  return data;
}

/**
 * 論文を削除（関連するノートとアノテーションも削除される）
 */
export async function deletePaper(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('papers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting paper:', error);
    return false;
  }

  return true;
}

/**
 * 閲覧位置を更新（現在のページと最終閲覧日時）
 */
export async function updateReadingProgress(
  paperId: string,
  currentPage: number
): Promise<boolean> {
  const { error } = await supabase
    .from('papers')
    .update({
      current_page: currentPage,
      last_opened_at: new Date().toISOString(),
    })
    .eq('id', paperId);

  if (error) {
    console.error('Error updating reading progress:', error);
    return false;
  }

  return true;
}

/**
 * 論文の状態を更新（Unread / Reading / Completed）
 */
export async function updatePaperStatus(
  paperId: string,
  status: Paper['status']
): Promise<boolean> {
  const { error } = await supabase
    .from('papers')
    .update({ status })
    .eq('id', paperId);

  if (error) {
    console.error('Error updating paper status:', error);
    return false;
  }

  return true;
}

// ========================================
// Notes (ノート) CRUD
// ========================================

/**
 * 論文のノートを取得
 */
export async function getNoteByPaperId(paperId: string): Promise<Note | null> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('paper_id', paperId)
    .single();

  if (error) {
    // ノートが存在しない場合はエラーではない
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching note:', error);
    return null;
  }

  return data;
}

/**
 * ノートを作成または更新
 */
export async function upsertNote(
  paperId: string,
  content: string
): Promise<Note | null> {
  // まず既存のノートを確認
  const existingNote = await getNoteByPaperId(paperId);

  if (existingNote) {
    // 既存ノートを更新
    const { data, error } = await supabase
      .from('notes')
      .update({ content })
      .eq('paper_id', paperId)
      .select()
      .single();

    if (error) {
      console.error('Error updating note:', error);
      return null;
    }

    return data;
  } else {
    // 新規ノートを作成
    const { data, error } = await supabase
      .from('notes')
      .insert([{ paper_id: paperId, content }])
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return null;
    }

    return data;
  }
}

/**
 * ノートを削除
 */
export async function deleteNote(paperId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('paper_id', paperId);

  if (error) {
    console.error('Error deleting note:', error);
    return false;
  }

  return true;
}

// ========================================
// Annotations (アノテーション) CRUD
// ========================================

/**
 * 論文の全アノテーションを取得
 */
export async function getAnnotationsByPaperId(
  paperId: string
): Promise<Annotation[]> {
  const { data, error } = await supabase
    .from('annotations')
    .select('*')
    .eq('paper_id', paperId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching annotations:', error);
    return [];
  }

  return data || [];
}

/**
 * 特定ページのアノテーションを取得
 */
export async function getAnnotationsByPage(
  paperId: string,
  page: number
): Promise<Annotation[]> {
  const { data, error } = await supabase
    .from('annotations')
    .select('*')
    .eq('paper_id', paperId)
    .eq('page', page)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching annotations for page:', error);
    return [];
  }

  return data || [];
}

/**
 * アノテーションを作成
 */
export async function createAnnotation(
  annotation: Omit<Annotation, 'id' | 'created_at' | 'updated_at'>
): Promise<Annotation | null> {
  const { data, error } = await supabase
    .from('annotations')
    .insert([annotation])
    .select()
    .single();

  if (error) {
    console.error('Error creating annotation:', error);
    return null;
  }

  return data;
}

/**
 * 複数のアノテーションを一括作成
 */
export async function createAnnotations(
  annotations: Omit<Annotation, 'id' | 'created_at' | 'updated_at'>[]
): Promise<Annotation[]> {
  const { data, error } = await supabase
    .from('annotations')
    .insert(annotations)
    .select();

  if (error) {
    console.error('Error creating annotations:', error);
    return [];
  }

  return data || [];
}

/**
 * アノテーションを更新
 */
export async function updateAnnotation(
  id: string,
  updates: Partial<Omit<Annotation, 'id' | 'paper_id' | 'created_at' | 'updated_at'>>
): Promise<Annotation | null> {
  const { data, error } = await supabase
    .from('annotations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating annotation:', error);
    return null;
  }

  return data;
}

/**
 * アノテーションを削除
 */
export async function deleteAnnotation(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('annotations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting annotation:', error);
    return false;
  }

  return true;
}

/**
 * ページの全アノテーションを削除
 */
export async function deleteAnnotationsByPage(
  paperId: string,
  page: number
): Promise<boolean> {
  const { error } = await supabase
    .from('annotations')
    .delete()
    .eq('paper_id', paperId)
    .eq('page', page);

  if (error) {
    console.error('Error deleting annotations for page:', error);
    return false;
  }

  return true;
}

/**
 * 論文の全アノテーションを削除
 */
export async function deleteAllAnnotations(paperId: string): Promise<boolean> {
  const { error } = await supabase
    .from('annotations')
    .delete()
    .eq('paper_id', paperId);

  if (error) {
    console.error('Error deleting all annotations:', error);
    return false;
  }

  return true;
}

// ========================================
// PDF Storage (Supabase Storage)
// ========================================

/**
 * PDFファイルをStorageにアップロード
 * @param file PDFファイル
 * @param paperId 論文ID（ファイル名に使用）
 * @returns アップロードされたファイルのパス
 */
export async function uploadPDF(
  file: File,
  paperId: string
): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${paperId}.${fileExt}`;
  const filePath = `pdfs/${fileName}`;

  const { data, error } = await supabase.storage
    .from('papers')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true, // 同名ファイルがあれば上書き
    });

  if (error) {
    console.error('Error uploading PDF:', error);
    return null;
  }

  // 公開URLを取得
  const { data: urlData } = supabase.storage
    .from('papers')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * PDFファイルを削除
 */
export async function deletePDF(filePath: string): Promise<boolean> {
  // URLからファイルパスを抽出
  const path = filePath.split('/').slice(-2).join('/');

  const { error } = await supabase.storage
    .from('papers')
    .remove([path]);

  if (error) {
    console.error('Error deleting PDF:', error);
    return false;
  }

  return true;
}

/**
 * PDFファイルのダウンロードURL取得
 */
export async function getPDFUrl(filePath: string): Promise<string | null> {
  const { data } = supabase.storage
    .from('papers')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
