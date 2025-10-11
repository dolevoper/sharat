import { createServer } from "node:http";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import mime from "mime";
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
            logger.info("<-", "\x1b[32m", method, "\x1b[0m", req.url);
            const filePath = path.join(process.cwd(), pathname);

            try {
                const data = await fs.readFile(filePath);

                if (res.headersSent) {
                    return;
                }

                const extension = path.extname(filePath);
                const contentType = mime.getType(extension);

                logger.info("->", "\x1b[32m", method, "\x1b[0m", req.url, "-", pathname, "(", contentType, ")");
                res.writeHead(200, { "content-type": contentType });
                res.end(data);
            } catch (err) {
                if (err.code !== "ENOENT" && err.code !== "EISDIR") {
                    logger.error(err);
                    logger.info("->", "\x1b[32m", method, "\x1b[0m", req.url, "-", "\x1b[31m500\x1b[0m");
                    res.writeHead(500);
                    res.end();

                    return;
                }

                logger.info("->", "\x1b[32m", method, "\x1b[0m", req.url, "-", "\x1b[33m404\x1b[0m");
                res.writeHead(404);
                res.end();
            }

            break;
        default:
            logger.error(`Unsupported request: ${method} ${req.url}`);

            res.end();
    }
});
