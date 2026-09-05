#!/usr/bin/env python3
"""Render Hatchwatch 32×32 LCD sprites for visual QC. Not imported by the app."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

LCD = (197, 211, 154, 255)
PIXEL = (42, 51, 31, 255)
BG = (14, 18, 12, 255)
LABEL = (184, 212, 106, 255)

N = 32


def blank():
    return [[0] * N for _ in range(N)]


def setp(g, x, y, v=1):
    if 0 <= x < N and 0 <= y < N:
        g[y][x] = v


def rect(g, x0, y0, x1, y1, v=1):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            setp(g, x, y, v)


def ellipse(g, cx, cy, rx, ry, v=1):
    rx = max(rx, 0.6)
    ry = max(ry, 0.6)
    for y in range(N):
        for x in range(N):
            if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1.0:
                g[y][x] = v


def hline(g, x0, x1, y, v=1):
    for x in range(x0, x1 + 1):
        setp(g, x, y, v)


def vline(g, x, y0, y1, v=1):
    for y in range(y0, y1 + 1):
        setp(g, x, y, v)


def feet_front(g, y=28, gap=6, w=3, h=3):
    lx = 16 - gap // 2 - w
    rx = 16 + gap // 2
    rect(g, lx, y, lx + w - 1, y + h - 1, 1)
    rect(g, rx, y, rx + w - 1, y + h - 1, 1)


def feet_side(g, y=28, left=10, right=18, w=3, h=3):
    rect(g, left, y, left + w - 1, y + h - 1, 1)
    rect(g, right, y, right + w - 1, y + h - 1, 1)


def eyes_front(g, y=14, gap=6, w=3, h=3):
    lx = 16 - gap // 2 - w
    rx = 16 + gap // 2
    rect(g, lx, y, lx + w - 1, y + h - 1, 0)
    rect(g, rx, y, rx + w - 1, y + h - 1, 0)


def smile(g, y=20, x0=12, x1=19):
    hline(g, x0 + 1, x1 - 1, y, 0)
    setp(g, x0, y - 1, 0)
    setp(g, x1, y - 1, 0)


def duck_bill(g, x0, x1, y0, y1, mouth_rows):
    """Filled bill pointing left, with unlit mouth slots."""
    rect(g, x0, y0, x1, y1, 1)
    # rounded tip
    vline(g, x0 - 1, y0 + 1, y1 - 1, 1)
    for y in mouth_rows:
        hline(g, x0, x1 - 1, y, 0)


def egg():
    g = blank()
    ellipse(g, 16, 17, 8.4, 11.4, 1)
    return g


def babytchi():
    g = blank()
    ellipse(g, 16, 17, 8.0, 7.6, 1)
    rect(g, 9, 13, 10, 14, 1)
    rect(g, 21, 13, 22, 14, 1)
    eyes_front(g, y=15, gap=4, w=3, h=3)
    hline(g, 14, 17, 20, 0)
    feet_front(g, y=25, gap=6, w=3, h=3)
    return g


def marutchi():
    g = blank()
    ellipse(g, 16, 16, 10.4, 9.6, 1)
    rect(g, 5, 13, 6, 16, 1)
    rect(g, 25, 13, 26, 16, 1)
    eyes_front(g, y=13, gap=6, w=3, h=3)
    smile(g, y=20, x0=11, x1=20)
    feet_front(g, y=26, gap=8, w=3, h=3)
    return g


def tamatchi():
    g = blank()
    ellipse(g, 16, 16, 10.2, 9.4, 1)
    ellipse(g, 6, 14, 3.2, 3.6, 1)
    ellipse(g, 26, 14, 3.2, 3.6, 1)
    eyes_front(g, y=13, gap=6, w=3, h=3)
    smile(g, y=20, x0=11, x1=20)
    feet_front(g, y=26, gap=8, w=3, h=3)
    return g


def kuchitamatchi():
    g = blank()
    ellipse(g, 19, 16, 9.0, 9.0, 1)
    duck_bill(g, 4, 11, 13, 21, [15, 16, 18])
    rect(g, 13, 12, 16, 15, 0)
    setp(g, 16, 13, 1)
    feet_side(g, y=26, left=13, right=22, w=3, h=3)
    return g


def mametchi():
    g = blank()
    ellipse(g, 16, 16, 10.0, 9.6, 1)
    ellipse(g, 6, 11, 3.4, 3.8, 1)
    ellipse(g, 26, 11, 3.4, 3.8, 1)
    # glasses
    rect(g, 8, 13, 13, 16, 0)
    rect(g, 18, 13, 23, 16, 0)
    hline(g, 13, 18, 14, 0)
    smile(g, y=21, x0=12, x1=19)
    feet_front(g, y=26, gap=8, w=3, h=3)
    return g


def ginjirotchi():
    g = blank()
    ellipse(g, 16, 16, 10.2, 9.6, 1)
    # small ears sitting on the crown
    rect(g, 10, 6, 12, 9, 1)
    rect(g, 19, 6, 21, 9, 1)
    setp(g, 11, 5, 1)
    setp(g, 20, 5, 1)
    eyes_front(g, y=13, gap=6, w=3, h=3)
    smile(g, y=20, x0=11, x1=20)
    feet_front(g, y=26, gap=8, w=3, h=3)
    return g


def maskutchi():
    g = blank()
    ellipse(g, 16, 16, 10.0, 9.8, 1)
    # rounded face window under the helmet
    ellipse(g, 16, 18.5, 7.4, 5.0, 0)
    rect(g, 11, 16, 13, 18, 1)
    rect(g, 18, 16, 20, 18, 1)
    feet_front(g, y=26, gap=8, w=3, h=3)
    return g


def kuchipatchi():
    g = blank()
    ellipse(g, 19, 17, 10.6, 10.4, 1)
    duck_bill(g, 3, 10, 14, 20, [16, 17])
    rect(g, 12, 13, 15, 16, 0)
    feet_side(g, y=27, left=12, right=22, w=4, h=3)
    return g


def nyorotchi():
    g = blank()
    ellipse(g, 21, 16, 8.2, 8.6, 1)
    ellipse(g, 10, 16, 9.5, 4.2, 1)  # long snout
    # taper the tip
    rect(g, 1, 15, 4, 17, 1)
    hline(g, 2, 10, 16, 0)
    rect(g, 15, 12, 18, 15, 0)
    # tail curl
    rect(g, 28, 17, 30, 20, 1)
    setp(g, 29, 21, 1)
    setp(g, 27, 21, 1)
    feet_side(g, y=26, left=15, right=24, w=3, h=3)
    return g


def tarakotchi():
    g = blank()
    ellipse(g, 19, 17, 9.2, 9.0, 1)
    # messy tuft, not antennae
    rect(g, 16, 6, 23, 9, 1)
    setp(g, 17, 5, 1)
    setp(g, 20, 4, 1)
    setp(g, 22, 5, 1)
    setp(g, 19, 5, 1)
    setp(g, 24, 7, 1)
    duck_bill(g, 4, 12, 13, 21, [15, 16, 18, 19])
    rect(g, 13, 12, 16, 15, 0)
    feet_side(g, y=27, left=13, right=22, w=3, h=3)
    return g


def oyajitchi():
    g = blank()
    ellipse(g, 16, 16, 9.6, 9.2, 1)
    eyes_front(g, y=13, gap=6, w=3, h=2)
    # mustache
    hline(g, 10, 21, 18, 0)
    hline(g, 11, 20, 19, 0)
    setp(g, 11, 20, 0)
    setp(g, 20, 20, 0)
    hline(g, 13, 18, 22, 0)
    feet_front(g, y=26, gap=8, w=3, h=3)
    return g


def bill():
    g = blank()
    ellipse(g, 16, 17, 9.6, 9.0, 1)
    # flat cap + brim
    rect(g, 8, 7, 23, 11, 1)
    hline(g, 6, 25, 11, 1)
    rect(g, 23, 10, 27, 12, 1)
    eyes_front(g, y=14, gap=6, w=3, h=2)
    hline(g, 10, 21, 19, 0)
    hline(g, 11, 20, 20, 0)
    hline(g, 13, 18, 23, 0)
    feet_front(g, y=27, gap=8, w=3, h=3)
    return g


SPRITES = {
    "egg": egg(),
    "babytchi": babytchi(),
    "marutchi": marutchi(),
    "tamatchi": tamatchi(),
    "kuchitamatchi": kuchitamatchi(),
    "mametchi": mametchi(),
    "ginjirotchi": ginjirotchi(),
    "maskutchi": maskutchi(),
    "kuchipatchi": kuchipatchi(),
    "nyorotchi": nyorotchi(),
    "tarakotchi": tarakotchi(),
    "oyajitchi": oyajitchi(),
    "bill": bill(),
}

POOP = blank()
ellipse(POOP, 16, 22, 6.5, 4.5, 1)
ellipse(POOP, 16, 16, 5.0, 3.6, 1)
ellipse(POOP, 16, 11, 3.4, 2.6, 1)


def to_ascii(g):
    return ["".join("#" if p else "." for p in row) for row in g]


def render_cell(g, scale=6):
    img = Image.new("RGBA", (N * scale, N * scale), LCD)
    px = img.load()
    for y in range(N):
        for x in range(N):
            if g[y][x]:
                for dy in range(scale):
                    for dx in range(scale):
                        px[x * scale + dx, y * scale + dy] = PIXEL
    return img


def main():
    names = list(SPRITES.keys())
    scale = 6
    pad = 16
    label_h = 22
    cols = 5
    rows = (len(names) + cols - 1) // cols
    cell = N * scale
    W = pad + cols * (cell + pad)
    H = pad + rows * (cell + label_h + pad)
    sheet = Image.new("RGBA", (W, H), BG)
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
    except OSError:
        font = ImageFont.load_default()
    for i, name in enumerate(names):
        r, c = divmod(i, cols)
        x = pad + c * (cell + pad)
        y = pad + r * (cell + label_h + pad)
        cell_img = render_cell(SPRITES[name], scale)
        draw.rounded_rectangle([x - 4, y - 4, x + cell + 3, y + cell + 3], 6, fill=LCD)
        sheet.paste(cell_img, (x, y))
        draw.text((x, y + cell + 4), name, fill=LABEL, font=font)
    out = Path("/workspace/screenshots/sprites-preview.png")
    sheet.save(out)
    print("wrote", out, sheet.size)

    lines = [
        'import type { CharacterId } from "./types";',
        "",
        "/** 32×32 LCD maps. `.` empty, `#` lit. Original-inspired silhouettes, not ROM dumps. */",
        "export const SPRITES: Record<CharacterId, string[]> = {",
    ]
    for name in names:
        rows_s = to_ascii(SPRITES[name])
        lines.append(f"  {name}: [")
        for row in rows_s:
            lines.append(f'    "{row}",')
        lines.append("  ],")
    lines.append("};")
    lines.append("")
    lines.append("export const POOP_SPRITE = [")
    poop_rows = to_ascii(POOP)
    # trim empty rows but keep a tight stack
    first = next(i for i, r in enumerate(poop_rows) if "#" in r)
    last = max(i for i, r in enumerate(poop_rows) if "#" in r)
    for row in poop_rows[first : last + 1]:
        lines.append(f'  "{row}",')
    lines.append("];")
    lines.append("")
    Path("/workspace/src/lib/tama/sprites.ts").write_text("\n".join(lines) + "\n")
    print("wrote sprites.ts")


if __name__ == "__main__":
    main()
