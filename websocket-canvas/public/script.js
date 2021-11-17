const TYPES = {
  USER: 0,
  STATE: 1,
  DRAWDOWN: 2,
  DRAW: 3,
  DRAWUP: 4,
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

function draw(x, y, type) {
  window.drawColor = window.drawColor || "#000000";
  window.drawWidth = window.drawWidth || 3;
  if (window.ws) {
    const uint8 = new Uint8Array(10);
    uint8[0] = type; // set the type
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
    uint8[9] = window.userId || 0;

    window.ws.send(bytesToStr(uint8));
  }
}

function onMousedown(e) {
  window.isMouseDown = true;
  window.previousPoint[window.userId] = undefined;
  const x = e.offsetX;
  const y = e.offsetY;
  draw(x, y, TYPES.DRAWDOWN);
}

function onMousemove(e) {
  if (window.isMouseDown) {
    let r = window.canvas.getBoundingClientRect();
    const x = e.offsetX || e.clientX - r.left;
    const y = e.offsetY || e.clientY - r.top;
    draw(x, y, TYPES.DRAW);
  }
}

function onMouseup(e) {
  if (window.isMouseDown) {
    const x = e.offsetX;
    const y = e.offsetY;
    draw(x, y, TYPES.DRAWUP);
    window.isMouseDown = false;
    window.previousPoint[window.userId] = undefined;
  }
}

function onMessage(e) {
  const data = JSON.parse(e.data);
  switch (data.type) {
    case "user": {
      window["user-count"].textContent = data.count;
      window.userId = data.id;
      break;
    }
    case "state": {
      const connectingWrapper = document.getElementById("connecting-wrapper");
      connectingWrapper.classList.add("hidden");
      window.canvas.addEventListener("mousedown", onMousedown, false);
      window.canvas.addEventListener("mousemove", onMousemove, false);
      window.canvas.addEventListener("mouseup", onMouseup, false);
      window.canvas.addEventListener(
        "touchstart",
        (e) => onMousedown(e.touches[0]),
        false
      );
      window.canvas.addEventListener(
        "touchmove",
        (e) => {
          onMousemove(e.touches[0]);
          e.preventDefault();
        },
        false
      );
      window.canvas.addEventListener(
        "touchend",
        (e) => onMouseup(e.changedTouches[0]),
        false
      );
      data.history.forEach(drawMessage);

      break;
    }
    case "draw": {
      drawMessage(data.data);
    }
  }
}

function drawMessage(dataStr) {
  const ctx = window.canvas.getContext("2d");
  const bytes = strToBytes(dataStr);
  ctx.lineWidth = bytes[1];
  ctx.strokeStyle =
    "#" +
    bytesToHex([bytes[6]]) +
    bytesToHex([bytes[7]]) +
    bytesToHex([bytes[8]]);
  ctx.fillStyle = ctx.strokeStyle;

  const x = bytes[2] * 256 + bytes[3];
  const y = bytes[4] * 256 + bytes[5];
  const id = bytes[9];

  ctx.beginPath();
  if (bytes[0] == TYPES.DRAWDOWN) {
    ctx.arc(x, y, ctx.lineWidth / 2, 0, 2 * Math.PI);
    ctx.fill();
  } else {
    const { x: x1, y: y1 } = window.previousPoint[id];

    ctx.moveTo(x1, y1);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  window.previousPoint[id] = { x, y };

  if (bytes[0] == TYPES.DRAWUP) {
    ctx.arc(x, y, ctx.lineWidth / 2, 0, 2 * Math.PI);
    ctx.fill();
    window.previousPoint[id] = undefined;
  }

  ctx.closePath();
}

function load() {
  window.previousPoint = {};
  const connectingWrapper = document.getElementById("connecting-wrapper");
  const wsConnection = new WebSocket(`ws://${window.location.hostname}:1337`);
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
  color.value = "#" + Math.floor(Math.random() * 16777215).toString(16);
  colorInput(color);
  colorChange(color);
  color.addEventListener("input", (ev) => colorInput(ev.target));
  color.addEventListener("change", (ev) => colorChange(ev.target));

  const width = window["width-input"];
  widthChange(width);
  width.addEventListener("input", (ev) => widthInput(ev.target));
  width.addEventListener("change", (ev) => widthChange(ev.target));
}

window.addEventListener("load", load);
