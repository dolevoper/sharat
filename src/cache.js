const cache = new Map();
const filePathIndex = new Map();

export function has(url) {
    return cache.has(url);
}

export function get(url) {
    return cache.get(url);
}

export function set(url, content) {
    cache.set(url, content);

    const { filePath } = content;

    filePathIndex.set(
        filePath,
        [...(filePathIndex.get(filePath) ?? []), url],
    );
}

export function invalidate(filePath) {
    const urlsToInvalidate = filePathIndex.get(filePath) ?? [];

    urlsToInvalidate.forEach(Map.prototype.delete.bind(cache));
}
