import json
import asyncio
import websockets

import http.server
import socketserver

from threading import Thread

###########################################
# STATE: dict = {"canvas": [["#ffffff"]*800]*600} # this is wrong because it messes up references
# STATE: dict = {"canvas": [["#fff" for j in range(800)] for i in range(600)]}
STATE:    dict = {"type": "state", "history": []}
USERS:     set = set()
HTTP_PORT: int = 8081
WS_PORT:   int = 1337
TYPES: dict = {
    "DRAWDOWN": 0x2,
    "DRAW": 0x3,
    "DRAWUP": 0x4,
    "CLEAR": 0x5
}
USER_ID: int = 0
###########################################


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory='public', **kwargs)


def state_event():
    return json.dumps({"type": "state", **STATE})


def draw_event(data):
    return json.dumps({"type": "draw", **data})


def user_event():
    return json.dumps({"type": "user", "count": len(USERS)})


def id_event(newUser=True):
    global USER_ID
    id = USER_ID
    if newUser:
        USER_ID = USER_ID + 1
    return json.dumps({"type": "id", "id": id})


async def broadcast(socks, data):
    await asyncio.gather(*[ws.send(data) for ws in socks])


async def draw(websocket, path):
    try:
        USERS.add(websocket)
        await broadcast(USERS, user_event())
        await websocket.send(id_event())
        await websocket.send(state_event())

        async for message in websocket:
            data = message.encode()

            if data[0] in [TYPES["DRAWDOWN"], TYPES["DRAW"], TYPES["DRAWUP"]]:
                STATE["history"].append(data.decode())
                await broadcast(USERS, draw_event({"data": message}))
                continue

            data = json.loads(message)
            if data["type"] == "clear":
                await broadcast(USERS, message)

    finally:
        USERS.remove(websocket)
        await broadcast(USERS, user_event())


def webserver():
    with socketserver.TCPServer(("0.0.0.0", HTTP_PORT), Handler) as httpd:
        print(f'serving on port: {HTTP_PORT} (http://localhost:{HTTP_PORT})')
        httpd.serve_forever()


async def websocket():
    async with websockets.serve(draw, "0.0.0.0", WS_PORT):
        print(
            f'websockets listening on port: {WS_PORT} (ws://localhost:{WS_PORT})')
        await asyncio.Future()


def main():
    # Start websocket
    _t1 = Thread(target=asyncio.run, args=[websocket()])
    _t1.start()

    # Start the server
    _t2 = Thread(target=webserver, args=[])
    _t2.start()
    try:
        _t1.join(1)
        _t2.join(1)
    except KeyboardInterrupt:
        print("Ctrl-c received! Sending kill")
        quit(0)


if __name__ == "__main__":
    main()
