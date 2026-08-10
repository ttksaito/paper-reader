// IndexedDB for local caching and offline support

const DB_NAME = 'paper-reader-db';
const DB_VERSION = 1;

// Object Store names
const STORES = {
  PAPERS: 'papers',
  NOTES: 'notes',
  ANNOTATIONS: 'annotations',
  PDF_FILES: 'pdf_files',
} as const;

// Database initialization
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is not available on server side'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Papers store
      if (!db.objectStoreNames.contains(STORES.PAPERS)) {
        const paperStore = db.createObjectStore(STORES.PAPERS, { keyPath: 'id' });
        paperStore.createIndex('last_opened_at', 'last_opened_at', { unique: false });
        paperStore.createIndex('status', 'status', { unique: false });
        paperStore.createIndex('created_at', 'created_at', { unique: false });
      }

      // Notes store
      if (!db.objectStoreNames.contains(STORES.NOTES)) {
        const notesStore = db.createObjectStore(STORES.NOTES, { keyPath: 'id' });
        notesStore.createIndex('paper_id', 'paper_id', { unique: true });
        notesStore.createIndex('updated_at', 'updated_at', { unique: false });
      }

      // Annotations store
      if (!db.objectStoreNames.contains(STORES.ANNOTATIONS)) {
        const annotationsStore = db.createObjectStore(STORES.ANNOTATIONS, { keyPath: 'id' });
        annotationsStore.createIndex('paper_id', 'paper_id', { unique: false });
        annotationsStore.createIndex('page_number', 'page_number', { unique: false });
      }

      // PDF Files store (for caching PDF blobs)
      if (!db.objectStoreNames.contains(STORES.PDF_FILES)) {
        db.createObjectStore(STORES.PDF_FILES, { keyPath: 'paper_id' });
      }
    };
  });
}

// Generic function to get a transaction
function getTransaction(
  db: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode = 'readonly'
): IDBObjectStore {
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
}

// ===== Papers CRUD =====

export interface CachedPaper {
  id: string;
  title: string;
  authors?: string;
  publication_year?: number;
  file_path: string;
  total_pages: number;
  current_page: number;
  status: 'Unread' | 'Reading' | 'Completed';
  created_at: string;
  last_opened_at: string;
  synced: boolean; // Flag to track if synced with Supabase
}

