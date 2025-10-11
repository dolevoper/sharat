import * as path from "node:path";
import * as fs from "node:fs/promises";

export async function load(relativePath) {
    const filePath = path.join(process.cwd(), relativePath);

    try {
        const data = await fs.readFile(filePath);
        const extension = path.extname(filePath);

        return { data, extension }
    } catch (err) {
        if (err.code !== "ENOENT" && err.code !== "EISDIR") {
            throw err;
        }
    }
}
