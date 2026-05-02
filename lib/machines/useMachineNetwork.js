'use client';
import { useState, useEffect, useCallback } from 'react';

/**
 * Mock Hardware Node Emulator
 * Simulates real-time telemetry from industrial machinery
 */
export function useMachineNetwork(storeId) {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);

  const fetchMachines = useCallback(async () => {
    try {
      const res = await fetch('/api/machines');
      if (res.ok) {
        const data = await res.json();
        
        // Inject telemetry for active machines
        const augmentedData = data.map(m => {
          if (m.status === 'running') {
            return {
              ...m,
              telemetry: {
                temp: 45 + Math.random() * 20,
                vibration: Math.random() * 5,
                progress: Math.min(100, (m.progress || 0) + Math.random() * 5)
              }
            };
          }
          return m;
        });
        
        setMachines(augmentedData);
      }
    } catch (err) {
      console.error('[Machine Network] Sync Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMachines();
    if (isLive) {
      const interval = setInterval(fetchMachines, 3000); // 3s polling for "Live" mode
      return () => clearInterval(interval);
    }
  }, [isLive, fetchMachines]);

  return { machines, loading, isLive, setIsLive, refresh: fetchMachines };
}