export async function cachePaper(paper: CachedPaper): Promise<void> {
  const db = await initDB();
  const store = getTransaction(db, STORES.PAPERS, 'readwrite');

  return new Promise((resolve, reject) => {
    const request = store.put(paper);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedPaper(paperId: string): Promise<CachedPaper | null> {
  const db = await initDB();
  const store = getTransaction(db, STORES.PAPERS);

  return new Promise((resolve, reject) => {
    const request = store.get(paperId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllCachedPapers(): Promise<CachedPaper[]> {
  const db = await initDB();
  const store = getTransaction(db, STORES.PAPERS);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteCachedPaper(paperId: string): Promise<void> {
  const db = await initDB();
  const store = getTransaction(db, STORES.PAPERS, 'readwrite');

  return new Promise((resolve, reject) => {
    const request = store.delete(paperId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ===== Notes CRUD =====

export interface CachedNote {
  id: string;
  paper_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  synced: boolean;
}

export async function cacheNote(note: CachedNote): Promise<void> {
  const db = await initDB();
  const store = getTransaction(db, STORES.NOTES, 'readwrite');

  return new Promise((resolve, reject) => {
    const request = store.put(note);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedNoteByPaperId(paperId: string): Promise<CachedNote | null> {
  const db = await initDB();
  const store = getTransaction(db, STORES.NOTES);
  const index = store.index('paper_id');

  return new Promise((resolve, reject) => {
    const request = index.get(paperId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteCachedNote(noteId: string): Promise<void> {
  const db = await initDB();
  const store = getTransaction(db, STORES.NOTES, 'readwrite');

  return new Promise((resolve, reject) => {
    const request = store.delete(noteId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ===== Annotations CRUD =====

export interface CachedAnnotation {
  id: string;
  paper_id: string;
  page_number: number;
  strokes: any; // Same structure as in Supabase
  created_at: string;
  updated_at: string;
  synced: boolean;
}

export async function cacheAnnotation(annotation: CachedAnnotation): Promise<void> {
  const db = await initDB();
  const store = getTransaction(db, STORES.ANNOTATIONS, 'readwrite');

  return new Promise((resolve, reject) => {
    const request = store.put(annotation);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedAnnotationsByPaper(paperId: string): Promise<CachedAnnotation[]> {
  const db = await initDB();
  const store = getTransaction(db, STORES.ANNOTATIONS);
  const index = store.index('paper_id');

  return new Promise((resolve, reject) => {
    const request = index.getAll(paperId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteCachedAnnotation(annotationId: string): Promise<void> {
  const db = await initDB();
  const store = getTransaction(db, STORES.ANNOTATIONS, 'readwrite');

  return new Promise((resolve, reject) => {
    const request = store.delete(annotationId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ===== PDF Files Caching =====

export interface CachedPDFFile {
  paper_id: string;
  blob: Blob;
  cached_at: string;
}

export async function cachePDFFile(paperId: string, blob: Blob): Promise<void> {
  const db = await initDB();
  const store = getTransaction(db, STORES.PDF_FILES, 'readwrite');

  const cachedFile: CachedPDFFile = {
    paper_id: paperId,
    blob,
    cached_at: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const request = store.put(cachedFile);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedPDFFile(paperId: string): Promise<Blob | null> {
  const db = await initDB();
  const store = getTransaction(db, STORES.PDF_FILES);

  return new Promise((resolve, reject) => {
    const request = store.get(paperId);
    request.onsuccess = () => {
      const result = request.result as CachedPDFFile | undefined;
      resolve(result?.blob || null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteCachedPDFFile(paperId: string): Promise<void> {
  const db = await initDB();
  const store = getTransaction(db, STORES.PDF_FILES, 'readwrite');

  return new Promise((resolve, reject) => {
    const request = store.delete(paperId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ===== Utility Functions =====

// Check if online
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

// Get all unsynced items
export async function getUnsyncedData(): Promise<{
  papers: CachedPaper[];
  notes: CachedNote[];
  annotations: CachedAnnotation[];
}> {
  const papers = await getAllCachedPapers();
  const db = await initDB();

  const notesStore = getTransaction(db, STORES.NOTES);
  const annotationsStore = getTransaction(db, STORES.ANNOTATIONS);

  const notes = await new Promise<CachedNote[]>((resolve, reject) => {
    const request = notesStore.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  const annotations = await new Promise<CachedAnnotation[]>((resolve, reject) => {
    const request = annotationsStore.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return {
    papers: papers.filter(p => !p.synced),
    notes: notes.filter(n => !n.synced),
    annotations: annotations.filter(a => !a.synced),
  };
}

// Mark item as synced
export async function markAsSynced(
  storeName: string,
  itemId: string
): Promise<void> {
  const db = await initDB();
  const store = getTransaction(db, storeName, 'readwrite');

  return new Promise((resolve, reject) => {
    const getRequest = store.get(itemId);

    getRequest.onsuccess = () => {
      const item = getRequest.result;
      if (item) {
        item.synced = true;
        const putRequest = store.put(item);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

// Clear all cached data
export async function clearAllCache(): Promise<void> {
  const db = await initDB();

  const stores = [STORES.PAPERS, STORES.NOTES, STORES.ANNOTATIONS, STORES.PDF_FILES];

  const promises = stores.map(storeName => {
    return new Promise<void>((resolve, reject) => {
      const store = getTransaction(db, storeName, 'readwrite');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });

  await Promise.all(promises);
}
