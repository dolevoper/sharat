#!/usr/bin/env node

import "./dotenv.js";

console.log(process.env.SHOW_DEBUG_LOGS);

// import * as path from "node:path";
// import * as fs from "node:fs/promises";
// import { readFileSync } from "node:fs";
// import { getPortPromise } from "portfinder";
// import mime from "mime";
// import * as ts from "typescript";
// import * as sass from "sass";
// import { server } from "./server";
import * as logger from "./logger.js";

logger.debug("hello", "world", [1, 2, 3], "not yellow?");

// const debug = process.env.SHOW_DEBUG_LOGS
//     ? console.log.bind(console)
//     : function () { };

// server.listen(port, () => {
//     console.log(`Server is running on http://localhost:${port}`);
// });
