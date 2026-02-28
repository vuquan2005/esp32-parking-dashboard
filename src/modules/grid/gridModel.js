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

    Object.assign(slot, data);
    // Trigger reactivity by notifying subscribers
    setState({ slots });
}

/**
 * Bulk-update all slots from a status array (e.g. from WebSocket init message).
 * @param {Array<{ name: string, status: string, uid?: string|null }>} list
 */
export function setAllSlots(list) {
    const slots = getState('slots');
    for (const item of list) {
        const slot = slots.get(item.name);
        if (slot) {
            slot.status = item.status;
            slot.uid = item.uid ?? null;
        }
    }
    setState({ slots });
}

/**
 * Get slots filtered by status.
 * @param {string} status
 * @returns {Array}
 */
export function getSlotsByStatus(status) {
    return [...getState('slots').values()].filter((s) => s.status === status);
}
