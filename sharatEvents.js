const serverEvents = new EventSource("__sharat_events__");

serverEvents.addEventListener("message", function (e) {
    const oldScriptElement = document.querySelector(`script[src='${e.data}']`);

    if (!oldScriptElement) {
        return;
    }

    oldScriptElement.remove();

    const newScriptElement = document.createElement("script");

    newScriptElement.src = e.data;
    newScriptElement.type = oldScriptElement.type;

    document.head.appendChild(newScriptElement);
});