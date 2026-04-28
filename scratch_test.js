const TIER_LEGACY_MAP = {
  starter: 'software_only',
  standard: 'software_only',
  growth: 'hardware_bundle',
  pro: 'enterprise',
};

const TIER_ROUTES = {
  software_only: [
    '/', '/orders', '/customers', '/inventory', '/logistics',
    '/admin/settings', '/support', '/reports', '/admin/billing',
    '/admin/pricing', '/suspended',
    '/api/stores', '/api/stats', '/api/system', '/api/customers', '/api/orders', '/api/inventory', '/api/logistics', '/api/pricing', '/api/coupons', '/api/payments', '/api/stain-analysis',
    '/api/analytics', '/api/reports', '/api/staff', '/api/tasks'
  ],
  hardware_bundle: [
    '/', '/orders', '/customers', '/inventory', '/logistics',
    '/admin/settings', '/admin/analytics', '/operations/assembly',
    '/support', '/reports', '/admin/billing',
    '/admin/pricing', '/suspended',
    '/api/stores', '/api/stats', '/api/system', '/api/customers', '/api/orders', '/api/inventory', '/api/logistics', '/api/analytics', '/api/pricing', '/api/coupons', '/api/payments', '/api/stain-analysis',
    '/api/reports', '/api/staff', '/api/tasks', '/api/workflow', '/api/operations'
  ],
  enterprise: ['*'],
};

function normalizeTierMw(tier) {
  return TIER_LEGACY_MAP[tier] || tier || 'software_only';
}

function canAccessRouteMw(tier, route) {
  const allowed = TIER_ROUTES[tier];
  if (!allowed) return false;
  if (allowed.includes('*')) return true;
  return allowed.some(prefix => {
    if (prefix === '/') return route === '/';
    return route === prefix || route.startsWith(prefix + '/');
  });
}

const tiersToTest = [undefined, null, '', 'software_only', 'enterprise', 'free'];
const routesToTest = ['/orders/new', '/admin/settings/upgrade', '/marketing/foo'];

for (const t of tiersToTest) {
  const normTier = normalizeTierMw(t);
  for (const r of routesToTest) {
    console.log(`tier: ${t} (${normTier}), route: ${r} -> ${canAccessRouteMw(normTier, r)}`);
  }
}
