import { ParsedQs } from 'qs';

export function parseQueryString(value: string | ParsedQs | string[] | ParsedQs[] | undefined): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    return typeof first === 'string' ? first : undefined;
  }
  return undefined;
}

export function parseQueryDate(value: string | ParsedQs | string[] | ParsedQs[] | undefined): Date | undefined {
  const str = parseQueryString(value);
  if (!str) return undefined;
  const date = new Date(str);
  return isNaN(date.getTime()) ? undefined : date;
}

export function parseQueryNumber(value: string | ParsedQs | string[] | ParsedQs[] | undefined): number | undefined {
  const str = parseQueryString(value);
  if (!str) return undefined;
  const num = parseInt(str, 10);
  return isNaN(num) ? undefined : num;
}
