import { getState, subscribe } from '../../core/store.js';
import { TxStatus, ACTION_LABELS, TX_STATUS_LABELS } from '../../utils/constants.js';
import { el } from '../../utils/helpers.js';

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
        span.style.setProperty('--progress-num', Math.floor(rec.progress ?? 0));
        span.textContent = TX_STATUS_LABELS[TxStatus.PROCESSING] + ' ';
        span.appendChild(el('span', { class: 'percent-text' }));
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

export function animateProgress(recordId, targetPercent, durationMs) {
    return new Promise((resolve) => {
        const elId = `task-${recordId}`;
        const currentEl = document.getElementById(elId);

        if (!currentEl) {
            return resolve();
        }

        currentEl.style.setProperty('--duration', `${durationMs}ms`);

        // Force reflow để đảm bảo trình duyệt nhận --duration trước khi đổi giá trị
        void currentEl.offsetWidth;

        currentEl.style.setProperty('--progress', `${targetPercent}%`);
        currentEl.style.setProperty('--progress-num', Math.floor(targetPercent));

        setTimeout(() => {
            // Đặt lại duration về 0 sau khi hoàn thành để ngăn các lần cập nhật sau đó bị chậm
            if (currentEl) currentEl.style.setProperty('--duration', '0ms');
            resolve();
        }, durationMs);
    });
}
