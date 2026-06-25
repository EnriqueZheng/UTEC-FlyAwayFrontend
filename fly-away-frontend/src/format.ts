export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export function toIsoUtc(localValue: string): string {
  if (!localValue) return '';
  return new Date(localValue).toISOString();
}
