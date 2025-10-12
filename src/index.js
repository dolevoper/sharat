#!/usr/bin/env node

import "./dotenv.js";

import * as path from "node:path";
import { watch } from "fs/promises";
import { getPortPromise } from "portfinder";
import { server } from "./server.js";
import * as logger from "./logger.js";
import * as cache from "./cache.js";

const port = await getPortPromise({ port: 3000 });

server.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
});

const watcher = watch(process.cwd(), { recursive: true });

logger.info("Watching", process.cwd(), "for file changes");
for await (const event of watcher) {
    logger.info("Detected changes to file", event.filename);
    cache.invalidate(path.join(process.cwd(), event.filename));
}
