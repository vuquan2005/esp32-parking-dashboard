import { minify } from 'html-minifier-terser';
import fs from 'fs';
import zlib from 'zlib';

const html = fs.readFileSync('dist/index.html', 'utf8');

const result = await minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    removeTagWhitespace: true,
    useShortDoctype: true,
    collapseBooleanAttributes: true,
    removeAttributeQuotes: true,
});

fs.writeFileSync('dist/index.html', result);
console.log(`✅ HTML! Kích thước: ${result.length} bytes.`);

const gzipped = zlib.gzipSync(result);
// fs.writeFileSync('dist/index.html.gz', gzipped); // Export GZIP file
console.log(`✅ GZIP! Kích thước: ${gzipped.length} bytes.`);

const hexArray = [];
for (let i = 0; i < gzipped.length; i++) {
    hexArray.push(`0x${gzipped[i].toString(16).padStart(2, '0')}`);
}
const chunks = [];
for (let i = 0; i < hexArray.length; i += 16) {
    chunks.push(hexArray.slice(i, i + 16).join(', '));
}

const headerContent = `#ifndef INDEX_HTML_GZ_H
#define INDEX_HTML_GZ_H

#include <pgmspace.h>

const uint32_t index_html_gz_len = ${gzipped.length};
const uint8_t index_html_gz[] PROGMEM = {
    ${chunks.join(',\n    ')}
};

#endif // INDEX_HTML_GZ_H
`;

fs.writeFileSync('dist/html.h', headerContent);
console.log(`✅ Header C (html.h)`);
