import * as path from "node:path";
import { watch } from "fs/promises";
import * as logger from "./logger.js";
import * as cache from "./cache.js";

const timeouts = new Map();

const watcher = watch(process.cwd(), { recursive: true });

export async function start() {
    logger.info("Watching", process.cwd(), "for file changes");
    for await (const { filename } of watcher) {
        clearTimeout(timeouts.get(filename));

        const timeout = setTimeout(function () {
            logger.info("Detected changes to file", filename);
            cache.invalidate(path.join(process.cwd(), filename));
            timeouts.delete(filename);
        }, 500);

        timeouts.set(filename, timeout);
    }
}
