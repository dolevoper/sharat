import { createServer } from "node:http";
import * as logger from "./logger.js";

export const server = createServer(async function (req, res) {
    const { pathname } = new URL(`http://localhost${req.url}`);
    const method = req.method;

    switch (true) {
        case method === "GET" && pathname === "/__sharat_events__.js":
            logger.debug("<-", "\x1b[32m", method, "\x1b[0m", req.url);
            // return sharatEvents.js
            break;
        case method === "GET" && pathname === "/__sharat_events__":
            logger.debug("<-", "\x1b[32m", method, "\x1b[0m", req.url);
            // register event listener
            break;
        case method === "GET":
            // handle getting file from file system
            logger.info("<-", "\x1b[32m", method, "\x1b[0m", req.url);
            break;
        default:
            logger.error(`Unsupported request: ${method} ${req.url}`);

        res.end();
    }
});
