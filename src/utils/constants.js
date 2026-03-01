/**
 * Domain constants aligned with api.ts numeric enums.
 * Display labels are keyed by these numeric values.
 */

/** Slot states (matches api.ts SlotState, MOVING replaces RESERVED) */
export const SlotState = Object.freeze({
    EMPTY: 0,
    OCCUPIED: 1,
    MOVING: 2,
    ERROR: 3,
});

/** Vehicle action types (matches api.ts ActionType) */
export const ActionType = Object.freeze({
    IN: 0,
    OUT: 1,
});

/** Process / transaction status (matches api.ts ProcessStatus) */
export const ProcessStatus = Object.freeze({
    ERROR: 0,
    SUCCESS: 1,
    PENDING: 2,
    PROCESSING: 3,
});

/** Display labels (Vietnamese) */
export const STATUS_LABELS = Object.freeze({
    [SlotState.EMPTY]: 'TRỐNG',
    [SlotState.OCCUPIED]: 'ĐÃ CÓ XE',
    [SlotState.MOVING]: 'ĐANG DI CHUYỂN...',
    [SlotState.ERROR]: 'LỖI',
});

export const ACTION_LABELS = Object.freeze({
    [ActionType.IN]: 'VÀO',
    [ActionType.OUT]: 'RA',
});

export const TX_STATUS_LABELS = Object.freeze({
    [ProcessStatus.PENDING]: '',
    [ProcessStatus.PROCESSING]: '',
    [ProcessStatus.SUCCESS]: 'Thành công',
    [ProcessStatus.ERROR]: 'Lỗi',
});

/** CSS class name for each slot state */
export const SLOT_STATE_CLASS = Object.freeze({
    [SlotState.EMPTY]: 'empty',
    [SlotState.OCCUPIED]: 'occupied',
    [SlotState.MOVING]: 'moving',
    [SlotState.ERROR]: 'error',
});

/** CSS class name for each process status */
export const STATUS_CLASS = Object.freeze({
    [ProcessStatus.SUCCESS]: 'success',
    [ProcessStatus.ERROR]: 'error',
    [ProcessStatus.PROCESSING]: 'processing',
    [ProcessStatus.PENDING]: 'processing',
});
