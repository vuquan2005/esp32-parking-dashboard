/**
 * Protocol constants & helpers aligned with api.ts
 * ─────────────────────────────────────────────────
 * Central mapping between the binary-optimised wire format (numeric IDs,
 * short keys) and the human-readable values the rest of the app uses.
 */

// ── Message types ────────────────────────────────────────────
export const MessageType = Object.freeze({
    ACK: 0x01,
    SYNC_REQ: 0x02,
    SYNC_RES: 0x03,
    SLOT_STATUS: 0x10,
    BATCH_HISTORY: 0x20,
    PROGRESS: 0x30,
    COMMAND: 0x50,
    ERROR: 0xff,
});

// ── Command types ────────────────────────────────────────────
export const CommandType = Object.freeze({
    PAUSE: 0,
    RESUME: 1,
    RESET: 2,
    HOMING: 3,
    MOVE: 4,
});

// ── Event name mapping for MessageType → eventBus event ──────
const EVENT_MAP = Object.freeze({
    [MessageType.ACK]: 'ws:ack',
    [MessageType.SYNC_RES]: 'ws:sync_res',
    [MessageType.SLOT_STATUS]: 'ws:slot_status',
    [MessageType.BATCH_HISTORY]: 'ws:batch_history',
    [MessageType.PROGRESS]: 'ws:progress',
    [MessageType.ERROR]: 'ws:error',
});

// ── Slot name ↔ sid mapping ──────────────────────────────────
export const SLOT_NAMES = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];

/** sid (1-based) → display name */
export const SLOT_MAP = Object.freeze(
    Object.fromEntries(SLOT_NAMES.map((name, i) => [i + 1, name]))
);

/** display name → sid */
export const SLOT_ID_MAP = Object.freeze(
    Object.fromEntries(SLOT_NAMES.map((name, i) => [name, i + 1]))
);

export const TOTAL_SLOTS = SLOT_NAMES.length;

// ── Sequence ID generator ────────────────────────────────────
let _seqId = 0;
function nextId() {
    return ++_seqId;
}

// ── Parse incoming message ───────────────────────────────────
/**
 * Parse a raw JSON-parsed object into { event, data }.
 * Returns null if the message type is unknown.
 * @param {object} msg – parsed JSON from WebSocket
 * @returns {{ event: string, data: object } | null}
 */
export function parseMessage(msg) {
    const event = EVENT_MAP[msg.t];
    if (!event) return null;
    return { event, data: msg };
}

// ── Build outgoing messages ──────────────────────────────────

/**
 * Build a CommandMessage.
 * @param {number} cmd – CommandType value
 * @param {number} [param]
 * @param {number} [version=0]
 * @returns {object}
 */
export function buildCommand(cmd, param, version = 0) {
    const msg = { id: nextId(), v: version, t: MessageType.COMMAND, cmd };
    if (param !== undefined) msg.p = param;
    return msg;
}

/**
 * Build a SyncRequestMessage.
 * @param {number} lastTs
 * @param {number} lastVer
 * @returns {object}
 */
export function buildSyncRequest(lastTs, lastVer) {
    return { id: nextId(), v: 0, t: MessageType.SYNC_REQ, lts: lastTs, lv: lastVer };
}

// ── UID formatting ───────────────────────────────────────────
/**
 * Format a numeric UID to uppercase hex display string.
 * @param {number|null|undefined} uid
 * @returns {string}
 */
export function formatUid(uid) {
    if (uid == null) return '-';
    return uid
        .toString(16)
        .toUpperCase()
        .padStart(8, '0')
        .match(/.{1,2}/g)
        .join(':');
}
