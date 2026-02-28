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

let _seq = 0;

/**
 * Generate a unique id based on Unix timestamp.
 * @returns {string}
 */
export function uid() {
    return `${Date.now()}-${++_seq}`;
}

/**
 * Returns a promise that resolves after the specified milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
