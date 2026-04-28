import { useEffect, useState, useCallback } from 'react';
import { offlineStore } from '../utils/offlineStore';

export function useBackgroundSync() {
  const [syncing, setSyncing] = useState(false);
  const [offlineCount, setOfflineCount] = useState(0);

  const checkOfflineOrders = useCallback(async () => {
    const orders = await offlineStore.getOfflineOrders();
    setOfflineCount(orders.length);
    return orders;
  }, []);

  const syncOrders = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    
    const orders = await checkOfflineOrders();
    if (orders.length === 0) return;

    setSyncing(true);
    for (const order of orders) {
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...order, offlineSync: true })
        });
        
        if (res.ok) {
          await offlineStore.removeOfflineOrder(order.offlineId);
        }
      } catch (err) {
        console.error('[Sync Error]:', err);
        // Stop syncing if we're still having network issues
        break;
      }
    }
    await checkOfflineOrders();
    setSyncing(false);
  }, [checkOfflineOrders]);

  useEffect(() => {
    checkOfflineOrders();
    
    const handleOnline = () => {
      syncOrders();
    };

    window.addEventListener('online', handleOnline);
    // Periodically check if we're online and have orders
    const interval = setInterval(syncOrders, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [syncOrders, checkOfflineOrders]);

  return { syncing, offlineCount, syncOrders, checkOfflineOrders };
}
