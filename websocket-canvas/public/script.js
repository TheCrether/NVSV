const TYPES = {
  USER: 0,
  STATE: 1,
  DRAW: 2,
};

function colorChange(el) {
  window.drawColor = el.value;
}

function colorInput(el) {
  window["color-label"].style.setProperty("--color", el.value);
}

function widthChange(el) {
  window.drawWidth = el.value;
}

function widthInput(el) {
  window["width-text"].textContent = el.value;
}

// Convert a hex string to a byte array
function hexToBytes(hex) {
  for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}

// Convert a byte array to a hex string
function bytesToHex(bytes) {
  for (var hex = [], i = 0; i < bytes.length; i++) {
    var current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
    hex.push((current >>> 4).toString(16));
    hex.push((current & 0xf).toString(16));
  }
  return hex.join("");
}

const bytesToStr = (byteArr) => {
  let str = "";
  byteArr.forEach((n) => (str += String.fromCharCode(n)));
  return str;
};
const strToBytes = (str) => {
  let arr = new Uint8Array(str.length);
  str.split("").forEach((c, i) => (arr[i] = c.charCodeAt(0)));
  return arr;
};

function draw(x, y) {
  window.drawColor = window.drawColor || "#000000";
  window.drawWidth = window.drawWidth || 3;
  if (window.ws) {
    const uint8 = new Uint8Array(9);
    uint8[0] = TYPES.DRAW; // set the type
    uint8[1] = window.drawWidth; // the width is one byte
    // split up the x and y coordinate into two bytes each, since they can be bigger than 255
    uint8[2] = Math.floor(x / 256);
    uint8[3] = x % 256;
    uint8[4] = Math.floor(y / 256);
    uint8[5] = y % 256;
    // 3 bytes for RGB
    uint8[6] = hexToBytes(window.drawColor.substr(1, 2));
    uint8[7] = hexToBytes(window.drawColor.substr(3, 2));
    uint8[8] = hexToBytes(window.drawColor.substr(5, 2));

    window.ws.send(bytesToStr(uint8));
  }
}

function onMousedown(e) {
  window.isMouseDown = true;
  const x = e.offsetX;
  const y = e.offsetY;
  draw(x, y);
}

function onMousemove(e) {
  if (window.isMouseDown) {
    const x = e.offsetX;
    const y = e.offsetY;
    draw(x, y);
  }
}

function onMouseup(e) {
  if (window.isMouseDown) {
    const x = e.offsetX;
    const y = e.offsetY;
    draw(x, y);
    window.isMouseDown = false;
  }
}

function onMessage(e) {
  const data = JSON.parse(e.data);
  switch (data.type) {
    case "user": {
      window["user-count"].textContent = data.count;
      break;
    }
    case "state": {
      const connectingWrapper = document.getElementById("connecting-wrapper");
      connectingWrapper.classList.add("hidden");
      window.canvas.addEventListener("mousedown", onMousedown, false);
      window.canvas.addEventListener("mouseup", onMouseup, false);
      window.canvas.addEventListener("mousemove", onMousemove, false);
      const ctx = window.canvas.getContext("2d");
      data.history.forEach((i) => {
        const bytes = strToBytes(i);
        ctx.beginPath();
        ctx.fillStyle =
          "#" +
          bytesToHex([bytes[5]]) +
          bytesToHex([bytes[6]]) +
          bytesToHex([bytes[7]]);
        const x = bytes[1] * 256 + bytes[2];
        const y = bytes[3] * 256 + bytes[4];
        ctx.arc(x, y, bytes[0], 0, 2 * Math.PI);
        ctx.fill();
      });

      break;
    }
    case "draw": {
      const ctx = window.canvas.getContext("2d");

      const bytes = strToBytes(data.data);
      ctx.beginPath();
      ctx.fillStyle =
        "#" +
        bytesToHex([bytes[5]]) +
        bytesToHex([bytes[6]]) +
        bytesToHex([bytes[7]]);
      const x = bytes[1] * 256 + bytes[2];
      const y = bytes[3] * 256 + bytes[4];
      ctx.arc(x, y, bytes[0], 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

function load() {
  const connectingWrapper = document.getElementById("connecting-wrapper");
  const wsConnection = new WebSocket("ws://localhost:1337");
  wsConnection.addEventListener("open", () => {
    window.ws = wsConnection;
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
  colorChange(color);
  color.addEventListener("input", (ev) => colorInput(ev.target));
  color.addEventListener("change", (ev) => colorChange(ev.target));

  const width = window["width-input"];
  widthChange(width);
  width.addEventListener("input", (ev) => widthInput(ev.target));
  width.addEventListener("change", (ev) => widthChange(ev.target));
}

window.addEventListener("load", load);
