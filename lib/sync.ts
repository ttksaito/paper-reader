// Sync functionality between IndexedDB and Supabase

import {
  isOnline,
  getUnsyncedData,
  markAsSynced,
  cachePaper,
  cacheNote,
  cacheAnnotation,
  type CachedPaper,
  type CachedNote,
  type CachedAnnotation,
} from './indexedDB';

import {
  createPaper,
  updatePaper,
  upsertNote,
  saveAnnotation,
  getAllPapers,
  getNoteByPaperId,
  getAnnotationsByPaper,
} from './database';

// Sync status
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncResult {
  status: SyncStatus;
  message: string;
  details?: {
    papersSynced: number;
    notesSynced: number;
    annotationsSynced: number;
  };
}

// Sync unsynced data to Supabase
export async function syncToSupabase(): Promise<SyncResult> {
  if (!isOnline()) {
    return {
      status: 'error',
      message: 'Cannot sync: offline',
    };
  }

  try {
    const unsynced = await getUnsyncedData();
    let papersSynced = 0;
    let notesSynced = 0;
    let annotationsSynced = 0;

    // Sync papers
    for (const paper of unsynced.papers) {
      try {
        const { id, synced, ...paperData } = paper;

        // Try to create or update in Supabase
        await createPaper({
          ...paperData,
          id,
        });

        // Mark as synced in IndexedDB
        await markAsSynced('papers', id);
        papersSynced++;
      } catch (error) {
        console.error(`Failed to sync paper ${paper.id}:`, error);
      }
    }

    // Sync notes
    for (const note of unsynced.notes) {
      try {
        const { id, synced, ...noteData } = note;

        await upsertNote(noteData.paper_id, noteData.content);

        await markAsSynced('notes', id);
        notesSynced++;
      } catch (error) {
        console.error(`Failed to sync note ${note.id}:`, error);
      }
    }

    // Sync annotations
    for (const annotation of unsynced.annotations) {
      try {
        const { id, synced, ...annotationData } = annotation;

        await saveAnnotation(
          annotationData.paper_id,
          annotationData.page_number,
          annotationData.strokes
        );

        await markAsSynced('annotations', id);
        annotationsSynced++;
      } catch (error) {
        console.error(`Failed to sync annotation ${annotation.id}:`, error);
      }
    }

    return {
      status: 'success',
      message: 'Sync completed successfully',
      details: {
        papersSynced,
        notesSynced,
        annotationsSynced,
      },
    };
  } catch (error) {
    console.error('Sync error:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown sync error',
    };
  }
}

// Pull data from Supabase to IndexedDB
export async function syncFromSupabase(): Promise<SyncResult> {
  if (!isOnline()) {
    return {
      status: 'error',
      message: 'Cannot sync: offline',
    };
  }

  try {
    let papersSynced = 0;
    let notesSynced = 0;
    let annotationsSynced = 0;

    // Fetch all papers from Supabase
    const papers = await getAllPapers();
    for (const paper of papers) {
      const cachedPaper: CachedPaper = {
        ...paper,
        synced: true,
      };
      await cachePaper(cachedPaper);
      papersSynced++;

      // Fetch and cache note for this paper
      try {
        const note = await getNoteByPaperId(paper.id);
        if (note) {
          const cachedNote: CachedNote = {
            ...note,
            synced: true,
          };
          await cacheNote(cachedNote);
          notesSynced++;
        }
      } catch (error) {
        console.error(`Failed to fetch note for paper ${paper.id}:`, error);
      }

      // Fetch and cache annotations for this paper
      try {
        const annotations = await getAnnotationsByPaper(paper.id);
        for (const annotation of annotations) {
          const cachedAnnotation: CachedAnnotation = {
            ...annotation,
            synced: true,
          };
          await cacheAnnotation(cachedAnnotation);
          annotationsSynced++;
        }
      } catch (error) {
        console.error(`Failed to fetch annotations for paper ${paper.id}:`, error);
      }
    }

    return {
      status: 'success',
      message: 'Sync from Supabase completed',
      details: {
        papersSynced,
        notesSynced,
        annotationsSynced,
      },
    };
  } catch (error) {
    console.error('Sync from Supabase error:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown sync error',
    };
  }
}

// Bi-directional sync
export async function fullSync(): Promise<SyncResult> {
  if (!isOnline()) {
    return {
      status: 'error',
      message: 'Cannot sync: offline',
    };
  }

  try {
    // First push unsynced local changes to Supabase
    const uploadResult = await syncToSupabase();
    if (uploadResult.status === 'error') {
      return uploadResult;
    }

    // Then pull latest data from Supabase
    const downloadResult = await syncFromSupabase();
    if (downloadResult.status === 'error') {
      return downloadResult;
    }

    return {
      status: 'success',
      message: 'Full sync completed',
      details: {
        papersSynced:
          (uploadResult.details?.papersSynced || 0) +
          (downloadResult.details?.papersSynced || 0),
        notesSynced:
          (uploadResult.details?.notesSynced || 0) +
          (downloadResult.details?.notesSynced || 0),
        annotationsSynced:
          (uploadResult.details?.annotationsSynced || 0) +
          (downloadResult.details?.annotationsSynced || 0),
      },
    };
  } catch (error) {
    console.error('Full sync error:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown sync error',
    };
  }
}

// Auto-sync on online/offline events
export function setupAutoSync(
  onSyncStart?: () => void,
  onSyncComplete?: (result: SyncResult) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = async () => {
    console.log('Network connection restored, starting sync...');
    onSyncStart?.();

    const result = await fullSync();
    console.log('Sync result:', result);
    onSyncComplete?.(result);
  };

  const handleOffline = () => {
    console.log('Network connection lost, switching to offline mode');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
