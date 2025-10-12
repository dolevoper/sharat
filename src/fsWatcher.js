import * as path from "node:path";
import { watch } from "fs/promises";
import * as logger from "./logger.js";
import * as cache from "./cache.js";
import * as transformer from "./transformer.js";

const timeouts = new Map();
const handlers = new Map([
    ["tsconfig.json", tsConfigHandler]
]);

const watcher = watch(process.cwd(), { recursive: true });

export async function start() {
    logger.info("Watching", process.cwd(), "for file changes");
    for await (const { filename } of watcher) {
        clearTimeout(timeouts.get(filename));

        const timeout = setTimeout(function () {
            logger.info("Detected changes to file", filename);
            const basename = path.basename(filename);
            const handler = handlers.get(basename) ?? defaultHandler;

            handler(filename);

            timeouts.delete(filename);
        }, 700);

        timeouts.set(filename, timeout);
    }
}

function defaultHandler(filename) {
    cache.invalidate(path.join(process.cwd(), filename));
}

function tsConfigHandler() {
    logger.info("Invalidating all ts files in cache");
    transformer.invalidateCompilerOptions();
    cache.invalidateTsFiles();
}
