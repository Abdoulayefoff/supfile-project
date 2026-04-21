/**
 * Custom Jest transform that preprocesses Vite-specific `import.meta.env`
 * to `process.env` before ts-jest compiles TypeScript.
 *
 * Why: ts-jest with module:CommonJS rejects `import.meta` (TS1343).
 * This wrapper replaces the Vite syntax before TypeScript sees it.
 */
'use strict';

const { TsJestTransformer } = require('ts-jest');

const transformerCache = new Map();

function getTransformer(config) {
    const key = JSON.stringify(config ?? {});
    if (!transformerCache.has(key)) {
        transformerCache.set(key, new TsJestTransformer(config ?? {}));
    }
    return transformerCache.get(key);
}

function preprocess(sourceCode) {
    return sourceCode.replace(/import\.meta\.env\b/g, 'process.env');
}

module.exports = {
    process(sourceCode, sourcePath, transformerOptions) {
        const replaced = preprocess(sourceCode);
        return getTransformer(transformerOptions?.transformerConfig).process(
            replaced,
            sourcePath,
            transformerOptions
        );
    },
    processAsync(sourceCode, sourcePath, transformerOptions) {
        const replaced = preprocess(sourceCode);
        const t = getTransformer(transformerOptions?.transformerConfig);
        return t.processAsync
            ? t.processAsync(replaced, sourcePath, transformerOptions)
            : Promise.resolve(t.process(replaced, sourcePath, transformerOptions));
    },
    getCacheKey(fileData, filePath, transformerOptions) {
        const preprocessed = preprocess(fileData);
        return getTransformer(transformerOptions?.transformerConfig)
            .getCacheKey(preprocessed, filePath, transformerOptions);
    },
};
