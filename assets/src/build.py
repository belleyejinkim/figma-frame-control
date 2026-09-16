"""Render the icon and cover assets from the HTML sources in this folder.

Needs Google Chrome, Pillow, and ffmpeg:
    python3 assets/src/build.py
"""
import http.server
import os
import shutil
import subprocess
import tempfile
import threading
from functools import partial

from PIL import Image

SRC = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.dirname(SRC)
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# (query, milliseconds). One loop of the shortcut: hide, then restore.
TIMELINE = [
    ("labels=1", 1400),
    ("keys=cmd&labels=1", 160),
    ("keys=cmd,opt&labels=1", 160),
    ("keys=cmd,opt,f&labels=0.4", 70),
    ("keys=cmd,opt,f&labels=0&toast=hid", 260),
    ("labels=0&toast=hid", 1500),
    ("labels=0", 700),
    ("keys=cmd&labels=0", 160),
    ("keys=cmd,opt&labels=0", 160),
    ("keys=cmd,opt,f&labels=0.6", 70),
    ("keys=cmd,opt,f&labels=1&toast=restored", 260),
    ("labels=1&toast=restored", 1500),
]
STATIC_COVER = "keys=cmd,opt,f&labels=0&ghost=1&toast=hid"


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def serve():
    handler = partial(QuietHandler, directory=SRC)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


def shoot(url, out, width, height):
    subprocess.run(
        [CHROME, "--headless", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
         "--virtual-time-budget=1500", f"--window-size={width},{height}", f"--screenshot={out}", url],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )


def main():
    server = serve()
    base = f"http://127.0.0.1:{server.server_address[1]}"
    work = tempfile.mkdtemp()
    try:
        # Icon: render large, then scale down for clean edges.
        big = os.path.join(work, "icon-512.png")
        shoot(f"{base}/icon.html", big, 512, 512)
        Image.open(big).convert("RGB").resize((128, 128), Image.LANCZOS).save(os.path.join(ASSETS, "icon.png"))

        # Static cover.
        shoot(f"{base}/cover.html?{STATIC_COVER}", os.path.join(ASSETS, "cover.png"), 1920, 1080)

        # Animation frames.
        frames = []
        for i, (query, _) in enumerate(TIMELINE):
            path = os.path.join(work, f"frame-{i:02d}.png")
            shoot(f"{base}/cover.html?{query}", path, 1920, 1080)
            frames.append(Image.open(path).convert("RGB"))

        # GIF: one shared palette so flat areas don't flicker between frames.
        sheet = Image.new("RGB", (1920, 1080 * 3))
        for row, idx in enumerate((0, 4, 3)):
            sheet.paste(frames[idx], (0, 1080 * row))
        palette = sheet.quantize(colors=255, method=Image.Quantize.MEDIANCUT)
        indexed = [f.quantize(palette=palette, dither=Image.Dither.NONE) for f in frames]
        indexed[0].save(
            os.path.join(ASSETS, "cover.gif"), save_all=True, append_images=indexed[1:],
            duration=[ms for _, ms in TIMELINE], loop=0, optimize=False, disposal=1,
        )

        # MP4 for the Figma Community thumbnail: two loops at 30 fps.
        listing = os.path.join(work, "frames.txt")
        with open(listing, "w") as fh:
            for _ in range(2):
                for i, (_, ms) in enumerate(TIMELINE):
                    fh.write(f"file '{os.path.join(work, f'frame-{i:02d}.png')}'\nduration {ms / 1000:.3f}\n")
            fh.write(f"file '{os.path.join(work, 'frame-00.png')}'\n")
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", listing,
             "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "18",
             "-movflags", "+faststart", os.path.join(ASSETS, "cover.mp4")],
            check=True,
        )
    finally:
        server.shutdown()
        shutil.rmtree(work, ignore_errors=True)


if __name__ == "__main__":
    main()
