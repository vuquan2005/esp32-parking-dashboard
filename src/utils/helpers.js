/**
 * Shorthand for document.querySelector.
 * @param {string} selector
 * @param {Element} [root=document]
 * @returns {Element|null}
 */
export function qs(selector, root = document) {
    return root.querySelector(selector);
}

/**
 * Shorthand for document.querySelectorAll (returns real Array).
 * @param {string} selector
 * @param {Element} [root=document]
 * @returns {Element[]}
 */
export function qsa(selector, root = document) {
    return [...root.querySelectorAll(selector)];
}

/**
 * Create an HTML element with optional class names and text.
 * @param {string} tag
 * @param {{ class?: string|string[], text?: string, html?: string, attrs?: Record<string,string> }} opts
 * @returns {HTMLElement}
 */
export function el(tag, opts = {}) {
    const node = document.createElement(tag);

    if (opts.class) {
        const classes = Array.isArray(opts.class) ? opts.class : opts.class.split(' ');
        node.classList.add(...classes.filter(Boolean));
    }
    if (opts.text != null) node.textContent = opts.text;
    if (opts.html != null) node.innerHTML = opts.html;
    if (opts.attrs) {
        for (const [k, v] of Object.entries(opts.attrs)) {
            node.setAttribute(k, v);
        }
    }
    return node;
}

/**
 * Generate a short random id.
 * @returns {string}
 */
export function uid() {
    return Math.random().toString(36).slice(2, 10);
}
