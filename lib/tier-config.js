/**
 * CleanFlow Subscription Tier Configuration
 * Defines limits and features for each subscription tier.
 * Prices and features are aligned with the current public pricing model.
 */

export const PRICING_MARKETS = {
  us: { id: 'us', label: 'United States', currency: '$', flag: '🇺🇸', prices: { software_only: '99', hardware_bundle: '199' } },
  europe: { id: 'europe', label: 'Europe', currency: '€', flag: '🇪🇺', prices: { software_only: '79', hardware_bundle: '149' } },
  uae: { id: 'uae', label: 'UAE', currency: 'AED', flag: '🇦🇪', prices: { software_only: '299', hardware_bundle: '549' } },
  india: { id: 'india', label: 'India', currency: '₹', flag: '🇮🇳', prices: { software_only: '1,299', hardware_bundle: '3,299' } },
  latam: { id: 'latam', label: 'Latin America', currency: '$', flag: '🌎', prices: { software_only: '25', hardware_bundle: '59' } },
};

export const TIERS = {
  software_only: {
    label: 'Software Only',
    icon: 'cloud_done',
    color: 'blue',
    maxStores: 1,
    maxStaffPerStore: 10,
    analytics: 'basic',
    inventoryForecasting: false,
    support: 'Standard (Email & Phone)',
    features: [
      'Unlimited Orders',
      'Works on your own hardware',
      'Cloud-based POS (Web/App)',
      'Customer Database & CRM',
      'Social Media Notifications',
      'Barcode & Label Printing',
      'Basic Reporting & Analytics'
    ],
    whiteLabel: false,
    machineOps: false,
    stainAnalysis: true,
  },
  hardware_bundle: {
    label: 'Software + Hardware Bundle',
    icon: 'inventory',
    color: 'emerald',
    maxStores: 5,
    maxStaffPerStore: -1, // Unlimited staff for the bundle
    analytics: 'advanced',
    inventoryForecasting: true,
    support: '24/7 Priority Support',
    features: [
      'Everything in Software Only',
      'EPOS Terminal + Drawer + Printer',
      'Workflow & Delivery Management',
      'Multi-store Capability (up to 5)',
      'Loyalty & Marketing Tools',
      'Advanced Staff Permissions',
      'Enterprise Reporting'
    ],
    assemblyWorkflow: true,
    whiteLabel: true,
    machineOps: false,
    stainAnalysis: true,
  },
  enterprise: {
    label: 'Enterprise',
    icon: 'hub',
    color: 'purple',
    maxStores: -1,
    maxStaffPerStore: -1,
    analytics: 'enterprise',
    inventoryForecasting: true,
    support: 'Dedicated Account Manager',
    features: [
      'Everything in Hardware Bundle',
      'Unlimited Store Locations',
      'Unlimited Staff Members',
      'Dedicated Account Manager',
      '24/7 Priority Phone Support',
      'White-label Branding Options',
      'Full API Access & Integrations',
      'Custom Feature Development'
    ],
    assemblyWorkflow: true,
    whiteLabel: true,
    machineOps: true,
    stainAnalysis: true,
  }
};

/**
 * Get localized price for a tier and market.
 */
export function getTierPrice(tierKey, marketId = 'us') {
  if (tierKey === 'enterprise') return 'Contact Sales';
  const market = PRICING_MARKETS[marketId] || PRICING_MARKETS.us;
  const price = market.prices[tierKey];
  return `${market.currency}${price}`;
}

/**
 * Tier hierarchy for comparison (higher index = higher tier).
 */
const TIER_ORDER = ['software_only', 'hardware_bundle', 'enterprise'];

/**
 * Route access per tier.
 * Each tier lists the route prefixes its subscribers can access.
 * Routes not in the list for a tier are hidden and blocked.
 */
