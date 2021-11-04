function colorChange(el) {
  if (window.wsConnection) {
    // do stuff
  }
}

function colorInput(el) {
  window["color-label"].style.setProperty("--color", el.value);
  window.drawColor = el.value;
}

function load() {
  const connectingWrapper = document.getElementById("connecting-wrapper");
  const wsConnection = new WebSocket("ws://localhost:1337");
  wsConnection.addEventListener("open", () => {
    window.wsConnection = wsConnection;
    connectingWrapper.classList.add("hidden");
  });
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
