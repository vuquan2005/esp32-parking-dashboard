import { getState, setState } from '../../core/store.js';

/**
 * Update a single slot with new data.
 * @param {number} sid – slot ID (1-based)
 * @param {{ st?: number, uid?: number|null }} data
 */
export function updateSlot(sid, data) {
    const slots = getState('slots');
    const slot = slots.get(sid);
    if (!slot) return;

    const newSlots = new Map(slots);
    newSlots.set(sid, { ...slot, ...data });
    setState({ slots: newSlots });
}

/**
 * Bulk-update all slots from a SlotStatusMessage.slots array.
 * @param {Array<{ sid: number, st: number, uid?: number|null }>} list
 */
export function setAllSlots(list) {
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
