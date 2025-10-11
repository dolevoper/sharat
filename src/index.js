#!/usr/bin/env node

import "./dotenv.js";

// import * as path from "node:path";
// import * as fs from "node:fs/promises";
// import { readFileSync } from "node:fs";
import { getPortPromise } from "portfinder";
// import mime from "mime";
// import * as ts from "typescript";
// import * as sass from "sass";
import { server } from "./server.js";
import * as logger from "./logger.js";

const port = await getPortPromise({ port: 3000 });

server.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
});
