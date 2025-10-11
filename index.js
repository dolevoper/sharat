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
const moduleClusters = new Map();
const moduleToModuleCluster = new Map();

const port = await getPortPromise({ port: 3000 });

let compilerOptions;
let eventSubscribers = [];

const server = createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/__sharat_events__") {
        handleEvents(req, res);

        return;
    }

    console.log("->", req.method, req.url);

    const url = new URL(`http://localhost:${port}${req.url}`);

    req.pathname = url.pathname;

    if (cache.has(req.pathname)) {
        respondFromCache(req, res);

        return;
    }

    try {
        for (const contentsGetter of [getFileContents, getDirectoryContents, getTSContents, getJSContents]) {
            const contents = await contentsGetter(req.pathname);
            debug(contents);

            if (!contents) {
                continue;
            }

            if (contents.extension === ".js" || contents.extension === ".ts") {
                const referrer = new URL(req.headers.referer);
                const clusterRoot = referrer.pathname === "/" ? req.pathname : moduleToModuleCluster.get(referrer.pathname);

                moduleToModuleCluster.set(req.pathname, clusterRoot);
                moduleClusters.set(
                    clusterRoot,
                    [...(moduleClusters.get(clusterRoot) ?? []), req.pathname],
                );

                debug("updated module clusters", moduleClusters, moduleToModuleCluster);
            }

            if (contents.extension === ".ts") {
                tsUrls.add(req.pathname);

                const compilerOptions = getCompilerOptions();
                const code = contents.data
                    .toString()
                    .replaceAll(
                        /^(import .*)("|')(;?)$/gm,
                        `$1?t=${Date.now()}$2$3`,
                    );
                debug(code);
                const data = ts.transpileModule(code, { fileName: contents.fileName, compilerOptions }).outputText;

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
                .replace("</body>", '<script src="__sharat_events__.js" type="module"></script></body>');

            respond(req, res, 200, data, mime.getType(contents.extension) ?? "text/html");

            return;
        }

        respond(req, res, 404, "<h1>Not found</h1>", "text/html");
    } catch (error) {
        console.error(error);

        respond(req, res, 500, "<h1>Internal server error</h1>", "text/html", true);
    }
});

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

const watcher = fs.watch(cwd, { recursive: true });

for await (const event of watcher) {
    debug(`detected changes to ${event.filename} ${event.eventType}`);
    const fileUrl = `/${event.filename.replaceAll("\\", "/")}`;
    cache.delete(fileUrl);
    cache.delete(fileUrl.replace(/(\.ts|\.js|index.html)$/, ""));

    if (event.filename.endsWith("tsconfig.json")) {
        tsUrls.forEach(cache.delete.bind(cache));
        tsUrls.clear();
        moduleClusters.clear();
        moduleToModuleCluster.clear();

        resetCompilerOptions();
        updateSubscribers("refresh");

        continue;
    }

    // const rootModule = moduleTree.get(fileUrl) ?? moduleTree.get(fileUrl.replace(/(\.ts|\.js)$/, ""));
    // const moduleToReload = rootModule ?? fileUrl.slice(1);

    // cache.delete(`/${rootModule}`);
    // let moduleToReload = fileUrl;
    // let parentModule = moduleTree.get(moduleToReload) ?? moduleTree.get(moduleToReload.replace(/(\.ts|\.js)$/, ""));

    // while (parentModule) {
    //     cache.delete(parentModule);

    //     moduleToReload = parentModule;
    //     parentModule = moduleTree.get(moduleToReload) ?? moduleTree.get(moduleToReload.replace(/(\.ts|\.js)$/, ""));
    // }

    // updateSubscribers("replaceScript", moduleToReload.slice(1));
}

function updateSubscribers(event, message) {
    debug(`updating ${eventSubscribers.length} subscribers`);
    eventSubscribers.forEach((res) => {
        if (res.writableEnded) {
            return;
        }

        res.write(`event: ${event}\n`);
        res.write(`data: ${message}\n\n`);
    });
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
        cache.set(req.pathname, { status, data, contentType });
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

    const { status, data, contentType, silent } = cache.get(req.pathname);

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

function resetCompilerOptions() {
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
