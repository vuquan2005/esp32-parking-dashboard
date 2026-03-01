import { eventBus } from './eventBus.js';
import { parseMessage } from './protocol.js';

/**
 * WebSocket client with auto-reconnect.
 *
 * Incoming messages follow the api.ts BaseMessage format:
 *   { id, v, t, ... }
 *
 * Each message is decoded by protocol.parseMessage() and forwarded
 * to eventBus as the corresponding event.
 */

/** @type {WebSocket|null} */
let socket = null;
let reconnectDelay = 1000;
const MAX_DELAY = 30000;
let url = '';

/**
 * Connect to the WebSocket server.
 * @param {string} [wsUrl] – defaults to `ws://<currentHost>/ws`
 */
export function connect(wsUrl) {
    url = wsUrl || `ws://${location.host}/ws`;
    _open();
}

function _open() {
    socket = new WebSocket(url);

    socket.addEventListener('open', () => {
        console.log('[WS] connected');
        reconnectDelay = 1000; // reset back-off
        eventBus.emit('ws:open');
    });

    socket.addEventListener('message', (event) => {
        try {
            const raw = JSON.parse(event.data);
            const parsed = parseMessage(raw);
            if (parsed) {
                eventBus.emit(parsed.event, parsed.data);
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

    socket.addEventListener('error', (err) => {
        console.error('[WS] error', err);
        socket?.close();
    });
}

/**
 * Send a typed message object to ESP32.
 * @param {object} msg – a fully-formed message object (e.g. from buildCommand)
 */
export function send(msg) {
    if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(msg));
    } else {
        console.warn('[WS] not connected – message dropped', msg);
    }
}
