import { TxStatus } from '../utils/constants.js';
import { addRecord, updateRecord } from '../modules/history/historyModel.js';
import { updateSlot } from '../modules/grid/gridModel.js';
import { SlotStatus } from '../utils/constants.js';

/**
 * Send a vehicle entry/exit request to ESP32.
 * Implements the Optimistic UI pattern:
 *   1. Immediately add a pending record to the UI
 *   2. Send the request
 *   3. Update record on success/error
 *
 * @param {{ uid: string, action: 'in'|'out', slot: string }} data
 */
export async function sendAction(data) {
    // Step 1 – Optimistic: add pending record
    const recordId = addRecord({
        uid: data.uid,
        action: data.action,
        slot: data.slot,
        status: TxStatus.PENDING,
    });

    // Mark slot as moving
    updateSlot(data.slot, { status: SlotStatus.MOVING, uid: data.uid });

    try {
        // Step 2 – Send to ESP32
        const res = await fetch('/api/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // Step 3a – Success
        updateRecord(recordId, { status: TxStatus.SUCCESS });
        updateSlot(data.slot, {
            status: data.action === 'in' ? SlotStatus.OCCUPIED : SlotStatus.EMPTY,
            uid: data.action === 'in' ? data.uid : null,
        });
    } catch (err) {
        // Step 3b – Error
        console.error('[API] sendAction failed:', err);
        updateRecord(recordId, { status: TxStatus.ERROR });
        // Revert slot to previous state (best-effort: set empty)
        updateSlot(data.slot, { status: SlotStatus.EMPTY, uid: null });
    }

    return recordId;
}