export const TIER_ROUTE_ACCESS = {
  software_only: [
    '/',
    '/orders',
    '/customers',
    '/inventory',
    '/logistics',
    '/admin/settings',
    '/support',
    '/reports',
  ],
  hardware_bundle: [
    '/',
    '/orders',
    '/customers',
    '/inventory',
    '/logistics',
    '/admin/settings',
    '/admin/analytics',     // Staff Analytics
    '/operations/assembly', // Assembly workflow
    '/support',
    '/reports',
  ],
  enterprise: [
    '*', // Full access to everything
  ],
};

/**
 * Normalize legacy tier names to the canonical 3-tier model.
 * Handles DB values that haven't been migrated yet.
 */
export function normalizeTier(tier) {
  const map = {
    starter: 'software_only',
    standard: 'software_only',
    growth: 'hardware_bundle',
    pro: 'enterprise',
  };
  return map[tier] || tier || 'software_only';
}

/**
 * Check if a given tier can access a given route.
 * @param {string} tier - The subscription tier (will be normalized).
 * @param {string} route - The pathname to check (e.g., '/admin/analytics/staff').
 * @returns {boolean}
 */
export function canAccessRoute(tier, route) {
  const normalized = normalizeTier(tier);
  const allowed = TIER_ROUTE_ACCESS[normalized];
  if (!allowed) return false;

  // Enterprise has wildcard access
  if (allowed.includes('*')) return true;

  // Check if the route starts with any allowed prefix
  return allowed.some(prefix => {
    if (prefix === '/') return route === '/';
    return route === prefix || route.startsWith(prefix + '/');
  });
}

/**
 * Get the minimum tier required for a route.
 * Returns the tier label string for UI display, or null if accessible on all tiers.
 */
export function getRequiredTier(route) {
  for (const tierKey of TIER_ORDER) {
    if (canAccessRoute(tierKey, route)) return null; // accessible at this level already
  }
  return null;
}

/**
 * Compare two tiers. Returns true if tierA >= tierB.
 */
export function isTierAtLeast(tierA, tierB) {
  const a = TIER_ORDER.indexOf(normalizeTier(tierA));
  const b = TIER_ORDER.indexOf(normalizeTier(tierB));
  return a >= b;
}

/**
 * Check if a tier has a specific feature enabled.
 */
export function hasFeature(tier, feature) {
  const config = TIERS[normalizeTier(tier)];
  if (!config) return false;
  return !!config[feature];
}

/**
 * Check if a tier allows creating more stores.
 */
export function canCreateStore(tier, currentStoreCount) {
  const config = TIERS[normalizeTier(tier)];
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
 */
export function canAddStaff(tier, currentStaffCount) {
  const config = TIERS[normalizeTier(tier)];
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

export const ADD_ONS = [
  {
    id: 'qr_scanner',
    label: 'QR Code Scanner',
    icon: 'qr_code_scanner',
    billing: 'one_time',
    amount: 250,
    period: 'one-time',
    marketPricing: {
      india: { amount: 3000, period: 'one-time' },
    },
  },
  {
    id: 'wet_printer',
    label: 'Wet Ticket Printer',
    icon: 'print',
    billing: 'one_time',
    amount: 75,
    period: 'one-time',
    marketPricing: {
      india: { amount: 2499, period: 'one-time' },
    },
  },
  {
    id: 'branded_site',
    label: 'Branded Website/Orders',
    icon: 'language',
    billing: 'monthly',
    amount: 20,
    period: 'per month',
    marketPricing: {
      india: { amount: 1200, period: 'per month' },
    },
  },
  {
    id: 'driver_app',
    label: 'Driver App',
    icon: 'local_shipping',
    billing: 'monthly',
    amount: 15,
    period: 'per month',
    marketPricing: {
      india: { amount: 799, period: 'per month' },
    },
  },
];

export function getAddonPricing(addon, marketId = 'us') {
  const marketPrice = addon.marketPricing?.[marketId];
  return {
    amount: marketPrice?.amount ?? addon.amount,
    period: marketPrice?.period ?? addon.period,
    billing: addon.billing || 'monthly',
  };
}
