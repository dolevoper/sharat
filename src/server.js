import { createServer } from "node:http";
import mime from "mime";
import * as logger from "./logger.js";
import * as contentLoader from "./contentLoader.js";

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

            try {
                const content = await contentLoader.load(pathname);

                if (res.headersSent) {
                    return;
                }

                if (!content) {
                    logger.info("->", "\x1b[32m", method, "\x1b[0m", req.url, "-", "\x1b[33m404\x1b[0m");
                    res.writeHead(404);
                    res.end();

                    return;
                }

                const contentType = content.extension === ".ts" ? "text/javascript" : mime.getType(content.extension);

                logger.info("->", "\x1b[32m", method, "\x1b[0m", req.url, "-", content.relativePath, "(", contentType, ")");
                res.writeHead(200, { "content-type": contentType });
                res.end(content.data);
            } catch (err) {
                logger.error(err);
                logger.info("->", "\x1b[32m", method, "\x1b[0m", req.url, "-", "\x1b[31m500\x1b[0m");
                res.writeHead(500);
                res.end();

                return;
            }

            break;
        default:
            logger.error(`Unsupported request: ${method} ${req.url}`);

            res.end();
    }
});
