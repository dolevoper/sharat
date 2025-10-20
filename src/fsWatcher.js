import * as path from "node:path";
import { watch } from "node:fs/promises";
import { spawn } from "node:child_process";
import * as logger from "./logger.js";
import * as cache from "./cache.js";
import * as transformer from "./transformer.js";
import * as eventsHandler from "./eventsHandler.js";

const timeouts = new Map();
const handlers = new Map([
    ["tsconfig.json", tsConfigHandler],
    ["sharat.env", restartApp],
]);

const watcher = watch(process.cwd(), { recursive: true });

export async function start() {
    logger.info("Watching", process.cwd(), "for file changes");
    for await (const { filename } of watcher) {
        if ([".gitignore", ".git"].includes(path.basename(filename)) || filename.startsWith(`.git${path.sep}`) || (await isGitIgnored(filename) && filename !== "sharat.env")) {
            continue;
        }

        clearTimeout(timeouts.get(filename));

        const timeout = setTimeout(function () {
            logger.info("Detected changes to file", filename);
            const basename = path.basename(filename);
            const handler = handlers.get(basename) ?? defaultHandler;

            handler(filename);
            eventsHandler.signalRefresh();

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

function restartApp() {
    logger.info("Restarting sharat...");
    process.exit(0);
}

function isGitIgnored(filepath) {
    return new Promise((resolve, reject) => {
        const childProcess = spawn("git", ["check-ignore", filepath]);

        childProcess.addListener("close", (code) => resolve(code === 0));
        childProcess.addListener("error", reject);
    });
}
