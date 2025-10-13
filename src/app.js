import "./dotenv.js";

import { getPortPromise } from "portfinder";
import { server } from "./server.js";
import * as logger from "./logger.js";
import * as fsWatcher from "./fsWatcher.js";

logger.info("Starting sharat");

const port = await getPortPromise({ port: 3000 });

server.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
});

fsWatcher.start();
