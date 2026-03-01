/**
 * Shared type definitions for the parking-dashboard.
 * Aligned with the ESP32 binary protocol (api.ts).
 */

// ── Enums ────────────────────────────────────────────────────

/** Loại Message */
export enum MessageType {
    ACK = 0x01,
    SYNC_REQ = 0x02,
    SYNC_RES = 0x03,
    SLOT_STATUS = 0x10,
    BATCH_HISTORY = 0x20,
    PROGRESS = 0x30,
    COMMAND = 0x50,
    ERROR = 0xff,
}

/** Trạng thái vị trí đỗ */
export enum SlotState {
    EMPTY = 0,
    OCCUPIED = 1,
    MOVING = 2,
    ERROR = 3,
}

/** Lệnh điều khiển */
export enum CommandType {
    PAUSE = 0,
    RESUME = 1,
    RESET = 2,
    HOMING = 3,
    MOVE = 4,
}

/** Hành động xe (Vào/Ra) */
export enum ActionType {
    IN = 0,
    OUT = 1,
}

/** Trạng thái xử lý */
export enum ProcessStatus {
    ERROR = 0,
    SUCCESS = 1,
    PENDING = 2,
    PROCESSING = 3,
}

// ── Wire-format interfaces (BaseMessage family) ─────────────

export interface BaseMessage {
    id: number;
    v: number;
    t: MessageType;
}

export interface AckMessage extends BaseMessage {
    t: MessageType.ACK;
    rid: number;
    st: ProcessStatus;
    c?: number;
}

export interface SlotStatusMessage extends BaseMessage {
    t: MessageType.SLOT_STATUS;
    slots: {
        sid: number;
        st: SlotState;
        uid?: number;
    }[];
}

export interface BatchHistoryMessage extends BaseMessage {
    t: MessageType.BATCH_HISTORY;
    recs: {
        ts: number;
        sid: number;
        uid: number;
        act: ActionType;
        st: ProcessStatus;
    }[];
}

export interface ProgressMessage extends BaseMessage {
    t: MessageType.PROGRESS;
    rid: number;
    p: number;
}

export interface CommandMessage extends BaseMessage {
    t: MessageType.COMMAND;
    cmd: CommandType;
    p?: number;
}

export interface SyncRequestMessage extends BaseMessage {
    t: MessageType.SYNC_REQ;
    lts: number;
    lv: number;
}

export interface SyncResponseMessage extends BaseMessage {
    t: MessageType.SYNC_RES;
    rid: number;
    updates?: {
        slots?: SlotStatusMessage['slots'];
        recs?: BatchHistoryMessage['recs'];
    };
    cv: number;
}

export interface ErrorMessage extends BaseMessage {
    t: MessageType.ERROR;
    c: number;
}

export type ParkingMessage =
    | AckMessage
    | SlotStatusMessage
    | BatchHistoryMessage
    | ProgressMessage
    | CommandMessage
    | SyncRequestMessage
    | ErrorMessage;

// ── App-level types ──────────────────────────────────────────

/** Single parking slot state */
export interface SlotData {
    sid: number;
    st: SlotState;
    uid: number | null;
}

/** Transaction record in history */
export interface TxRecord {
    id: string;
    timestamp: string;
    uid: number;
    act: ActionType;
    sid: number;
    slot: string;
    st: ProcessStatus;
    progress?: number;
}

/** Active display filters */
export interface Filters {
    sid: number | null;
    status: SlotState | null;
}

/** Global application state */
export interface AppState {
    slots: Map<number, SlotData>;
    history: TxRecord[];
    filters: Filters;
}

/** Options for the `el()` helper */
export interface ElOptions {
    class?: string | string[];
    text?: string;
    html?: string;
    attrs?: Record<string, string>;
}
