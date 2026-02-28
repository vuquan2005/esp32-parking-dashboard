/**
 * Minimal event emitter for cross-module communication.
 *
 * Usage:
 *   eventBus.on('slot:click', (slotId) => { ... });
 *   eventBus.emit('slot:click', 'A1');
 */

/** @type {Map<string, Set<Function>>} */
const listeners = new Map();

export const eventBus = Object.freeze({
    /**
     * Subscribe to an event.
     * @param {string} event
     * @param {Function} fn
     */
    on(event, fn) {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event).add(fn);
    },

    /**
     * Unsubscribe from an event.
     * @param {string} event
     * @param {Function} fn
     */
    off(event, fn) {
        listeners.get(event)?.delete(fn);
    },

    /**
     * Emit an event with optional data.
     * @param {string} event
     * @param {*} data
     */
    emit(event, data) {
        listeners.get(event)?.forEach((fn) => fn(data));
    },
});
