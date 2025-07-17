/**
 * Convert SQLite timestamp to JavaScript Date object
 * SQLite stores timestamps in UTC without timezone indicator
 * This function ensures proper conversion considering JST timezone
 */
export function sqliteToDate(timestamp: string | null | undefined): Date | undefined {
  if (!timestamp) return undefined;
  
  // SQLite timestamps are in format 'YYYY-MM-DD HH:mm:ss'
  // They are stored in UTC but don't have 'Z' suffix
  // We need to append 'Z' to ensure JavaScript interprets them as UTC
  return new Date(timestamp + 'Z');
}

/**
 * Format date for display in JST
 */
export function formatDateForDisplay(date: Date | string | undefined, format: 'short' | 'long' = 'short'): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = format === 'short' 
    ? {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Tokyo'
      }
    : {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Tokyo'
      };
  
  return d.toLocaleString('ja-JP', options);
}