import { getState, subscribe } from '../../core/store.js';
import { eventBus } from '../../core/eventBus.js';
import { SlotStatus } from '../../utils/constants.js';
import { el } from '../../utils/helpers.js';

/** @type {HTMLElement} */
let container;

/**
 * Mount the status bar into the given container.
 * @param {HTMLElement} statsContainer – the `.stats-container` element
 */
export function mountStatusBar(statsContainer) {
    container = statsContainer;
    render();
    subscribe('slots', render);
    subscribe('filters', render);
}

function render() {
    const slots = [...getState('slots').values()];
    const filters = getState('filters');

    const counts = {
        total: slots.length,
        empty: slots.filter((s) => s.status === SlotStatus.EMPTY).length,
        occupied: slots.filter((s) => s.status === SlotStatus.OCCUPIED).length,
        moving: slots.filter((s) => s.status === SlotStatus.MOVING).length,
    };

    container.innerHTML = '';

    const items = [
        { label: 'Tổng số ô', value: counts.total, colorClass: '', filterKey: null },
        {
            label: 'Chỗ trống',
            value: counts.empty,
            colorClass: 'empty',
            filterKey: SlotStatus.EMPTY,
        },
        {
            label: 'Đã có xe',
            value: counts.occupied,
            colorClass: 'occupied',
            filterKey: SlotStatus.OCCUPIED,
        },
        {
            label: 'Đang xử lý',
            value: counts.moving,
            colorClass: 'moving',
            filterKey: SlotStatus.MOVING,
        },
    ];

    for (const item of items) {
        const box = el('div', {
            class: `stat-box${filters.status === item.filterKey && item.filterKey ? ' active' : ''}`,
        });

        box.appendChild(
            el('div', {
                class: 'stat-label',
                text: item.label,
            })
        );

        const valueEl = el('div', {
            class: `stat-value ${item.colorClass}`,
            text: String(item.value),
        });
        if (item.colorClass === 'moving') {
            valueEl.style.color = 'var(--color-moving)';
        }
        box.appendChild(valueEl);

        // Click → toggle status filter (skip "total")
        if (item.filterKey) {
            box.style.cursor = 'pointer';
            box.addEventListener('click', () => {
                const current = getState('filters');
                eventBus.emit(
                    'filter:change',
                    current.status === item.filterKey
                        ? { ...current, status: null }
                        : { ...current, status: item.filterKey }
                );
            });
        }

        container.appendChild(box);
    }
}
