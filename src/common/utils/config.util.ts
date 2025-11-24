/**
 * Configuration Utilities
 * Helper functions for parsing environment variables
 */

/**
 * Convert string to boolean
 * Handles: 'true', '1', 'yes', 'on' → true
 *          'false', '0', 'no', 'off', '', undefined → false
 * 
 * @param value - String value from environment variable
 * @param defaultValue - Default value if value is undefined or empty
 * @returns Parsed boolean value
 * 
 * @example
 * parseBoolean('true') // true
 * parseBoolean('false') // false
 * parseBoolean('1') // true
 * parseBoolean('0') // false
 * parseBoolean(undefined, true) // true (default)
 */
export function parseBoolean(value: string | undefined, defaultValue = false): boolean {
  if (!value) {
    return defaultValue;
  }

  const normalized = value.toLowerCase().trim();
  
  return ['true', '1', 'yes', 'on'].includes(normalized);
}

/**
 * Convert string to number with validation
 * 
 * @param value - String value from environment variable
 * @param defaultValue - Default value if value is invalid or undefined
 * @returns Parsed number value
 * 
 * @example
 * parseNumber('123', 0) // 123
 * parseNumber('invalid', 0) // 0 (default)
 * parseNumber(undefined, 100) // 100 (default)
 */
export function parseNumber(value: string | undefined, defaultValue: number): number {
  if (!value) {
    return defaultValue;
  }

  const parsed = Number(value);
  
  if (isNaN(parsed)) {
    return defaultValue;
  }

  return parsed;
}

/**
 * Convert string to integer with validation
 * 
 * @param value - String value from environment variable
 * @param defaultValue - Default value if value is invalid or undefined
 * @returns Parsed integer value
 * 
 * @example
 * parseInteger('123', 0) // 123
 * parseInteger('123.45', 0) // 123
 * parseInteger('invalid', 0) // 0 (default)
 */
export function parseInteger(value: string | undefined, defaultValue: number): number {
  if (!value) {
    return defaultValue;
  }

  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed)) {
    return defaultValue;
  }

  return parsed;
}

