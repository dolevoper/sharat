import * as path from "node:path";
import * as ts from "typescript";
import * as sass from "sass";
import * as logger from "./logger.js";

const transformers = new Map([
    [".ts", tsTransformer],
    [".scss", scssTransformer],
    [".html", htmlTransformer],
    [".htm", htmlTransformer],
]);

export async function transform(content) {
    const transformer = transformers.get(content.extension);

    if (!transformer) {
        logger.debug("not transformer found for file", content.filePath);
        return content;
    }

    return await transformer(content);
}

function tsTransformer(content) {
    logger.debug("using ts transformer on", content.filePath);
    const compilerOptions = getCompilerOptions();
    const code = content.data.toString();
    const fileName = path.basename(content.filePath);
    const data = ts.transpileModule(code, { fileName, compilerOptions }).outputText;

    return {
        ...content,
        data,
        contentType: "text/javascript",
    };
}

let compilerOptions;

function getCompilerOptions() {
    if (!compilerOptions) {
        logger.debug("loading ts compiler options");
        const configPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, "tsconfig.json");
        const configFile = configPath !== undefined ? ts.readConfigFile(configPath, ts.sys.readFile).config : {};

        compilerOptions = ts.convertCompilerOptionsFromJson(configFile.compilerOptions, process.cwd()).options;
    }

    return compilerOptions;
}

export function invalidateCompilerOptions() {
    compilerOptions = undefined;
}

async function scssTransformer(content) {
    logger.debug("using scss transformer on", content.filePath);
    const data = (await sass.compileStringAsync(content.data.toString())).css;

    return {
        ...content,
        data,
        contentType: "text/css",
    };
}

function htmlTransformer(content) {
    logger.debug("using html transformer on", content.filePath);
    const data = content.data
        .toString()
        .replace("</body>", '<script src="__sharat_events__.js" type="module"></script></body>');

    return {
        ...content,
        data,
    };
}
