/**
 * Geolocation utilities
 * Detecta la zona horaria y moneda basada en la ubicación del usuario
 */

import jstz from 'jstz';

/**
 * Obtiene la zona horaria del usuario
 */
export function getUserTimezone(): string {
  try {
    const tz = jstz.determine();
    return tz.name();
  } catch (error) {
    console.error('Error detectando zona horaria:', error);
    return 'UTC';
  }
}

/**
 * Obtiene la moneda basada en la zona horaria
 * Por defecto devuelve USD, pero puede adaptarse según el país
 */
export function getUserCurrency(): string {
  try {
    const timezone = getUserTimezone();
    
    // Mapeo de zonas horarias a monedas
    const timezoneToCountry: { [key: string]: string } = {
      // América del Norte
      'America/New_York': 'USD',
      'America/Chicago': 'USD',
      'America/Denver': 'USD',
      'America/Los_Angeles': 'USD',
      'America/Anchorage': 'USD',
      'America/Toronto': 'CAD',
      'America/Mexico_City': 'MXN',
      
      // América Central y del Sur
      'America/Guatemala': 'GTQ',
      'America/El_Salvador': 'USD',
      'America/Honduras': 'HNL',
      'America/Nicaragua': 'NIO',
      'America/Costa_Rica': 'CRC',
      'America/Panama': 'PAB',
      'America/Colombia': 'COP',
      'America/Ecuador': 'USD',
      'America/Peru': 'PEN',
      'America/Bolivia': 'BOB',
      'America/Chile': 'CLP',
      'America/Argentina/Buenos_Aires': 'ARS',
      'America/Montevideo': 'UYU',
      'America/Paramaribo': 'SRD',
      'America/Cayenne': 'EUR',
      
      // Europa
      'Europe/London': 'GBP',
      'Europe/Dublin': 'EUR',
      'Europe/Paris': 'EUR',
      'Europe/Berlin': 'EUR',
      'Europe/Madrid': 'EUR',
      'Europe/Rome': 'EUR',
      'Europe/Amsterdam': 'EUR',
      'Europe/Brussels': 'EUR',
      'Europe/Vienna': 'EUR',
      'Europe/Prague': 'CZK',
      'Europe/Budapest': 'HUF',
      'Europe/Warsaw': 'PLN',
      'Europe/Moscow': 'RUB',
      'Europe/Istanbul': 'TRY',
      'Europe/Athens': 'EUR',
      'Europe/Helsinki': 'EUR',
      'Europe/Stockholm': 'SEK',
      'Europe/Oslo': 'NOK',
      'Europe/Copenhagen': 'DKK',
      'Europe/Zurich': 'CHF',
      
      // Asia
      'Asia/Tokyo': 'JPY',
      'Asia/Seoul': 'KRW',
      'Asia/Shanghai': 'CNY',
      'Asia/Hong_Kong': 'HKD',
      'Asia/Singapore': 'SGD',
      'Asia/Bangkok': 'THB',
      'Asia/Kuala_Lumpur': 'MYR',
      'Asia/Jakarta': 'IDR',
      'Asia/Manila': 'PHP',
      'Asia/Kolkata': 'INR',
      'Asia/Dubai': 'AED',
      'Asia/Tehran': 'IRR',
      'Asia/Karachi': 'PKR',
      
      // Oceanía
      'Australia/Sydney': 'AUD',
      'Australia/Melbourne': 'AUD',
      'Australia/Brisbane': 'AUD',
      'Australia/Perth': 'AUD',
      'Australia/Adelaide': 'AUD',
      'Pacific/Auckland': 'NZD',
      'Pacific/Fiji': 'FJD',
      
      // Afrika
      'Africa/Johannesburg': 'ZAR',
      'Africa/Cairo': 'EGP',
      'Africa/Lagos': 'NGN',
      'Africa/Nairobi': 'KES',
    };
    
    return timezoneToCountry[timezone] || 'USD';
  } catch (error) {
    console.error('Error detectando moneda:', error);
    return 'USD';
  }
}

/**
 * Obtiene ambos valores: timezone y currency
 */
export function getUserLocationDefaults() {
  return {
    timezone: getUserTimezone(),
    currency: getUserCurrency(),
  };
}
