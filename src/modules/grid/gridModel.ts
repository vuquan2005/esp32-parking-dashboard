import { getState, setState } from '../../core/store';
import type { SlotData, SlotStatusMessage } from '../../types';

/**
 * Update a single slot with new data.
 */
export function updateSlot(sid: number, data: Partial<Omit<SlotData, 'sid'>>): void {
    const slots = getState('slots');
    const slot = slots.get(sid);
    if (!slot) return;

    const newSlots = new Map(slots);
    newSlots.set(sid, { ...slot, ...data });
    setState({ slots: newSlots });
}

/**
 * Bulk-update all slots from a SlotStatusMessage.slots array.
 * Reuses the wire-format type directly from types.ts.
 */
export function setAllSlots(list: SlotStatusMessage['slots']): void {
    const slots = getState('slots');
    const newSlots = new Map(slots);
    for (const item of list) {
        const slot = newSlots.get(item.sid);
        if (slot) {
            newSlots.set(item.sid, { ...slot, st: item.st, uid: item.uid ?? null });
        }
    }
    setState({ slots: newSlots });
}
