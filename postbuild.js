import { minify } from 'html-minifier-terser';
import fs from 'fs';

const html = fs.readFileSync('dist/index.html', 'utf8');

const result = await minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    removeTagWhitespace: true,
    minifyCSS: true,
    minifyJS: true,
    useShortDoctype: true,
    collapseBooleanAttributes: true,
    removeAttributeQuotes: true,
});

fs.writeFileSync('dist/index.html', result);
console.log(`✅ Đã nén thành công HTML! Kích thước: ${result.length} bytes.`);
