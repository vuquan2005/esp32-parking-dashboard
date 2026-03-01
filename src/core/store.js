import { SlotState } from '../utils/constants.js';
import { TOTAL_SLOTS } from '../core/protocol.js';

/**
 * Global reactive state store with pub/sub.
 *
 * Shape:
 *   slots    – Map<sid:number, { sid, st, uid }>
 *   history  – Array<TxRecord>
 *   filters  – { sid: number|null, status: number|null }
 */

/** @type {Map<string, Set<Function>>} */
const subscribers = new Map();

/** Internal state */
const state = {
    /** @type {Map<number, { sid: number, st: number, uid: number|null }>} */
    slots: new Map(
        Array.from({ length: TOTAL_SLOTS }, (_, i) => [
            i + 1,
            { sid: i + 1, st: SlotState.EMPTY, uid: null },
        ])
    ),

    /** @type {Array<Object>} */
    history: [],

    /** Active filters (now numeric) */
    filters: {
        sid: null,
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
