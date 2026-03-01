import { getState, subscribe } from '../../core/store';
import {
    ProcessStatus,
    ACTION_LABELS,
    TX_STATUS_LABELS,
    STATUS_CLASS,
} from '../../utils/constants';
import { formatUid } from '../../core/protocol';
import { el } from '../../utils/helpers';
import type { TxRecord } from '../../types';

let tbody: HTMLElement;

/**
 * Mount the history table view.
 */
export function mountHistory(tableBody: HTMLElement): void {
    tbody = tableBody;
    render();
    subscribe('history', render);
    subscribe('filters', render);
}

function render(): void {
    const history = getState('history');
    const filters = getState('filters');

    const filtered = history.filter((rec) => {
        if (filters.sid != null && rec.sid !== filters.sid) return false;
        return true;
    });

    // ── Empty state ──────────────────────────────────────────
    if (filtered.length === 0) {
        tbody.innerHTML = '';
        const row = el('tr');
        const td = el('td', {
            text: 'Chưa có lịch sử',
            attrs: { colspan: '5' },
        });
        td.style.textAlign = 'center';
        td.style.color = 'var(--text-muted)';
        td.style.padding = '40px 12px';
        row.appendChild(td);
        tbody.appendChild(row);
        return;
    }

    // ── Collect existing rows keyed by record id ─────────────
    const existingRows = new Map<string, HTMLTableRowElement>();
    for (const row of [...tbody.children] as HTMLTableRowElement[]) {
        const id = row.dataset.recordId;
        if (id) existingRows.set(id, row);
    }

    // ── Remove rows no longer in filtered list ───────────────
    const newIds = new Set(filtered.map((r) => r.id));
    for (const [id, row] of existingRows) {
        if (!newIds.has(id)) {
            row.remove();
            existingRows.delete(id);
        }
    }

    // ── Reconcile: reuse existing rows or create new ones ────
    let cursor = tbody.firstChild as ChildNode | null;
    for (const rec of filtered) {
        const existing = existingRows.get(rec.id);
        if (existing) {
            // Move to correct position if needed
            if (existing !== cursor) {
                tbody.insertBefore(existing, cursor);
            } else {
                cursor = cursor.nextSibling;
            }
            // Patch cells that may have changed
            patchRow(existing, rec);
        } else {
            // Brand-new row
            const newRow = createRow(rec);
            tbody.insertBefore(newRow, cursor);
        }
    }

    // Remove any leftover placeholder rows (e.g. "Chưa có lịch sử")
    while (tbody.children.length > filtered.length) {
        tbody.lastChild?.remove();
    }
}

// ── Row creation ─────────────────────────────────────────────

/**
 * Create a full `<tr>` for a record.
 */
function createRow(rec: TxRecord): HTMLTableRowElement {
    const row = el('tr');
    row.dataset.recordId = rec.id;

    // Timestamp
    row.appendChild(el('td', { text: rec.timestamp }));

    // UID (formatted as hex)
    const uidTd = el('td');
    uidTd.appendChild(
        el('code', {
            text: formatUid(rec.uid),
            attrs: { style: 'background:#f0f0f0;padding:2px 4px;' },
        })
    );
    row.appendChild(uidTd);

    // Action badge
    const actionTd = el('td');
    actionTd.appendChild(
        el('span', {
            class: `badge ${rec.act === 0 ? 'in' : 'out'}`,
            text: ACTION_LABELS[rec.act] ?? String(rec.act),
        })
    );
    row.appendChild(actionTd);

    // Slot
    row.appendChild(el('td', { text: rec.slot }));

    // Status
    const statusTd = el('td');
    statusTd.appendChild(buildStatusCell(rec));
    row.appendChild(statusTd);

    return row;
}

// ── Row patching ─────────────────────────────────────────────

/**
 * Patch an existing row's cells in-place.
 * CRITICAL: when the record is PROCESSING, we do NOT touch the status cell
 * because it owns a live CSS transition driven by animateProgress().
 */
function patchRow(row: HTMLTableRowElement, rec: TxRecord): void {
    const cells = row.children;

    // [0] Timestamp — immutable, skip
    // [1] UID — immutable, skip
    // [2] Action — immutable, skip
    // [3] Slot — immutable, skip

    // [4] Status — only patch when NOT processing (animation-safe)
    if (rec.st !== ProcessStatus.PROCESSING) {
        const statusTd = cells[4] as HTMLElement | undefined;
        const currentSpan = statusTd?.firstChild as HTMLElement | null;
        // Only rebuild if the status actually changed
        const needsRebuild =
            !currentSpan ||
            currentSpan.id === `task-${rec.id}` || // was PROCESSING, now done
            currentSpan.textContent !== (TX_STATUS_LABELS[rec.st] ?? String(rec.st));
        if (needsRebuild && statusTd) {
            statusTd.innerHTML = '';
            statusTd.appendChild(buildStatusCell(rec));
        }
    }
}

// ── Status cell builder ──────────────────────────────────────

/**
 * Build the status cell element, including progress bar for processing state.
 */
function buildStatusCell(rec: TxRecord): HTMLElement {
    if (rec.st === ProcessStatus.PROCESSING) {
        const span = el('span', {
            class: 'status processing progress-bg',
            attrs: { id: `task-${rec.id}` },
        });
        span.style.setProperty('--progress', `${rec.progress ?? 0}%`);
        span.style.setProperty('--progress-num', String(Math.floor(rec.progress ?? 0)));
        span.textContent = TX_STATUS_LABELS[ProcessStatus.PROCESSING] + ' ';
        span.appendChild(el('span', { class: 'percent-text' }));
        return span;
    }

    const statusClass = STATUS_CLASS[rec.st] ?? 'processing';

    return el('span', {
        class: `status ${statusClass}`,
        text: TX_STATUS_LABELS[rec.st] ?? String(rec.st),
    });
}

// Tạo một object để lưu trữ timeout, tránh việc các update chồng chéo nhau
const progressTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

export function animateProgress(
    recordId: string,
    targetPercent: number,
    catchUpDurationMs = 800
): Promise<void> {
    return new Promise((resolve) => {
        const elId = `task-${recordId}`;
        const currentEl = document.getElementById(elId);
        if (!currentEl) {
            return resolve();
        }
        if (progressTimeouts[recordId]) {
            clearTimeout(progressTimeouts[recordId]);
        }
        currentEl.style.setProperty('--duration', `${catchUpDurationMs}ms`);
        currentEl.style.setProperty('transition-timing-function', 'ease-out');
        void currentEl.offsetWidth;

        currentEl.style.setProperty('--progress', `${targetPercent}%`);
        currentEl.style.setProperty('--progress-num', String(Math.floor(targetPercent)));

        if (targetPercent >= 100) {
            setTimeout(() => resolve(), catchUpDurationMs);
            return;
        }

        progressTimeouts[recordId] = setTimeout(() => {
            if (!document.getElementById(elId)) return resolve();
            currentEl.style.setProperty('--duration', `10000ms`);
            currentEl.style.setProperty('transition-timing-function', 'cubic-bezier(0, 0, 0, 1)');
            void currentEl.offsetWidth;
            const fakeTarget = targetPercent + (100 - targetPercent) * 0.8;
            currentEl.style.setProperty('--progress', `${fakeTarget}%`);
            currentEl.style.setProperty('--progress-num', String(Math.floor(fakeTarget)));

            resolve();
        }, catchUpDurationMs);
    });
}
