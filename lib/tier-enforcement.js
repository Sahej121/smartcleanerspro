import { query } from './db/db';
import { TIERS } from './tier-config';

/**
 * Reconciles an owner's active stores against their subscription tier limits.
 * If the owner has more active stores than allowed, the newest stores are suspended.
 * 
 * @param {object} client - The DB client (to be used within a transaction)
 * @param {number} ownerId - The ID of the store owner
 * @param {string} targetTier - The new tier being applied
 */
export async function reconcileStoreLimits(client, ownerId, targetTier) {
  const config = TIERS[targetTier];
  if (!config) throw new Error(`Invalid tier: ${targetTier}`);

  // 1. Update ALL stores for this owner to the new tier to ensure consistency
  // (In this system, tiers are stored on the 'stores' table)
  await client.query(
    'UPDATE stores SET subscription_tier = $1 WHERE owner_id = $2',
    [targetTier, ownerId]
  );

  // 2. Fetch all active/suspended stores for the owner
  const res = await client.query(
    `SELECT id, status, created_at 
     FROM stores 
     WHERE owner_id = $1 AND status != 'idle'
     ORDER BY created_at ASC`,
    [ownerId]
  );

  const stores = res.rows;
  const limit = config.maxStores === -1 ? Infinity : config.maxStores;

  // 3. Determine which stores should be active vs suspended
  for (let i = 0; i < stores.length; i++) {
    const store = stores[i];
    const shouldBeActive = i < limit; // Keep oldest stores active up to the limit

    if (shouldBeActive && store.status === 'suspended') {
      // Re-activate if under limit
      await client.query("UPDATE stores SET status = 'active' WHERE id = $1", [store.id]);
    } else if (!shouldBeActive && store.status === 'active') {
      // Suspend if over limit
      await client.query("UPDATE stores SET status = 'suspended' WHERE id = $1", [store.id]);
      
      // Log the suspension for the security audit
      await client.query(
        "INSERT INTO system_logs (event_type, description, severity, store_id) VALUES ($1, $2, $3, $4)",
        ['STORE_SUSPENDED', `Store suspended automatically due to tier downgrade (${targetTier} limit: ${limit})`, 'warning', store.id]
      );
    }
  }

  return { limit, total: stores.length, suspended: Math.max(0, stores.length - limit) };
}
