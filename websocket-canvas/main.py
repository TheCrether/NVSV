import json
import asyncio
import websockets

import http.server
import socketserver

from threading import Thread

###########################################
# STATE: dict = {"canvas": [["#ffffff"]*800]*600} # this is wrong because it messes up references
STATE: dict = {"canvas": [["#fff" for j in range(800)] for i in range(600)]}

USERS: set = set()

PORT: int = 8080
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


async def broadcast(socks, data):
    await asyncio.gather(*[ws.send(data) for ws in socks])
    # for ws in socks:
    #     await ws.send(data)


async def draw(websocket, path):
    try:
        USERS.add(websocket)
        await broadcast(USERS, user_event())
        await websocket.send(state_event())

        async for message in websocket:
            data = json.loads(message)
            if data['action'] == 'draw':
                x, y = data['pos']
                STATE["canvas"][y][x] = data['color']
                await broadcast(USERS, draw_event({key: data[key] for key in ['pos', 'color', 'width']}))

    finally:
        USERS.remove(websocket)
        await broadcast(USERS, user_event())


def webserver():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print('serving on port: ', PORT)
        httpd.serve_forever()


async def websocket():
    async with websockets.serve(draw, "localhost", 1337):
        print('websockets listening on port: 1337')
        await asyncio.Future()


def main():
    # Start websocket
    Thread(target=asyncio.run, args=[websocket()]).start()

    # Start the server
    _t = Thread(target=webserver, args=[])
    _t.start()
    _t.join()


if __name__ == "__main__":
    main()
