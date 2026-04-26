import { format, formatDistanceToNow } from 'date-fns';

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatCurrency(amount: number | string, currency = 'KES') {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency }).format(num);
}

export function formatNumber(num: number) {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function truncate(str: string, len = 50) {
  return str.length > len ? str.slice(0, len) + '...' : str;
}
