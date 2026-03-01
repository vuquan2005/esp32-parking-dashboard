/**
 * Protocol constants & helpers aligned with api.ts
 * ─────────────────────────────────────────────────
 * Central mapping between the binary-optimised wire format (numeric IDs,
 * short keys) and the human-readable values the rest of the app uses.
 */

import { MessageType, CommandType } from '../types';
import type { EventMap } from './eventBus';
import type { BaseMessage, AckMessage, CommandMessage, SyncRequestMessage } from '../types';

// Re-export enums for convenience
export { MessageType, CommandType } from '../types';

// ── Event name mapping for MessageType → eventBus event ──────
type WsEventName = Extract<keyof EventMap, `ws:${string}`>;

const EVENT_MAP = {
    [MessageType.ACK]: 'ws:ack',
    [MessageType.SYNC_RES]: 'ws:sync_res',
    [MessageType.SLOT_STATUS]: 'ws:slot_status',
    [MessageType.HISTORY]: 'ws:history',
    [MessageType.PROGRESS]: 'ws:progress',
    [MessageType.ERROR]: 'ws:error',
} as const satisfies Record<number, WsEventName>;

// ── Slot name ↔ sid mapping ──────────────────────────────────
export const SLOT_NAMES = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'] as const;

export type SlotName = (typeof SLOT_NAMES)[number];

/** sid (1-based) → display name */
export const SLOT_MAP = Object.fromEntries(SLOT_NAMES.map((name, i) => [i + 1, name])) as Record<
    number,
    SlotName
>;

/** display name → sid */
export const SLOT_ID_MAP = Object.fromEntries(SLOT_NAMES.map((name, i) => [name, i + 1])) as Record<
    SlotName,
    number
>;

export const TOTAL_SLOTS = SLOT_NAMES.length;

// ── Sequence ID generator ────────────────────────────────────
let _seqId = 0;
function nextId(): number {
    return ++_seqId;
}

// ── Parse incoming message ───────────────────────────────────
/**
 * Parse a raw JSON-parsed object into { event, data }.
 * Returns null if the message type is unknown.
 */
export function parseMessage(msg: BaseMessage): { event: WsEventName; data: BaseMessage } | null {
    const event = EVENT_MAP[msg.t as keyof typeof EVENT_MAP];
    if (!event) return null;
    return { event, data: msg };
}

// ── Build outgoing messages ──────────────────────────────────

/**
 * Build a CommandMessage.
 */
export function buildCommand(cmd: CommandType, param?: number, version = 0): CommandMessage {
    const msg: CommandMessage = {
        id: nextId(),
        v: version,
        t: MessageType.COMMAND,
        cmd,
    };
    if (param !== undefined) msg.p = param;
    return msg;
}

/**
 * Build a SyncRequestMessage.
 */
export function buildSyncRequest(lastTs: number, lastVer: number): SyncRequestMessage {
    return { id: nextId(), v: 0, t: MessageType.SYNC_REQ, lts: lastTs, lv: lastVer };
}

/**
 * Build an AckMessage to confirm receipt of a message.
 */
export function buildAck(msgId: number): AckMessage {
    return { id: nextId(), v: 0, t: MessageType.ACK, rid: msgId, st: 1 };
}

// ── UID formatting ───────────────────────────────────────────
/**
 * Format a numeric UID to uppercase hex display string.
 */
export function formatUid(uid: number | null | undefined): string {
    if (uid == null) return '-';
    return uid
        .toString(16)
        .toUpperCase()
        .padStart(8, '0')
        .match(/.{1,2}/g)!
        .join(':');
}
