import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
    js.configs.recommended,
    eslintConfigPrettier,
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                module: 'readonly',
                process: 'readonly',
                fetch: 'readonly',
                WebSocket: 'readonly',
                location: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                requestAnimationFrame: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': 'warn',
        },
    },
];
