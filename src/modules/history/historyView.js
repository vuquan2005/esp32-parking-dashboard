import { getState, subscribe } from '../../core/store.js';
import { TxStatus, ACTION_LABELS, TX_STATUS_LABELS } from '../../utils/constants.js';
import { el, qs } from '../../utils/helpers.js';

/** @type {HTMLElement} */
let tbody;

/**
 * Mount the history table view.
 * @param {HTMLElement} tableBody – the `<tbody>` element
 */
export function mountHistory(tableBody) {
    tbody = tableBody;
    render();
    subscribe('history', render);
    subscribe('filters', render);
}

function render() {
    const history = getState('history');
    const filters = getState('filters');
    tbody.innerHTML = '';

    const filtered = history.filter((rec) => {
        if (filters.slot && rec.slot !== filters.slot) return false;
        return true;
    });

    if (filtered.length === 0) {
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

    for (const rec of filtered) {
        const row = el('tr');

        // Timestamp
        row.appendChild(el('td', { text: rec.timestamp }));

        // UID
        const uidTd = el('td');
        uidTd.appendChild(
            el('code', {
                text: rec.uid,
                attrs: { style: 'background:#f0f0f0;padding:2px 4px;' },
            })
        );
        row.appendChild(uidTd);

        // Action badge
        const actionTd = el('td');
        actionTd.appendChild(
            el('span', {
                class: `badge ${rec.action}`,
                text: ACTION_LABELS[rec.action] ?? rec.action,
            })
        );
        row.appendChild(actionTd);

        // Slot
        row.appendChild(el('td', { text: rec.slot }));

        // Status
        const statusTd = el('td');
        statusTd.appendChild(buildStatusCell(rec));
        row.appendChild(statusTd);

        tbody.appendChild(row);
    }
}

/**
 * Build the status cell element, including progress bar for processing state.
 * @param {Object} rec
 * @returns {HTMLElement}
 */
function buildStatusCell(rec) {
    if (rec.status === TxStatus.PROCESSING) {
        const span = el('span', {
            class: 'status processing progress-bg',
            attrs: { id: `task-${rec.id}` },
        });
        span.style.setProperty('--progress', `${rec.progress ?? 0}%`);
        span.innerHTML = `${TX_STATUS_LABELS[TxStatus.PROCESSING]} <span class="percent-text">${rec.progress ?? 0}%</span>`;
        return span;
    }

    const statusClass =
        rec.status === TxStatus.SUCCESS
            ? 'success'
            : rec.status === TxStatus.ERROR
              ? 'error'
              : 'processing';

    return el('span', {
        class: `status ${statusClass}`,
        text: TX_STATUS_LABELS[rec.status] ?? rec.status,
    });
}

/**
 * Animate progress for a specific record.
 * @param {string} recordId
 * @param {number} targetPercent
 * @param {number} durationMs
 */
export function animateProgress(recordId, targetPercent, durationMs) {
    const elId = `task-${recordId}`;
    const statusEl = document.getElementById(elId);
    if (!statusEl) return;

    const textEl = qs('.percent-text', statusEl);
    let currentPercent = parseFloat(statusEl.style.getPropertyValue('--progress')) || 0;

    const steps = 20;
    const stepTime = durationMs / steps;
    const stepPercent = (targetPercent - currentPercent) / steps;
    let stepCount = 0;

    const interval = setInterval(() => {
        stepCount++;
        currentPercent += stepPercent;

        statusEl.style.setProperty('--progress', `${currentPercent}%`);
        if (textEl) textEl.innerText = `${Math.round(currentPercent)}%`;

        if (stepCount >= steps) {
            clearInterval(interval);
            statusEl.style.setProperty('--progress', `${targetPercent}%`);
            if (textEl) textEl.innerText = `${targetPercent}%`;

            if (targetPercent === 100) {
                setTimeout(() => {
                    statusEl.className = 'status success';
                    statusEl.textContent = TX_STATUS_LABELS[TxStatus.SUCCESS];
                }, 500);
            }
        }
    }, stepTime);
}
