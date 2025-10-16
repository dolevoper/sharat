function _debug(...data) {
    console.log("\x1b[33mDEBUG:\x1b[0m", ...data);
}

export const debug = process.env.SHOW_DEBUG_LOGS === "true"
    ? _debug
    : function () { };


export const info = console.log.bind(console);
export const error = console.error.bind(console);