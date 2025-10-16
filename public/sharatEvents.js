const serverEvents = new EventSource("__sharat_events__");

serverEvents.addEventListener("refresh", () => {
    window.location.reload();
});
