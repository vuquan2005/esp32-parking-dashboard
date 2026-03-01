import { getState, setState } from '../../core/store';
import { uid } from '../../utils/helpers';
import { ProcessStatus } from '../../utils/constants';
import { formatTime } from '../../utils/time';
import { SLOT_MAP } from '../../core/protocol';
import type { TxRecord, ActionType, ProcessStatus as ProcessStatusType } from '../../types';

interface AddRecordData {
    uid: number;
    act: ActionType;
    sid: number;
    st?: ProcessStatusType;
}

/**
 * Add a new transaction record (prepended).
 */
export function addRecord(data: AddRecordData): string {
    const id = uid();
    const history = getState('history');
    const record: TxRecord = {
        id,
        timestamp: formatTime(),
        uid: data.uid,
        act: data.act,
        sid: data.sid,
        slot: SLOT_MAP[data.sid] ?? '-',
        st: data.st ?? ProcessStatus.PENDING,
    };
    setState({
        history: [record, ...history],
    });
    return id;
}

/**
 * Update an existing record.
 */
export function updateRecord(id: string, data: Partial<TxRecord>): void {
    const history = getState('history');
    setState({
        history: history.map((r) => (r.id === id ? { ...r, ...data } : r)),
    });
}
