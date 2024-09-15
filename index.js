import { createServer } from "node:http";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { getPortPromise } from "portfinder";
import mime from "mime";
import * as ts from "typescript";
import * as sass from "sass";

const cwd = process.cwd();

const cache = new Map();
const tsUrls = new Set();

const server = createServer(async (req, res) => {
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
                const configPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, "tsconfig.json");
                const configFile = configPath !== undefined ? ts.readConfigFile(configPath, ts.sys.readFile).config : {};
                const data = ts.transpileModule(contents.data.toString(), { fileName: contents.fileName, compilerOptions: configFile.compilerOptions }).outputText;
                
                respond(req, res, 200, data, "text/javascript");

                return;
            }

            if (contents.extension === ".scss") {
                const data = (await sass.compileStringAsync(contents.data.toString())).css;

                respond(req, res, 200, data, "text/css");

                return;
            }

            respond(req, res, 200, contents.data, mime.getType(contents.extension) ?? "text/html");

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
    cache.delete(`/${event.filename}`);
    cache.delete(`/${event.filename.replace(/\.ts|\.js|index.html$/, "")}`);

    if (event.filename.endsWith("tsconfig.json")) {
        tsUrls.forEach(cache.delete.bind(cache));
    }
}

async function getFileContents(url) {
    const filePath = path.join(cwd, url);
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

    const { status, data, contentType } = cache.get(req.url);

    console.log("<-", req.method, req.url, status, "[FROM CACHE]");
    res.writeHead(status, { "Content-Type": contentType });
    res.end(data);
}
