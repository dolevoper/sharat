#!/usr/bin/env node

import "./dotenv.js";

import { getPortPromise } from "portfinder";
import { server } from "./server.js";
import * as logger from "./logger.js";
import * as fsWatcher from "./fsWatcher.js";

const port = await getPortPromise({ port: 3000 });

server.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
});

fsWatcher.start();
