'use client';

import { useState, useEffect, useCallback } from 'react';

export function useMasterData(user) {
  const [masterStats, setMasterStats] = useState(null);
  const [owners, setOwners] = useState([]);
  const [stores, setStores] = useState([]);
  const [logs, setLogs] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, storesRes, logsRes, healthRes] = await Promise.all([
        fetch('/api/master-stats'),
        fetch('/api/stores?hierarchical=true'),
        fetch('/api/system/logs'),
        fetch('/api/system/health')
      ]);
      
      const stats = statsRes.ok ? await statsRes.json() : {};
      const storesData = storesRes.ok ? await storesRes.json() : [];
      const logsData = logsRes.ok ? await logsRes.json() : [];
      const healthData = healthRes.ok ? await healthRes.json() : {};

      setMasterStats(stats);
      
      if (user?.role === 'superadmin') {
        const ownerRows = Array.isArray(storesData) ? storesData : [];
        setOwners(ownerRows);
        setStores(ownerRows.flatMap(owner => owner.stores || []));
      } else {
        setStores(Array.isArray(storesData) ? storesData : []);
      }
      
      setLogs(Array.isArray(logsData) ? logsData : []);
      setHealth(healthData);
    } catch (error) {
      console.error('[MasterData] Fetch failure:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetch('/api/system/logs').then(r => r.json()).then(data => setLogs(Array.isArray(data) ? data : []));
      fetch('/api/system/health').then(r => r.json()).then(data => setHealth(data));
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    masterStats,
    owners,
    stores,
    logs,
    health,
    loading,
    fetchData,
    setOwners,
    setStores,
    setLogs
  };
}
