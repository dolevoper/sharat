import { createServer } from "node:http";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { getPortPromise } from "portfinder";
import mime from "mime";
import * as ts from "typescript";

const cwd = process.cwd();

const server = createServer(async (req, res) => {
    console.log(req.method, req.url);

    try {
        for (const contentsGetter of [getFileContents, getDirectoryContents, getTSContents, getJSContents]) {
            const contents = await contentsGetter(req.url);

            if (!contents) {
                continue;
            }

            if (contents.extension === ".ts") {
                res.writeHead(200, { "Content-Type": "text/javascript" });

                const configPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, "tsconfig.json");
                const configFile = configPath !== undefined ? ts.readConfigFile(configPath, ts.sys.readFile).config : {};

                res.end(ts.transpileModule(contents.data.toString(), { fileName: contents.fileName, compilerOptions: configFile.compilerOptions }).outputText);

                return;
            }

            res.writeHead(200, { "Content-Type": mime.getType(contents.extension) ?? "text/html" });
            res.end(contents.data);

            return;
        }

        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("<h1>Not found</h1>");
    } catch (error) {
        console.error(error);

        res.writeHead(500, { "Content-Type": "text/html" });
        res.end("<h1>Internal server error</h1>");
    }
});

const port = await getPortPromise({ port: 3000 });

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

async function getFileContents(url) {
    const filePath = path.join(cwd, url);
    const fileName = path.basename(filePath);
    const extension = path.extname(filePath);

    try {
        const data = await fs.readFile(filePath);

        return { fileName, extension, data };
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
