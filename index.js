#!/usr/bin/env node

import { createServer } from "node:http";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import { getPortPromise } from "portfinder";
import mime from "mime";
import * as ts from "typescript";
import * as sass from "sass";

const debug = process.env.SHOW_DEBUG_LOGS
    ? console.log.bind(console)
    : function () { };

debug("Server starting in debug mode");

const cwd = process.cwd();

const sharatEventsScript = readFileSync(path.join(import.meta.dirname, "sharatEvents.js"));
const cache = new Map([
    ["/__sharat_events__.js", { status: 200, data: sharatEventsScript, contentType: "text/javascript", silent: !process.env.SHOW_DEBUG_LOGS }],
]);
const tsUrls = new Set();

let compilerOptions;
let eventSubscribers = [];

const server = createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/__sharat_events__") {
        handleEvents(req, res);

        return;
    }

    console.log("->", req.method, req.url);

    if (cache.has(req.url)) {
        respondFromCache(req, res);

        return;
    }

    try {
        for (const contentsGetter of [getFileContents, getDirectoryContents, getTSContents, getJSContents]) {
            const contents = await contentsGetter(req.url);

            if (!contents) {
                continue;
            }

            if (contents.extension === ".ts") {
                tsUrls.add(req.url);

                const compilerOptions = getCompilerOptions();
                const data = ts.transpileModule(contents.data.toString(), { fileName: contents.fileName, compilerOptions }).outputText;

                respond(req, res, 200, data, "text/javascript");

                return;
            }

            if (contents.extension === ".scss") {
                const data = (await sass.compileStringAsync(contents.data.toString())).css;

                respond(req, res, 200, data, "text/css");

                return;
            }

            const data = contents.data
                .toString()
                .replace("</body>", '<script src="__sharat_events__.js"></script></body>');

            respond(req, res, 200, data, mime.getType(contents.extension) ?? "text/html");

            return;
        }

        respond(req, res, 404, "<h1>Not found</h1>", "text/html");
    } catch (error) {
        console.error(error);

        respond(req, res, 500, "<h1>Internal server error</h1>", "text/html", true);
    }
});

const port = await getPortPromise({ port: 3000 });

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

const watcher = fs.watch(cwd, { recursive: true });

for await (const event of watcher) {
    debug(`detected changes to ${event.filename} ${event.eventType}`);
    cache.delete(`/${event.filename}`);
    cache.delete(`/${event.filename.replace(/\.ts|\.js|index.html$/, "")}`);

    debug(`updating ${eventSubscribers.length} subscribers`);
    eventSubscribers.forEach((res) => {
        if (res.writableEnded) {
            return;
        }

        res.write(`data: ${event.filename}\n\n`);
    });

    if (event.filename.endsWith("tsconfig.json")) {
        tsUrls.forEach(cache.delete.bind(cache));
        resetCompolerOptions();
    }
}

async function getFileContents(url, basePath = cwd) {
    const filePath = path.join(basePath, url);
    const fileName = path.basename(filePath);
    const extension = path.extname(filePath);

    try {
        const data = await fs.readFile(filePath);
        const res = { fileName, extension, data };

        return res;
    } catch (err) {
        if (err.code !== "ENOENT" && err.code !== "EISDIR") {
            throw err;
        }
    }
}

function getDirectoryContents(url) {
    return getFileContents(path.join(url, "index.html"));
}

function getTSContents(url) {
    return getFileContents(`${url}.ts`);
}

function getJSContents(url) {
    return getFileContents(`${url}.js`);
}

function respond(req, res, status, data, contentType, skipCache) {
    if (!skipCache) {
        cache.set(req.url, { status, data, contentType });
    }

    if (res.headersSent) {
        return;
    }

    console.log("<-", req.method, req.url, status);
    res.writeHead(status, { "Content-Type": contentType });
    res.end(data);
}

function respondFromCache(req, res) {
    if (res.headersSent) {
        return;
    }

    const { status, data, contentType, silent } = cache.get(req.url);

    if (!silent) {
        console.log("<-", req.method, req.url, status, "[FROM CACHE]");
    }

    res.writeHead(status, { "Content-Type": contentType });
    res.end(data);
}

function getCompilerOptions() {
    if (!compilerOptions) {
        const configPath = ts.findConfigFile(cwd, ts.sys.fileExists, "tsconfig.json");
        const configFile = configPath !== undefined ? ts.readConfigFile(configPath, ts.sys.readFile).config : {};

        compilerOptions = ts.convertCompilerOptionsFromJson(configFile.compilerOptions, process.cwd()).options;
    }

    return compilerOptions;
}

function resetCompolerOptions() {
    compilerOptions = undefined;
}

function handleEvents(req, res) {
    debug("New events subscriber");
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
    });
    res.write(": connected\n\n");

    eventSubscribers.push(res);

    req.on("close", () => {
        debug("Removing event subscriber");
        eventSubscribers = eventSubscribers.filter((subscriber) => subscriber !== res);
    });
}
