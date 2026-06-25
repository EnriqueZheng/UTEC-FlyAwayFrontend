const KEY = 'bookingIds';

export function getBookingIds(): number[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

export function addBookingId(id: number): void {
  const ids = getBookingIds();
  if (!ids.includes(id)) {
    localStorage.setItem(KEY, JSON.stringify([...ids, id]));
  }
}
