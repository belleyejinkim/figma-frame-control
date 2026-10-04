"""Render the icon, cover, and shortcut assets from the HTML sources in this folder.

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

# (query, milliseconds). One loop: click the button to hide, press ⌥⌘F to bring names back.
TIMELINE = [
    ("labels=1&cursor=1", 1200),
    ("labels=1&cursor=1&pressed=1", 140),
    ("labels=0.4&cursor=1&pressed=1", 70),
    ("labels=0&names=hidden&toast=hid&cursor=1", 1400),
    ("labels=0&names=hidden&keys=cmd", 160),
    ("labels=0&names=hidden&keys=cmd,opt", 160),
    ("labels=0.6&names=hidden&keys=cmd,opt,f", 70),
    ("labels=1&toast=restored&keys=cmd,opt,f", 300),
    ("labels=1&toast=restored", 1300),
]
STATIC_COVER = "labels=0&names=hidden&ghost=1&toast=hid&cursor=1"
COVER_SIZE = (1920, 1080)
COVER_KEYFRAMES = (0, 3, 7)

# (query, milliseconds). Setting up the macOS shortcut, start to finish. Rendered once per language.
SHORTCUT = [
    ("cap=1&cursor=shortcuts", 1200),
    ("cap=1&cursor=shortcuts&press=shortcuts", 220),
    ("cap=2&view=sheet&sel=dock&cursor=apps", 1100),
    ("cap=2&view=sheet&sel=apps&cursor=plus", 1000),
    ("cap=2&view=sheet&sel=apps&cursor=plus&press=plus", 200),
    ("cap=3&view=add&fields=empty&cursor=app", 900),
    ("cap=3&view=add&fields=picked", 700),
    ("cap=3&view=add&fields=typed", 1300),
    ("cap=4&view=add&fields=recording&cursor=shortcut", 800),
    ("cap=4&view=add&fields=recorded&cursor=add-done", 1000),
    ("cap=4&view=add&fields=recorded&cursor=add-done&press=add-done", 200),
    ("cap=5&view=sheet&sel=apps&added=1&cursor=done", 2100),
]
SHORTCUT_SIZE = (1240, 820)
SHORTCUT_KEYFRAMES = (0, 4, 7, 11)


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


def shoot_all(base, page, timeline, size, work, tag):
    frames = []
    for i, (query, _) in enumerate(timeline):
        path = os.path.join(work, f"{tag}-{i:02d}.png")
        shoot(f"{base}/{page}?{query}", path, *size)
        frames.append(path)
    return frames


def write_gif(out, paths, timeline, size, keyframes):
    """One shared palette, so flat areas don't flicker between frames."""
    frames = [Image.open(p).convert("RGB") for p in paths]
    sheet = Image.new("RGB", (size[0], size[1] * len(keyframes)))
    for row, idx in enumerate(keyframes):
        sheet.paste(frames[idx], (0, size[1] * row))
    palette = sheet.quantize(colors=255, method=Image.Quantize.MEDIANCUT)
    indexed = [f.quantize(palette=palette, dither=Image.Dither.NONE) for f in frames]
    indexed[0].save(
        out, save_all=True, append_images=indexed[1:],
        duration=[ms for _, ms in timeline], loop=0, optimize=False, disposal=1,
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

        # Animated cover.
        cover = shoot_all(base, "cover.html", TIMELINE, COVER_SIZE, work, "frame")
        write_gif(os.path.join(ASSETS, "cover.gif"), cover, TIMELINE, COVER_SIZE, COVER_KEYFRAMES)

        # Walkthrough of the macOS shortcut setup, one GIF per language.
        for lang in ("en", "ko"):
            steps = [(f"lang={lang}&{query}", ms) for query, ms in SHORTCUT]
            shots = shoot_all(base, "shortcut.html", steps, SHORTCUT_SIZE, work, f"shortcut-{lang}")
            write_gif(os.path.join(ASSETS, f"shortcut-{lang}.gif"), shots, steps, SHORTCUT_SIZE,
                      SHORTCUT_KEYFRAMES)

        # MP4 for the Figma Community thumbnail: two loops at 30 fps.
        listing = os.path.join(work, "frames.txt")
        with open(listing, "w") as fh:
            for _ in range(2):
                for (_, ms), path in zip(TIMELINE, cover):
                    fh.write(f"file '{path}'\nduration {ms / 1000:.3f}\n")
            fh.write(f"file '{cover[0]}'\n")
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
