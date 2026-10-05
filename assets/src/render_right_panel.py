"""Render the README's right panel images from the existing usage walkthrough.

Needs Google Chrome and Pillow, like build.py:
    python3 assets/src/render_right_panel.py
"""
import os

from build import ASSETS, USAGE_SIZE, serve, shoot


def main():
    server = serve()
    base = f"http://127.0.0.1:{server.server_address[1]}"
    try:
        for lang in ("en", "ko"):
            query = f"lang={lang}&cap=4&side=panel&detail=panel&cursor=relaunch"
            output = os.path.join(ASSETS, f"right-panel-{lang}.png")
            shoot(f"{base}/assets/src/usage.html?{query}", output, *USAGE_SIZE)
            print(f"Rendered {output}")
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
