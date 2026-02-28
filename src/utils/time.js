/**
 * Format a Date object to HH:mm:ss string.
 * @param {Date} [date] – defaults to now
 * @returns {string}
 */
export function formatTime(date = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
