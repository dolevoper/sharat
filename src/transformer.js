const transformers = new Map([
    [".ts", tsTransformer],
]);

export function transform(content) {
    const transformer = transformers.get(content.extension);

    if (!transformer) {
        return content;
    }

    return transformer(content);
}

function tsTransformer(content) {
    return {
        ...content,
        extension: ".js",
    };
}
