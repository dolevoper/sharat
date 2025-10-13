#!/usr/bin/env node

import { spawn } from "node:child_process";
import * as path from "node:path";

let currentAppProcess = startApp();

setTimeout(keepAppRunning);

function startApp() {
    return spawn(process.execPath, [path.join(import.meta.dirname, "app.js")], {
        cwd: process.cwd(),
        env: process.env,
        stdio: "inherit",
    });
}

function keepAppRunning() {
    currentAppProcess.addListener("exit", () => {
        currentAppProcess = startApp();

        setTimeout(keepAppRunning);
    });
}
