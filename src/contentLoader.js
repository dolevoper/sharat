import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as logger from "./logger.js";

export async function load(relativePath) {
    const exactMatch = await _load(relativePath);

    if (exactMatch) {
        return exactMatch;
    }

    const indexHtml = await _load(path.join(relativePath, "index.html"));

    if (indexHtml) {
        return indexHtml;
    }

    const indexHtm = await _load(path.join(relativePath, "index.htm"));

    if (indexHtm) {
        return indexHtm;
    }

    const tsFile = await _load(`${relativePath}.ts`);

    if (tsFile) {
        return tsFile;
    }

    const jsFile = await _load(`${relativePath}.js`);

    if (jsFile) {
        return jsFile;
    }
}

async function _load(relativePath) {
    const filePath = path.join(process.cwd(), relativePath);
    logger.debug("Trying to load", filePath);

    try {
        const data = await fs.readFile(filePath);
        const extension = path.extname(filePath);

        return { data, extension, filePath };
    } catch (err) {
        if (err.code !== "ENOENT" && err.code !== "EISDIR") {
            throw err;
        }
    }
}
