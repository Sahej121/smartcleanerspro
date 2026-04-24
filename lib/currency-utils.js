import { getCurrencyConfig } from './currency-config';

/**
 * Formats a numeric value as a currency string based on the country.
 * @param {number} amount
 * @param {string} countryName
 * @param {object} options - Intl.NumberFormat options
 */
export function formatCurrency(amount, countryName, options = {}) {
  const config = getCurrencyConfig(countryName);
  
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    maximumFractionDigits: 0,
    ...options
  }).format(amount || 0);
}

/**
 * Attempts to detect the user's country based on browser locale or timezone.
 * Returns the matched country name from our config.
 */
export function detectCountry() {
  if (typeof window === 'undefined') return 'India';

  try {
    const locale = window.navigator.language;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Mapping timezones to countries
    if (timeZone.includes('London') || locale.includes('GB')) return 'United Kingdom';
    if (timeZone.includes('New_York') || timeZone.includes('Los_Angeles') || locale.includes('US')) return 'United States';
    if (timeZone.includes('Berlin') || timeZone.includes('Munich') || locale.includes('DE')) return 'Germany';
    if (timeZone.includes('Paris') || locale.includes('FR')) return 'France';
    if (timeZone.includes('Sydney') || timeZone.includes('Melbourne') || locale.includes('AU')) return 'Australia';
    if (timeZone.includes('Auckland') || locale.includes('NZ')) return 'New Zealand';
    if (timeZone.includes('Toronto') || timeZone.includes('Vancouver') || locale.includes('CA')) return 'Canada';
    if (timeZone.includes('Kolkata') || locale.includes('IN')) return 'India';
  } catch (e) {
    console.error('Failed to detect country:', e);
  }

  return 'India'; // Default fallback
}
