const STORE = 'events';

function openLedger() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('secondyouth-checkins', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: 'order', autoIncrement: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function ledgerOperation(mode, operation) {
  const database = await openLedger();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, mode);
      transaction.onabort = () => reject(transaction.error || new Error('Check-in storage failed.'));
      const request = operation(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(request.result);
    });
  } finally {
    database.close();
  }
}

export const listCheckins = () => ledgerOperation('readonly', (store) => store.getAll());
export const appendCheckin = (event) => ledgerOperation('readwrite', (store) => store.add(event));
export const acknowledgeCheckin = (event) => ledgerOperation('readwrite', (store) => {
  const request = store.get(event.order);
  request.onsuccess = () => {
    if (request.result?.id === event.id) store.put({ ...request.result, acknowledged: true });
  };
  return request;
});
export const clearCheckins = () => ledgerOperation('readwrite', (store) => store.clear());
