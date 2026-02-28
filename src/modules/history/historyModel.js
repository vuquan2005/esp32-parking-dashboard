import { getState, setState } from '../../core/store.js';
import { uid } from '../../utils/helpers.js';
import { TxStatus } from '../../utils/constants.js';
import { formatTime } from '../../utils/time.js';

/**
 * Add a new transaction record (prepended).
 * @param {{ uid: string, action: string, slot: string|null, status?: string }} data
 * @returns {string} record id
 */
export function addRecord(data) {
    const id = uid();
    const history = getState('history');
    history.unshift({
        id,
        timestamp: formatTime(),
        uid: data.uid,
        action: data.action,
        slot: data.slot ?? '-',
        status: data.status ?? TxStatus.PENDING,
        progress: 0,
    });
    setState({ history });
    return id;
}

/**
 * Update an existing record.
 * @param {string} id
 * @param {Partial<Object>} data
 */
export function updateRecord(id, data) {
    const history = getState('history');
    const rec = history.find((r) => r.id === id);
    if (rec) {
        Object.assign(rec, data);
        setState({ history });
    }
}

/**
 * Get history filtered by active filters.
 * @returns {Array}
 */
export function getFilteredHistory() {
    const history = getState('history');
    const filters = getState('filters');

    return history.filter((rec) => {
        if (filters.slot && rec.slot !== filters.slot) return false;
        if (filters.status) {
            // Map slot status → related tx actions
            // (status filter refers to slot status, not tx status)
            // So we just filter by slot name when status filter is active
            return true;
        }
        return true;
    });
}
