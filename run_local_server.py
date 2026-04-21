#!/usr/bin/env python3
"""Start a local server for the F&O Planner frontend."""

from __future__ import annotations

import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run local frontend server")
    parser.add_argument("--host", default="127.0.0.1", help="Host interface (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8000, help="Port number (default: 8000)")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    server = ThreadingHTTPServer((args.host, args.port), SimpleHTTPRequestHandler)
    server_id = f"{args.host}:{args.port}"

    print("=" * 56)
    print("F&O Planner Local Server")
    print(f"Server ID : {server_id}")
    print(f"URL       : http://{server_id}")
    print("Press Ctrl+C to stop")
    print("=" * 56)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
