import { getState, setState } from '../../core/store.js';

/**
 * Update a single slot with new data.
 * @param {string} name – e.g. 'A1'
 * @param {{ status?: string, uid?: string|null }} data
 */
export function updateSlot(name, data) {
    const slots = getState('slots');
    const slot = slots.get(name);
    if (!slot) return;

    const newSlots = new Map(slots);
    newSlots.set(name, { ...slot, ...data });
    setState({ slots: newSlots });
}

/**
 * Bulk-update all slots from a status array (e.g. from WebSocket init message).
 * @param {Array<{ name: string, status: string, uid?: string|null }>} list
 */
export function setAllSlots(list) {
    const slots = getState('slots');
    const newSlots = new Map(slots);
    for (const item of list) {
        const slot = newSlots.get(item.name);
        if (slot) {
            newSlots.set(item.name, { ...slot, status: item.status, uid: item.uid ?? null });
        }
    }
    setState({ slots: newSlots });
}
