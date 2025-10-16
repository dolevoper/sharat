const cache = new Map();
const filePathIndex = new Map();
const tsFiles = new Set();

export function has(url) {
    return cache.has(url);
}

export function get(url) {
    return cache.get(url);
}

export function set(url, content) {
    cache.set(url, content);

    const { filePath, extension } = content;

    filePathIndex.set(
        filePath,
        [...(filePathIndex.get(filePath) ?? []), url],
    );

    if (extension === ".ts") {
        tsFiles.add(filePath);
    }
}

export function invalidate(filePath) {
    const urlsToInvalidate = filePathIndex.get(filePath) ?? [];

    urlsToInvalidate.forEach(Map.prototype.delete.bind(cache));
}

export function invalidateTsFiles() {
    tsFiles.forEach(invalidate);
}
