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
    setState({
        history: [
            {
                id,
                timestamp: formatTime(),
                uid: data.uid,
                action: data.action,
                slot: data.slot ?? '-',
                status: data.status ?? TxStatus.PENDING,
            },
            ...history,
        ],
    });
    return id;
}

/**
 * Update an existing record.
 * @param {string} id
 * @param {Partial<Object>} data
 */
export function updateRecord(id, data) {
    const history = getState('history');
    setState({
        history: history.map((r) => (r.id === id ? { ...r, ...data } : r)),
    });
}
