import { ParsedQs } from 'qs';

// Type that matches Express req.query property types exactly
type QueryValue = string | ParsedQs | (string | ParsedQs)[] | undefined;

export function parseQueryString(value: QueryValue): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    return typeof first === 'string' ? first : undefined;
  }
  return undefined;
}

export function parseQueryDate(value: QueryValue): Date | undefined {
  const str = parseQueryString(value);
  if (!str) return undefined;
  const date = new Date(str);
  return isNaN(date.getTime()) ? undefined : date;
}

export function parseQueryNumber(value: QueryValue): number | undefined {
  const str = parseQueryString(value);
  if (!str) return undefined;
  const num = parseInt(str, 10);
  return isNaN(num) ? undefined : num;
}

// Aliases for backward compatibility
export const getQueryString = parseQueryString;
export const getQueryDate = parseQueryDate;
export const getQueryNumber = parseQueryNumber;
