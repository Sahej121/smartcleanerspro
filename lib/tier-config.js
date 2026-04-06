/**
 * CleanFlow Subscription Tier Configuration
 * Defines limits and features for each subscription tier.
 */

export const TIERS = {
  starter: {
    label: 'Starter',
    icon: 'storefront',
    color: 'slate',
    maxStores: 1,
    maxStaffPerStore: 5,
    analytics: 'basic',
    inventoryForecasting: false,
    support: 'standard',
    price: '₹999/mo',
    features: [
      'Basic POS + Order Management',
      '1-Store Production Monitor (BOH)',
      'Basic WhatsApp Notifications',
      'Up to 5 staff members',
    ],
  },
  growth: {
    label: 'Growth',
    icon: 'rebase_edit',
    color: 'blue',
    maxStores: 5,
    maxStaffPerStore: 20,
    analytics: 'advanced',
    inventoryForecasting: true,
    support: 'standard',
    price: '₹1,999/mo',
    features: [
      'Multi-store Dashboard (up to 5)',
      'Role-based stage workflows',
      'Integrated Loyalty CRM',
      'WhatsApp-first Logistics',
      'Up to 20 staff per store',
    ],
  },
  pro: {
    label: 'Pro',
    icon: 'rocket_launch',
    color: 'emerald',
    maxStores: 15,
    maxStaffPerStore: -1, // Unlimited
    analytics: 'full',
    inventoryForecasting: true,
    support: 'priority',
    price: '₹3,500/mo',
    features: [
      'Advanced BOH Analytics (Bottleneck alerts)',
      'Dynamic AI Route Optimization',
      'AI Solvent & Machine Tracking',
      'Multi-language + Localization',
      'Up to 15 stores',
      'Premium Assembly Workflow',
    ],
    assemblyWorkflow: true,
  },
};

/**
 * Check if a tier has a specific feature enabled.
 * @param {string} tier - The subscription tier code.
 * @param {string} feature - The feature identifier.
 * @returns {boolean}
 */
export function hasFeature(tier, feature) {
  const config = TIERS[tier];
  if (!config) return false;
  return !!config[feature];
}

/**
 * Check if a tier allows creating more stores.
 * @param {string} tier - The subscription tier code.
 * @param {number} currentStoreCount - How many stores the owner currently has.
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canCreateStore(tier, currentStoreCount) {
  const config = TIERS[tier];
  if (!config) return { allowed: false, reason: 'Invalid subscription tier.' };
  if (config.maxStores === -1) return { allowed: true };
  if (currentStoreCount >= config.maxStores) {
    return {
      allowed: false,
      reason: `Your ${config.label} plan supports up to ${config.maxStores} store(s). Upgrade to add more.`,
    };
  }
  return { allowed: true };
}

/**
 * Check if a store allows adding more staff.
 * @param {string} tier - The subscription tier code.
 * @param {number} currentStaffCount - How many staff the store currently has.
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canAddStaff(tier, currentStaffCount) {
  const config = TIERS[tier];
  if (!config) return { allowed: false, reason: 'Invalid subscription tier.' };
  if (config.maxStaffPerStore === -1) return { allowed: true };
  if (currentStaffCount >= config.maxStaffPerStore) {
    return {
      allowed: false,
      reason: `Your ${config.label} plan supports up to ${config.maxStaffPerStore} staff per store. Upgrade to add more.`,
    };
  }
  return { allowed: true };
}
