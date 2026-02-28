import { SLOT_NAMES, SlotStatus } from '../utils/constants.js';

/**
 * Global reactive state store with pub/sub.
 *
 * Shape:
 *   slots    – Map<slotName, { id, name, status, uid }>
 *   history  – Array<TxRecord>
 *   filters  – { slot: string|null, status: string|null }
 */

/** @type {Map<string, Set<Function>>} */
const subscribers = new Map();

/** Internal state */
const state = {
    /** @type {Map<string, { id: number, name: string, status: string, uid: string|null }>} */
    slots: new Map(
        SLOT_NAMES.map((name, i) => [
            name,
            { id: i + 1, name, status: SlotStatus.EMPTY, uid: null },
        ])
    ),

    /** @type {Array<Object>} */
    history: [],

    /** Active filters */
    filters: {
        slot: null,
        status: null,
    },
};

/**
 * Get a shallow snapshot of the whole state or a specific key.
 * @param {string} [key]
 */
export function getState(key) {
    if (key) return state[key];
    return state;
}

/**
 * Merge a partial update into state and notify subscribers.
 * @param {Partial<typeof state>} partial
 */
export function setState(partial) {
    for (const [key, value] of Object.entries(partial)) {
        state[key] = value;
        notify(key);
    }
}

/**
 * Subscribe to changes on a specific state key.
 * @param {string} key
 * @param {Function} fn
 * @returns {Function} unsubscribe
 */
export function subscribe(key, fn) {
    if (!subscribers.has(key)) subscribers.set(key, new Set());
    subscribers.get(key).add(fn);
    return () => subscribers.get(key)?.delete(fn);
}

/** Notify all subscribers for a given key. */
function notify(key) {
    subscribers.get(key)?.forEach((fn) => fn(state[key]));
}
