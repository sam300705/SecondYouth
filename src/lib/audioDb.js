const DB_NAME = 'secondyouth-media';
const STORE_NAME = 'memories';
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('This browser does not support offline media storage.'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error('Could not open memory storage.'));
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Media storage request failed.'));
  });
}

export async function listMemories() {
  const database = await openDb();
  try {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const results = await requestToPromise(transaction.objectStore(STORE_NAME).getAll());
    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } finally {
    database.close();
  }
}

async function commitMemoryChange(change) {
  const database = await openDb();
  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const committed = new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onabort = () => reject(transaction.error ?? new Error('Media storage transaction was aborted.'));
    });
    try {
      change(transaction.objectStore(STORE_NAME));
    } catch (error) {
      transaction.abort();
      await committed.catch(() => {});
      throw error;
    }
    await committed;
  } finally {
    database.close();
  }
}

export function saveMemory(memory) {
  return commitMemoryChange((store) => store.put(memory));
}

export function deleteMemory(id) {
  return commitMemoryChange((store) => store.delete(id));
}

export function clearMemories() {
  if (!('indexedDB' in window)) return Promise.resolve();
  return commitMemoryChange((store) => store.clear());
}
