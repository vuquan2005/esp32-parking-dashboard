import { SlotState } from '../utils/constants';
import { TOTAL_SLOTS } from './protocol';
import type { SlotData, AppState } from '../types';

/**
 * Global reactive state store with typed pub/sub.
 */

type Subscriber<T> = (value: T) => void;

const subscribers = new Map<keyof AppState, Set<Subscriber<never>>>();

/** Internal state */
const state: AppState = {
    slots: new Map<number, SlotData>(
        Array.from({ length: TOTAL_SLOTS }, (_, i): [number, SlotData] => [
            i + 1,
            { sid: i + 1, st: SlotState.EMPTY, uid: null },
        ])
    ),
    history: [],
    filters: {
        sid: null,
        status: null,
    },
};

/**
 * Get a shallow snapshot of the whole state or a specific key.
 */
export function getState(): AppState;
export function getState<K extends keyof AppState>(key: K): AppState[K];
export function getState(key?: keyof AppState): unknown {
    if (key) return state[key];
    return state;
}

/** Type-safe internal assignment. */
function assignState<K extends keyof AppState>(key: K, value: AppState[K]): void {
    state[key] = value;
}

/**
 * Merge a partial update into state and notify subscribers.
 */
export function setState(partial: Partial<AppState>): void {
    for (const key of Object.keys(partial) as (keyof AppState)[]) {
        assignState(key, partial[key] as AppState[typeof key]);
        notify(key);
    }
}

/**
 * Subscribe to changes on a specific state key (typed).
 */
export function subscribe<K extends keyof AppState>(
    key: K,
    fn: Subscriber<AppState[K]>
): () => void {
    if (!subscribers.has(key)) subscribers.set(key, new Set());
    subscribers.get(key)!.add(fn as Subscriber<never>);
    return () => subscribers.get(key)?.delete(fn as Subscriber<never>);
}

/** Notify all subscribers for a given key. */
function notify(key: keyof AppState): void {
    subscribers.get(key)?.forEach((fn) => (fn as Subscriber<AppState[typeof key]>)(state[key]));
}
