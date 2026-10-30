const DB_NAME = 'LEO_TranslationCache';
const STORE_NAME = 'translations';
const DB_VERSION = 1;

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Open IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, {
          keyPath: 'key',
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Generate a unique key for each translation
function createCacheKey(text, sourceLanguage, targetLanguage) {
  return JSON.stringify([
    text.trim(),
    sourceLanguage,
    targetLanguage,
  ]);
}

// Retrieve a translation
export async function getCachedTranslation(
  text,
  sourceLanguage,
  targetLanguage,
) {
  let database;

  try {
    database = await openDatabase();

    const key = createCacheKey(
      text,
      sourceLanguage,
      targetLanguage,
    );

    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(
        STORE_NAME,
        'readwrite',
      );

      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const cachedEntry = request.result;

        if (!cachedEntry) {
          resolve(null);
          return;
        }

        // Remove expired translations
        if (Date.now() > cachedEntry.expiresAt) {
          store.delete(key);
          resolve(null);
          return;
        }

        resolve(cachedEntry.data);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('LEO cache retrieval error:', error);
    return null;
  } finally {
    database?.close();
  }
}

// Save a translation
export async function saveCachedTranslation(
  text,
  sourceLanguage,
  targetLanguage,
  data,
) {
  let database;

  try {
    database = await openDatabase();

    const key = createCacheKey(
      text,
      sourceLanguage,
      targetLanguage,
    );

    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(
        STORE_NAME,
        'readwrite',
      );

      const store = transaction.objectStore(STORE_NAME);

      store.put({
        key,
        data,
        createdAt: Date.now(),
        expiresAt: Date.now() + CACHE_TTL,
      });

      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('LEO cache storage error:', error);
    return false;
  } finally {
    database?.close();
  }
};