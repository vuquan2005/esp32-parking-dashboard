/**
 * Format a Date object to HH:mm:ss string.
 */
export function formatTime(date: Date = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
