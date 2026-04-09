/**
 * CleanFlow Subscription Tier Configuration
 * Defines limits and features for each subscription tier.
 * Prices and features are aligned with industry benchmarks (£25/£35 structure).
 */

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
    price: '£25.00/mo',
    features: [
      'Unlimited Orders',
      'Works on your own hardware',
      'Cloud-based POS (Web/App)',
      'Customer Database & CRM',
      'Social Media Notifications',
      'Barcode & Label Printing',
      'Basic Reporting & Analytics'
    ],
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
    price: '£35.00/mo',
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
  },
};

export const ADD_ONS = [
  { id: 'wet_printer', label: 'Wet Ticket Printer', price: '£70', period: 'one-time', icon: 'print' },
  { id: 'extra_device', label: 'Extra Registers/Devices', price: '£5', period: 'per month', icon: 'devices' },
  { id: 'branded_site', label: 'Branded Website/Orders', price: '£20', period: 'per month', icon: 'language' },
  { id: 'driver_app', label: 'Driver App', price: '£15', period: 'per month', icon: 'local_shipping' },
];

/**
 * Check if a tier has a specific feature enabled.
 */
export function hasFeature(tier, feature) {
  const config = TIERS[tier];
  if (!config) return false;
  return !!config[feature];
}

/**
 * Check if a tier allows creating more stores.
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
