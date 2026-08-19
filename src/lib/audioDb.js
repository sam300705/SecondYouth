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

export async function saveMemory(memory) {
  const database = await openDb();
  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    await requestToPromise(transaction.objectStore(STORE_NAME).put(memory));
  } finally {
    database.close();
  }
}

export async function deleteMemory(id) {
  const database = await openDb();
  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    await requestToPromise(transaction.objectStore(STORE_NAME).delete(id));
  } finally {
    database.close();
  }
}

export async function clearMemories() {
  const database = await openDb();
  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    await requestToPromise(transaction.objectStore(STORE_NAME).clear());
  } finally {
    database.close();
  }
}
