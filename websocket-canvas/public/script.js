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

function draw(x, y) {
  window.drawColor = window.drawColor || "#000000";
  window.drawWidth = window.drawWidth || 3;
  if (window.ws) {
    const data = {
      action: "draw",
      pos: [x, y],
      color: window.drawColor,
      width: window.drawWidth,
    };
    window.ws.send(JSON.stringify(data));
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
      window.canvas.addEventListener("mousedown", onMousedown, false);
      window.canvas.addEventListener("mouseup", onMouseup, false);
      window.canvas.addEventListener("mousemove", onMousemove, false);
      const ctx = window.canvas.getContext("2d");

      for (let i = 0; i < data.canvas.length; i++) {
        for (let j = 0; j < data.canvas[i].length; j++) {
          ctx.beginPath();
          ctx.fillStyle = data.canvas[i][j];
          // ctx.fillRect(j, i, 1, 1);
          ctx.arc(j, i, 1, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      const connectingWrapper = document.getElementById("connecting-wrapper");
      connectingWrapper.classList.add("hidden");
      break;
    }
    case "draw": {
      const ctx = window.canvas.getContext("2d");
      ctx.beginPath();
      ctx.fillStyle = data.color;
      ctx.arc(
        data.pos[0] - data.width / 2,
        data.pos[1] - data.width / 2,
        data.width / 2,
        0,
        2 * Math.PI
      );
      // ctx.fillRect(
      //   data.width,
      //   data.width
      // );
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
