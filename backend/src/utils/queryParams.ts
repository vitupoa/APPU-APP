import { ParsedQs } from 'qs';

/**
 * Safely extract a string value from Express query parameters
 * Handles string | string[] | ParsedQs | (string | ParsedQs)[] types
 */
export function getQueryString(value: string | string[] | ParsedQs | (string | ParsedQs)[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === 'string' ? first : undefined;
  }
  if (typeof value === 'string') return value;
  return undefined;
}

/**
 * Safely extract a number value from Express query parameters
 */
export function getQueryNumber(value: string | string[] | ParsedQs | (string | ParsedQs)[] | undefined): number | undefined {
  const str = getQueryString(value);
  if (!str) return undefined;
  const num = parseInt(str, 10);
  return isNaN(num) ? undefined : num;
}

/**
 * Safely extract a boolean value from Express query parameters
 */
export function getQueryBoolean(value: string | string[] | ParsedQs | (string | ParsedQs)[] | undefined): boolean | undefined {
  const str = getQueryString(value);
  if (!str) return undefined;
  return str === 'true' || str === '1';
}

/**
 * Safely extract an array of strings from Express query parameters
 */
export function getQueryArray(value: string | string[] | ParsedQs | (string | ParsedQs)[] | undefined): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  if (typeof value === 'string') return [value];
  return [];
}

/**
 * Safely extract a Date from Express query parameters
 */
export function getQueryDate(value: string | string[] | ParsedQs | (string | ParsedQs)[] | undefined): Date | undefined {
  const str = getQueryString(value);
  if (!str) return undefined;
  const date = new Date(str);
  return isNaN(date.getTime()) ? undefined : date;
}
