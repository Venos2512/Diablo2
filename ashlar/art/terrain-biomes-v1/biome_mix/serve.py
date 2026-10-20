#!/usr/bin/env python3
"""Static server for the biome_mix viewer. Serves the terrain-biomes-v1 folder (so ../albedo1024 etc. resolve).

Run:   python -I serve.py [--port 8791]     then open http://127.0.0.1:8791/biome_mix/
"""
import argparse
import functools
import http.server
from pathlib import Path

BIOME_DIR = Path(__file__).resolve().parent.parent


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, ".js": "text/javascript", ".mjs": "text/javascript"}

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):  # quiet unless an error
        if args and str(args[1]).startswith(("4", "5")):
            super().log_message(fmt, *args)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8791)
    a = ap.parse_args()
    handler = functools.partial(Handler, directory=str(BIOME_DIR))
    with http.server.ThreadingHTTPServer(("127.0.0.1", a.port), handler) as srv:
        print(f"http://127.0.0.1:{a.port}/biome_mix/", flush=True)
        try:
            srv.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
