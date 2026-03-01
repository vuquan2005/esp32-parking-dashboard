import { eventBus } from './eventBus';
import { parseMessage, buildSyncRequest, buildAck } from './protocol';
import type { BaseMessage, AckMessage, CommandMessage, SyncRequestMessage } from '../types';
import type { EventMap } from './eventBus';

/**
 * WebSocket client with auto-reconnect.
 *
 * Incoming messages follow the api.ts BaseMessage format:
 *   { id, v, t, ... }
 *
 * Each message is decoded by protocol.parseMessage() and forwarded
 * to eventBus as the corresponding typed event.
 *
 * Every incoming message triggers an ACK back to the server.
 * On successful connection, a sync_req is sent automatically.
 */

let socket: WebSocket | null = null;
let reconnectDelay = 1000;
const MAX_DELAY = 30000;
let url = '';

/**
 * Connect to the WebSocket server.
 */
export function connect(wsUrl?: string): void {
    url = wsUrl || `ws://${location.host}/ws`;
    _open();
}

function _open(): void {
    socket = new WebSocket(url);

    socket.addEventListener('open', () => {
        console.log('[WS] connected');
        reconnectDelay = 1000; // reset back-off
        eventBus.emit('ws:open');
        // Auto-sync on connect
        send(buildSyncRequest(0, 0));
    });

    socket.addEventListener('message', (event: MessageEvent) => {
        try {
            const raw = JSON.parse(event.data as string) as BaseMessage;

            // Ack every incoming message
            send(buildAck(raw.id));

            const parsed = parseMessage(raw);
            if (parsed) {
                // Safe: parseMessage guarantees event name matches the data type
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (eventBus.emit as (event: keyof EventMap, data: any) => void)(
                    parsed.event,
                    parsed.data
                );
            } else {
                console.warn('[WS] unknown message type', raw.t);
            }
        } catch {
            console.warn('[WS] invalid JSON', event.data);
        }
    });

    socket.addEventListener('close', () => {
        console.log(`[WS] closed – reconnecting in ${reconnectDelay}ms`);
        eventBus.emit('ws:close');
        setTimeout(() => _open(), reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, MAX_DELAY);
    });

    socket.addEventListener('error', (err: Event) => {
        console.error('[WS] error', err);
        socket?.close();
    });
}

/**
 * Send a typed message object to ESP32.
 */
export function send(msg: AckMessage | CommandMessage | SyncRequestMessage): void {
    if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(msg));
    } else {
        console.warn('[WS] not connected – message dropped', msg);
    }
}
