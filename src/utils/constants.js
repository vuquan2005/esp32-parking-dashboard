/** Slot statuses */
export const SlotStatus = Object.freeze({
    EMPTY: 'empty',
    OCCUPIED: 'occupied',
    MOVING: 'moving',
});

/** Transaction actions */
export const Action = Object.freeze({
    IN: 'in',
    OUT: 'out',
});

/** Transaction record statuses */
export const TxStatus = Object.freeze({
    PENDING: 'pending',
    PROCESSING: 'processing',
    SUCCESS: 'success',
    ERROR: 'error',
});

/** Slot names (row-major: A1..C3) */
export const SLOT_NAMES = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];

/** Display labels (Vietnamese) */
export const STATUS_LABELS = Object.freeze({
    [SlotStatus.EMPTY]: 'TRỐNG',
    [SlotStatus.OCCUPIED]: 'ĐÃ CÓ XE',
    [SlotStatus.MOVING]: 'ĐANG DI CHUYỂN...',
});

export const ACTION_LABELS = Object.freeze({
    [Action.IN]: 'VÀO',
    [Action.OUT]: 'RA',
});

export const TX_STATUS_LABELS = Object.freeze({
    [TxStatus.PENDING]: 'Chờ xử lý',
    [TxStatus.PROCESSING]: 'Đang xử lý',
    [TxStatus.SUCCESS]: 'Thành công',
    [TxStatus.ERROR]: 'Lỗi',
});
