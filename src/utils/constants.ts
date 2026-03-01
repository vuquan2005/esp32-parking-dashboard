/**
 * Domain constants & display labels.
 * Uses `as const satisfies` to retain literal types while
 * ensuring shape correctness against the enum keys.
 */

import { SlotState, ActionType, ProcessStatus } from '../types';

/** Display labels (Vietnamese) */
export const STATUS_LABELS = {
    [SlotState.EMPTY]: 'TRỐNG',
    [SlotState.OCCUPIED]: 'ĐÃ CÓ XE',
    [SlotState.MOVING]: 'ĐANG DI CHUYỂN...',
    [SlotState.ERROR]: 'LỖI',
} as const satisfies Record<SlotState, string>;

export const ACTION_LABELS = {
    [ActionType.IN]: 'VÀO',
    [ActionType.OUT]: 'RA',
} as const satisfies Record<ActionType, string>;

export const TX_STATUS_LABELS = {
    [ProcessStatus.PENDING]: '',
    [ProcessStatus.PROCESSING]: '',
    [ProcessStatus.SUCCESS]: 'Thành công',
    [ProcessStatus.ERROR]: 'Lỗi',
} as const satisfies Record<ProcessStatus, string>;

/** CSS class name for each slot state */
export const SLOT_STATE_CLASS = {
    [SlotState.EMPTY]: 'empty',
    [SlotState.OCCUPIED]: 'occupied',
    [SlotState.MOVING]: 'moving',
    [SlotState.ERROR]: 'error',
} as const satisfies Record<SlotState, string>;

/** CSS class name for each process status */
export const STATUS_CLASS = {
    [ProcessStatus.SUCCESS]: 'success',
    [ProcessStatus.ERROR]: 'error',
    [ProcessStatus.PROCESSING]: 'processing',
    [ProcessStatus.PENDING]: 'processing',
} as const satisfies Record<ProcessStatus, string>;

// Re-export enums for convenience
export { SlotState, ActionType, ProcessStatus } from '../types';
