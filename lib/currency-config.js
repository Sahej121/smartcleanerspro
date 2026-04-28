/**
 * Currency and Locale Configuration
 * Maps countries to their respective currency codes and locales.
 */
export const COUNTRY_CURRENCY_MAP = {
  'India': { code: 'INR', locale: 'en-IN', symbol: '₹' },
  'United Kingdom': { code: 'GBP', locale: 'en-GB', symbol: '£' },
  'United States': { code: 'USD', locale: 'en-US', symbol: '$' },
  'Germany': { code: 'EUR', locale: 'de-DE', symbol: '€' },
  'France': { code: 'EUR', locale: 'fr-FR', symbol: '€' },
  'Italy': { code: 'EUR', locale: 'it-IT', symbol: '€' },
  'Spain': { code: 'EUR', locale: 'es-ES', symbol: '€' },
  'Australia': { code: 'AUD', locale: 'en-AU', symbol: 'A$' },
  'New Zealand': { code: 'NZD', locale: 'en-NZ', symbol: 'NZ$' },
  'Canada': { code: 'CAD', locale: 'en-CA', symbol: 'C$' },
};

export const DEFAULT_CURRENCY = { code: 'INR', locale: 'en-IN', symbol: '₹' };

export function getCurrencyConfig(countryName) {
  return COUNTRY_CURRENCY_MAP[countryName] || DEFAULT_CURRENCY;
}
