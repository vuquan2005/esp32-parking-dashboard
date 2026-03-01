/**
 * Type-safe event emitter for cross-module communication.
 *
 * Usage:
 *   eventBus.on('ws:ack', (data) => { data.rid … });  // ← fully typed
 *   eventBus.emit('ws:ack', ackMsg);
 */

import type {
    AckMessage,
    SyncResponseMessage,
    SlotStatusMessage,
    HistoryMessage,
    ProgressMessage,
    ErrorMessage,
    Filters,
} from '../types';

// ── Event payload map ────────────────────────────────────────
export interface EventMap {
    'ws:ack': AckMessage;
    'ws:sync_res': SyncResponseMessage;
    'ws:slot_status': SlotStatusMessage;
    'ws:history': HistoryMessage;
    'ws:progress': ProgressMessage;
    'ws:error': ErrorMessage;
    'ws:open': undefined;
    'ws:close': undefined;
    'filter:change': Filters;
}

type EventName = keyof EventMap;
type Listener<E extends EventName> = (data: EventMap[E]) => void | Promise<void>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const listeners = new Map<string, Set<Listener<any>>>();

export const eventBus = Object.freeze({
    /** Subscribe to a typed event. */
    on<E extends EventName>(event: E, fn: Listener<E>): void {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event)!.add(fn);
    },

    /** Unsubscribe from an event. */
    off<E extends EventName>(event: E, fn: Listener<E>): void {
        listeners.get(event)?.delete(fn);
    },

    /** Emit a typed event with its payload. */
    emit<E extends EventName>(
        event: E,
        ...args: EventMap[E] extends undefined ? [] : [data: EventMap[E]]
    ): void {
        const data = args[0];
        listeners.get(event)?.forEach((fn) => {
            try {
                const result = fn(data as EventMap[E]);
                if (result instanceof Promise) {
                    result.catch((err: unknown) =>
                        console.error(`[EventBus] async error in "${event}":`, err)
                    );
                }
            } catch (err) {
                console.error(`[EventBus] error in "${event}":`, err);
            }
        });
    },
});
