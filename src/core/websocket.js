import { eventBus } from './eventBus.js';

/**
 * WebSocket client with auto-reconnect.
 *
 * Incoming messages are expected as JSON:
 *   { type: string, payload: object }
 *
 * Each message is forwarded to eventBus as `ws:<type>`.
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
            const msg = JSON.parse(event.data);
            eventBus.emit(`ws:${msg.type}`, msg.payload);
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
 * Send a message to ESP32.
 * @param {string} type
 * @param {object} payload
 */
export function send(type, payload) {
    if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type, payload }));
    } else {
        console.warn('[WS] not connected – message dropped', type);
    }
}
