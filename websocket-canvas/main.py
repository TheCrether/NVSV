import json
import asyncio
import websockets

import http.server
import socketserver

###########################################
STATE: dict = {"canvas": [[0]*800]*600}

USERS: set = set()

PORT: int = 8080
###########################################


class HttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.path = 'public/index.html'
        return http.server.SimpleHTTPRequestHandler.do_GET(self)


def state_event():
    return json.dumps({"type": "state", **STATE})


def draw_event(data):
    return json.dumps({"type": "draw", **data})


def user_event():
    return json.dumps({"type": "user", "count": len(USERS)})


async def draw(websocket, path):
    try:
        USERS.add(websocket)
        websockets.broadcast(user_event())
        await websocket.send(state_event())

        async for message in websocket:
            data = json.loads(message)
            if data['action'] == 'draw':
                x, y = data['pos'].values()
                STATE["canvas"][x][y] = data['color']
                websockets.broadcast(
                    USERS, {key: data[key] for key in ['pos', 'color']})

    finally:
        USERS.remoev(websocket)
        websockets.broadcast(USERS, user_event())


async def main():
    # Create an object of the above class
    handler = HttpRequestHandler

    # Start the server
    my_server = socketserver.TCPServer(("", PORT), handler)
    my_server.serve_forever()

    async with websockets.serve(draw, "localhost", 1337):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
