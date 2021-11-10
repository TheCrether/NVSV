function colorChange(el) {
  if (window.wsConnection) {
    // do stuff
  }
}

function colorInput(el) {
  window["color-label"].style.setProperty("--color", el.value);
  window.drawColor = el.value;
}

function onMessage(e) {
  const data = JSON.parse(e.data);
  console.log("msg", data);
  switch (data.type) {
    case "user": {
      window["user-count"].textContent = data.count;
    }
    case "stats": {
    }
  }
}

function load() {
  const connectingWrapper = document.getElementById("connecting-wrapper");
  const wsConnection = new WebSocket("ws://localhost:1337");
  wsConnection.addEventListener("open", () => {
    window.wsConnection = wsConnection;
    connectingWrapper.classList.add("hidden");
  });
  wsConnection.addEventListener("message", onMessage);
  wsConnection.addEventListener("error", () => {
    connectingWrapper.textContent = "Could not get connected!";
    connectingWrapper.classList.remove("hidden");
    connectingWrapper.classList.add("no-anim");
  });
  wsConnection.addEventListener("close", () => {
    connectingWrapper.textContent = "Disconnected! Refresh to connect again";
    connectingWrapper.classList.remove("hidden");
    connectingWrapper.classList.add("no-anim");
  });
  const color = window.color;
  color.addEventListener("input", (ev) => colorInput(ev.target));
  color.addEventListener("change", (ev) => colorChange(ev.target));
}

window.addEventListener("load", load);
