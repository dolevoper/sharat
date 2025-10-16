const subscribers = new Set();

const sendEvent = (event, data) => (res) => {
    if (res.writableEnded) {
        return;
    }

    res.write(`event: ${event}\n`);
    res.write(`data: ${data}\n\n`);
};

export function subscribe(res) {
    if (res.headersSent || res.writableEnded) {
        return;
    }

    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
    });
    res.write(": connected\n\n");

    subscribers.add(res);
}

export function unsubscribe(res) {
    subscribers.delete(res);
}

export function signalRefresh() {
    subscribers.forEach(sendEvent("refresh"));
}
