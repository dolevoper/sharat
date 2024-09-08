import { createServer } from "node:http";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { getPortPromise } from "portfinder";
import mime from "mime";
import * as ts from "typescript";

const server = createServer(async (req, res) => {
    console.log(req.method, req.url);

    const filePath = path.join(process.cwd(), req.url);

    try {
        const fileContents = await getFileContents(filePath);

        if (filePath.endsWith(".ts")) {
            res.writeHead(200, { "Content-Type": "text/javascript" });

            const configPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, "tsconfig.json");
            const configFile = configPath !== undefined ? ts.readConfigFile(configPath, ts.sys.readFile).config : {};

            res.end(ts.transpileModule(fileContents.toString(), { compilerOptions: configFile.compilerOptions }).outputText);

            return;
        }

        res.writeHead(200, { "Content-Type": mime.getType(filePath) ?? "text/html" });
        res.end(fileContents);
    } catch (error) {
        console.error(error);

        if (!res.headersSent) {
            res.writeHead(404, { "Content-Type": "text/html" });
        }

        res.end("<h1>Not found</h1>");
    }
});

const port = await getPortPromise({ port: 3000 });

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

async function getFileContents(filePath) {
    const stats = await fs.stat(filePath);

    if (stats.isFile()) {
        return await fs.readFile(filePath);
    }

    if (stats.isDirectory()) {
        return await getFileContents(path.join(filePath, "index.html"));
    }
}
