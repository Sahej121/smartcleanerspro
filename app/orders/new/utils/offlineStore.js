import { get, set, del, keys } from 'idb-keyval';

const BOOTSTRAP_KEY = 'pos_bootstrap';
const OFFLINE_ORDERS_KEY = 'offline_orders';
const CUSTOMER_CACHE_KEY = 'customer_cache';

export const offlineStore = {
  // Bootstrap Data
  saveBootstrap: async (data) => {
    await set(BOOTSTRAP_KEY, data);
  },
  getBootstrap: async () => {
    return await get(BOOTSTRAP_KEY);
  },

  // Customer Cache
  cacheCustomers: async (query, results) => {
    const cache = (await get(CUSTOMER_CACHE_KEY)) || {};
    cache[query] = results;
    // Limit cache size to 20 queries
    const queries = Object.keys(cache);
    if (queries.length > 20) {
      delete cache[queries[0]];
    }
    await set(CUSTOMER_CACHE_KEY, cache);
  },
  getCachedCustomers: async (query) => {
    const cache = await get(CUSTOMER_CACHE_KEY);
    return cache ? cache[query] : null;
  },

  // Offline Orders
  saveOfflineOrder: async (order) => {
    const orders = (await get(OFFLINE_ORDERS_KEY)) || [];
    const id = Date.now().toString();
    orders.push({ ...order, offlineId: id, createdAt: new Date().toISOString() });
    await set(OFFLINE_ORDERS_KEY, orders);
    return id;
  },
  getOfflineOrders: async () => {
    return (await get(OFFLINE_ORDERS_KEY)) || [];
  },
  removeOfflineOrder: async (offlineId) => {
    const orders = (await get(OFFLINE_ORDERS_KEY)) || [];
    const filtered = orders.filter(o => o.offlineId !== offlineId);
    await set(OFFLINE_ORDERS_KEY, filtered);
  },

  // Generic Sync Tasks
  saveSyncTask: async (task) => {
    const tasks = (await get('offline_sync_tasks')) || [];
    const id = Date.now().toString();
    tasks.push({ ...task, offlineId: id, createdAt: new Date().toISOString() });
    await set('offline_sync_tasks', tasks);
    return id;
  },
  getSyncTasks: async () => {
    return (await get('offline_sync_tasks')) || [];
  },
  removeSyncTask: async (offlineId) => {
    const tasks = (await get('offline_sync_tasks')) || [];
    const filtered = tasks.filter(t => t.offlineId !== offlineId);
    await set('offline_sync_tasks', filtered);
  }
};
