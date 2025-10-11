const serverEvents = new EventSource("__sharat_events__");

serverEvents.addEventListener("refresh", () => {
    window.location.reload();
});

serverEvents.addEventListener("replaceScript", function (e) {
    console.log(e.data);
    const oldScriptElement = document.querySelector(`script[src^='${e.data}'], script[src^='/${e.data}'], script[src^='./${e.data}']`);

    if (!oldScriptElement) {
        return;
    }

    const newScriptElement = document.createElement("script");

    newScriptElement.src = `${e.data}?v=${Date.now()}`;
    newScriptElement.type = oldScriptElement.type;

    oldScriptElement.replaceWith(newScriptElement);
});
