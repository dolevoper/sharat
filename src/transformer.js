import * as path from "node:path";
import * as ts from "typescript";
import * as logger from "./logger.js";

const transformers = new Map([
    [".ts", tsTransformer],
]);

export function transform(content) {
    const transformer = transformers.get(content.extension);

    if (!transformer) {
        logger.debug("not transformer found for file", content.filePath);
        return content;
    }

    return transformer(content);
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
