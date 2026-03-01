import { getState, setState } from '../../core/store.js';
import { uid } from '../../utils/helpers.js';
import { ProcessStatus } from '../../utils/constants.js';
import { formatTime } from '../../utils/time.js';
import { SLOT_MAP } from '../../core/protocol.js';

/**
 * Add a new transaction record (prepended).
 * @param {{ uid: number, act: number, sid: number, st?: number }} data
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
                act: data.act,
                sid: data.sid,
                slot: SLOT_MAP[data.sid] ?? '-',
                st: data.st ?? ProcessStatus.PENDING,
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
