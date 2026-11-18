"""Draw the decoration SVGs in public/img/art/ (original artwork, so no license strings attached).

Every shape carries a tone class instead of a color, and the site paints the tones from the palette:
  l = leaf (the palette's second color), d = deep (the accent), t = light (a pale tint), s/ds/ts = strokes in those tones.
Corners are drawn for the top-left corner of the page; the site rotates the same file for the bottom-right.
Run: python3 scripts/make_art.py
"""
import math
import random
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "img" / "art"


def f(n: float) -> str:
    return f"{n:.1f}".rstrip("0").rstrip(".")


def svg(view: str, body: list[str]) -> str:
    return f'<svg xmlns="http://www.w3.org/2000/svg" class="art" viewBox="{view}" aria-hidden="true" focusable="false">\n' + "\n".join(body) + "\n</svg>\n"


def rot(x: float, y: float, a: float) -> tuple[float, float]:
    c, s = math.cos(a), math.sin(a)
    return x * c - y * s, x * s + y * c


def path(points_cmds: str, cls: str, op: float = 1.0, extra: str = "") -> str:
    o = "" if op >= 1 else f' opacity="{op:.2f}"'
    return f'<path class="{cls}" d="{points_cmds}"{o}{extra}/>'


def tf(cmds: list, x: float, y: float, a: float) -> str:
    """Path commands with points in local leaf space, moved to (x, y) and turned by a radians."""
    out = []
    for c in cmds:
        if isinstance(c, str):
            out.append(c)
        else:
            px, py = rot(c[0], c[1], a)
            out.append(f"{f(x + px)} {f(y + py)}")
    return " ".join(out)


# ---------- Leaves and stems ----------

def leaf(x, y, length, angle, width=0.32, cls="l", curl=0.0, op=1.0):
    """A pointed leaf in two halves with a hairline midrib gap: the lower half a shade lighter, like a print."""
    a = math.radians(angle)
    L, W = length, length * width
    k = curl * L  # bends the tip sideways
    gap = max(0.5, L * 0.012)
    upper = ["M", (0, -gap), "C", (L * 0.25, -W * 1.05), (L * 0.7, -W * 0.85 + k * 0.3), (L, k), "C", (L * 0.7, k * 0.6 - gap), (L * 0.3, -gap), (0, -gap), "Z"]
    lower = ["M", (0, gap), "C", (L * 0.25, W * 0.95), (L * 0.72, W * 0.75 + k * 0.3), (L, k), "C", (L * 0.7, k * 0.6 + gap), (L * 0.3, gap), (0, gap), "Z"]
    return [path(tf(upper, x, y, a), cls, op), path(tf(lower, x, y, a), cls, op * 0.72)]


def round_leaf(x, y, r, angle, cls="l", op=1.0):
    """Eucalyptus 'silver dollar' leaf: a round blade split by its midrib, attached at its edge."""
    a = math.radians(angle)
    gap = max(0.5, r * 0.04)
    up = ["M", (0, -gap), "C", (r * 0.1, -r * 1.1), (r * 1.9, -r * 1.15), (r * 2.0, -gap * 0.2), "L", (r * 2.0, -gap), "Z"]
    lo = ["M", (0, gap), "C", (r * 0.1, r * 1.05), (r * 1.9, r * 1.1), (r * 2.0, gap * 0.2), "L", (r * 2.0, gap), "Z"]
    return [path(tf(up, x, y, a), cls, op), path(tf(lo, x, y, a), cls, op * 0.7)]


def stem(points, width, cls="s", op=1.0):
    d = f"M{f(points[0][0])} {f(points[0][1])}"
    for i in range(1, len(points) - 1, 2):
        (cx, cy), (px, py) = points[i], points[i + 1]
        d += f" Q{f(cx)} {f(cy)} {f(px)} {f(py)}"
    o = "" if op >= 1 else f' opacity="{op:.2f}"'
    return f'<path class="{cls}" d="{d}" fill="none" stroke-width="{f(width)}" stroke-linecap="round"{o}/>'


def curve(x0, y0, angle, length, bend, steps=24):
    """Points along a gently bending branch from (x0, y0)."""
    pts, a = [], math.radians(angle)
    x, y = x0, y0
    seg = length / steps
    for i in range(steps + 1):
        pts.append((x, y, a))
        x += math.cos(a) * seg
        y += math.sin(a) * seg
        a += math.radians(bend) / steps
    return pts


def branch_path(pts):
    d = f"M{f(pts[0][0])} {f(pts[0][1])}"
    for p in pts[1:]:
        d += f" L{f(p[0])} {f(p[1])}"
    return d


def branch(pts, width, cls="s", op=1.0):
    o = "" if op >= 1 else f' opacity="{op:.2f}"'
    return f'<path class="{cls}" d="{branch_path(pts)}" fill="none" stroke-width="{f(width)}" stroke-linecap="round" stroke-linejoin="round"{o}/>'


# ---------- Flowers ----------

def rose(x, y, r, angle=0, op=1.0):
    """Garden rose seen from above: a deep head with petal edges drawn in the light tone."""
    out = [f'<circle class="d" cx="{f(x)}" cy="{f(y)}" r="{f(r)}" opacity="{op:.2f}"/>']
    a0 = math.radians(angle)
    # outer petals: scalloped rim
    for i in range(7):
        a = a0 + i * 2 * math.pi / 7
        px, py = x + math.cos(a) * r * 0.78, y + math.sin(a) * r * 0.78
        out.append(f'<circle class="d" cx="{f(px)}" cy="{f(py)}" r="{f(r * 0.42)}" opacity="{op * 0.9:.2f}"/>')
    # petal edges, spiralling inward
    for i, (rr, sweep, start) in enumerate([(0.95, 140, 10), (0.8, 150, 170), (0.66, 160, 300), (0.52, 170, 80), (0.38, 180, 230), (0.24, 200, 20)]):
        s, e = math.radians(start + angle), math.radians(start + angle + sweep)
        x1, y1 = x + math.cos(s) * r * rr, y + math.sin(s) * r * rr
        x2, y2 = x + math.cos(e) * r * rr, y + math.sin(e) * r * rr
        out.append(f'<path class="ts" d="M{f(x1)} {f(y1)} A{f(r * rr)} {f(r * rr)} 0 0 1 {f(x2)} {f(y2)}" fill="none" stroke-width="{f(max(0.8, r * 0.07))}" stroke-linecap="round" opacity="{op * (0.55 + i * 0.07):.2f}"/>')
    return out


def peony(x, y, r, op=1.0):
    """Layered round bloom: rings of soft petals in the light tone over a deep heart."""
    out = []
    for ring, (rr, n, tone, o) in enumerate([(1.0, 9, "t", 0.95), (0.74, 8, "t", 1.0), (0.5, 7, "d", 0.55), (0.3, 5, "d", 0.9)]):
        for i in range(n):
            a = i * 2 * math.pi / n + ring * 0.4
            px, py = x + math.cos(a) * r * rr * 0.55, y + math.sin(a) * r * rr * 0.55
            out.append(f'<ellipse class="{tone}" cx="{f(px)}" cy="{f(py)}" rx="{f(r * rr * 0.5)}" ry="{f(r * rr * 0.38)}" transform="rotate({f(math.degrees(a))} {f(px)} {f(py)})" opacity="{op * o:.2f}"/>')
    return out


def daisy(x, y, r, petals=13, op=1.0, tone="t"):
    out = []
    for i in range(petals):
        a = i * 360 / petals
        out.append(f'<ellipse class="{tone}" cx="{f(x)}" cy="{f(y - r * 0.55)}" rx="{f(r * 0.17)}" ry="{f(r * 0.45)}" transform="rotate({f(a)} {f(x)} {f(y)})" opacity="{op:.2f}"/>')
    out.append(f'<circle class="d" cx="{f(x)}" cy="{f(y)}" r="{f(r * 0.24)}" opacity="{op:.2f}"/>')
    return out


def blossom(x, y, r, tone="t", op=1.0, angle=0):
    """Five-petal blossom (citrus, apple): rounded petals around a deep eye."""
    out = []
    for i in range(5):
        a = math.radians(angle + i * 72)
        px, py = x + math.cos(a) * r * 0.52, y + math.sin(a) * r * 0.52
        out.append(f'<ellipse class="{tone}" cx="{f(px)}" cy="{f(py)}" rx="{f(r * 0.5)}" ry="{f(r * 0.36)}" transform="rotate({f(math.degrees(a))} {f(px)} {f(py)})" opacity="{op:.2f}"/>')
    out.append(f'<circle class="d" cx="{f(x)}" cy="{f(y)}" r="{f(r * 0.18)}" opacity="{op:.2f}"/>')
    return out


def berries(x, y, r, n, spread, rng, cls="d", op=0.9):
    out = []
    for _ in range(n):
        a, d = rng.uniform(0, 2 * math.pi), rng.uniform(0, spread)
        bx, by = x + math.cos(a) * d, y + math.sin(a) * d
        out.append(f'<circle class="{cls}" cx="{f(bx)}" cy="{f(by)}" r="{f(r * rng.uniform(0.75, 1.1))}" opacity="{op:.2f}"/>')
        out.append(f'<circle class="t" cx="{f(bx - r * 0.3)}" cy="{f(by - r * 0.3)}" r="{f(r * 0.28)}" opacity="0.7"/>')
    return out


def baby_breath(x, y, angle, length, rng, n=14):
    """Gypsophila: hairline stems ending in tiny light dots."""
    out = []
    for _ in range(n):
        a = math.radians(angle + rng.uniform(-28, 28))
        l = length * rng.uniform(0.5, 1.0)
        ex, ey = x + math.cos(a) * l, y + math.sin(a) * l
        out.append(f'<path class="ts" d="M{f(x)} {f(y)} L{f(ex)} {f(ey)}" stroke-width="0.7" opacity="0.6"/>')
        out.append(f'<circle class="t" cx="{f(ex)}" cy="{f(ey)}" r="{f(rng.uniform(1.6, 2.8))}"/>')
    return out


def sparkle(cx, cy, r, cls="d", op=1.0):
    k = r * 0.2
    d = f"M{f(cx)} {f(cy - r)} Q{f(cx + k)} {f(cy - k)} {f(cx + r)} {f(cy)} Q{f(cx + k)} {f(cy + k)} {f(cx)} {f(cy + r)} Q{f(cx - k)} {f(cy + k)} {f(cx - r)} {f(cy)} Q{f(cx - k)} {f(cy - k)} {f(cx)} {f(cy - r)}Z"
    return path(d, cls, op)


# ---------- Corner arrangements (top-left corner, 400 x 400) ----------

def leafy_branch(pts, rng, length, every=2, cls="l", width=0.3, spread=48, op=1.0, curl=0.12):
    out = []
    for i in range(2, len(pts) - 1, every):
        x, y, a = pts[i]
        side = 1 if (i // every) % 2 else -1
        scale = 1 - i / len(pts) * 0.45
        out += leaf(x, y, length * scale * rng.uniform(0.85, 1.1), math.degrees(a) + side * spread * rng.uniform(0.8, 1.15), width, cls, curl * side, op)
    x, y, a = pts[-1]
    out += leaf(x, y, length * 0.7, math.degrees(a), width, cls, 0, op)
    return out


def eucalyptus_branch(pts, rng, r, op=1.0):
    out = [branch(pts, 2, "s", 0.9 * op)]
    for i in range(1, len(pts), 2):
        x, y, a = pts[i]
        side = 1 if (i // 2) % 2 else -1
        scale = 1 - i / len(pts) * 0.5
        out += round_leaf(x, y, r * scale * rng.uniform(0.85, 1.1), math.degrees(a) + side * rng.uniform(55, 85), "l", op)
    return out


def corner_eucalyptus():
    rng = random.Random(11)
    body = []
    for ang, ln, bend, r, op in [(8, 330, 18, 15, 0.75), (80, 320, -16, 15, 0.75), (40, 360, 10, 18, 1), (22, 250, -12, 13, 0.9), (60, 260, 14, 13, 0.9)]:
        body += eucalyptus_branch(curve(-10, -10, ang, ln, bend), rng, r, op)
    for x, y in [(150, 120), (110, 200)]:
        body += berries(x, y, 4.5, 7, 14, rng)
    return body


def corner_roses():
    rng = random.Random(5)
    body = []
    for ang, ln, bend in [(4, 340, 20), (86, 330, -20), (30, 300, -14), (58, 300, 16)]:
        pts = curve(-10, -10, ang, ln, bend)
        body.append(branch(pts, 2.2, "s", 0.8))
        body += leafy_branch(pts, rng, 38, 3, "l", 0.36, 52)
    body += baby_breath(160, 70, 10, 70, rng) + baby_breath(70, 165, 80, 70, rng)
    body += rose(118, 118, 46, 20) + rose(205, 52, 30, 140) + rose(52, 205, 30, 260)
    body += peony(225, 150, 26) + blossom(150, 215, 15, "t")
    return body


def corner_olive():
    rng = random.Random(3)
    body = []
    for ang, ln, bend in [(10, 360, 16), (78, 360, -16), (44, 330, 4)]:
        pts = curve(-10, -10, ang, ln, bend, 30)
        body.append(branch(pts, 2.2, "s", 0.85))
        body += leafy_branch(pts, rng, 46, 2, "l", 0.18, 34, curl=0.06)
        for i in (9, 17, 24):
            x, y, a = pts[i]
            ox, oy = x + math.cos(a + 1.2) * 12, y + math.sin(a + 1.2) * 12
            body.append(f'<ellipse class="d" cx="{f(ox)}" cy="{f(oy)}" rx="7" ry="9.5" transform="rotate({f(math.degrees(a))} {f(ox)} {f(oy)})" opacity="0.9"/>')
            body.append(f'<ellipse class="t" cx="{f(ox - 2)}" cy="{f(oy - 3)}" rx="2" ry="3" opacity="0.6"/>')
    return body


def corner_wildflowers():
    rng = random.Random(9)
    body = []
    # a few soft grasses behind
    for ang, ln in [(6, 330), (30, 300), (56, 320), (84, 330), (44, 360)]:
        pts = curve(-5, -5, ang, ln, rng.uniform(-14, 14))
        body.append(branch(pts, 1.2, "s", 0.5))
        for j in range(4):  # oat-like seed head
            px, py, pa = pts[-1 - j * 2]
            body += leaf(px, py, 13, math.degrees(pa) + (30 if j % 2 else -30), 0.4, "l", 0, 0.75)
    # leafy stems
    for ang, ln, bend in [(16, 260, 12), (70, 260, -12)]:
        pts = curve(-5, -5, ang, ln, bend)
        body.append(branch(pts, 1.6, "s", 0.8))
        body += leafy_branch(pts, rng, 30, 3, "l", 0.3, 48)
    # flowers on stems, big ones near the corner, small ones further out
    for ang, ln, kind, r in [(22, 250, "daisy", 26), (48, 290, "bloom", 18), (68, 230, "daisy", 22), (36, 175, "bloom", 22),
                             (58, 170, "daisy", 18), (10, 175, "bloom", 15), (80, 180, "bloom", 14)]:
        pts = curve(-5, -5, ang, ln, rng.uniform(-12, 12))
        body.append(branch(pts, 1.6, "s", 0.8))
        body += leaf(*pts[10][:2], 26, math.degrees(pts[10][2]) - 38, 0.3, "l")
        x, y, _ = pts[-1]
        body += daisy(x, y, r) if kind == "daisy" else blossom(x, y, r, "d", 0.9, rng.uniform(0, 72))
    body += baby_breath(140, 120, 45, 60, rng, 10)
    return body


def corner_citrus():
    rng = random.Random(4)
    body = []
    for ang, ln, bend in [(12, 330, 14), (76, 330, -14), (44, 280, 0)]:
        pts = curve(-10, -10, ang, ln, bend)
        body.append(branch(pts, 2.6, "s", 0.85))
        body += leafy_branch(pts, rng, 54, 3, "l", 0.34, 46, curl=0.05)
    for x, y, r, a in [(150, 92, 30, 25), (92, 160, 26, 70), (215, 175, 22, 40)]:
        body.append(f'<ellipse class="d" cx="{f(x)}" cy="{f(y)}" rx="{f(r)}" ry="{f(r * 0.8)}" transform="rotate({a} {f(x)} {f(y)})"/>')
        tx, ty = rot(r * 1.05, 0, math.radians(a))
        body.append(f'<circle class="d" cx="{f(x + tx)}" cy="{f(y + ty)}" r="{f(r * 0.16)}"/>')
        body.append(f'<ellipse class="t" cx="{f(x - r * 0.3)}" cy="{f(y - r * 0.3)}" rx="{f(r * 0.28)}" ry="{f(r * 0.14)}" transform="rotate({a} {f(x)} {f(y)})" opacity="0.65"/>')
    for x, y in [(240, 70), (70, 240), (190, 230)]:
        body += blossom(x, y, 13, "t", 1, rng.uniform(0, 72))
    return body


def corner_tropical():
    rng = random.Random(8)
    body = []
    for ang, ln, bend, cls, op in [(10, 380, 18, "l", 0.8), (80, 380, -18, "l", 0.8), (28, 330, 8, "d", 0.85), (62, 330, -8, "d", 0.85), (45, 300, 4, "l", 1.0)]:
        pts = curve(-20, -20, ang, ln, bend, 34)
        body.append(branch(pts, 2.4, "s" if cls == "l" else "ds", op))
        for i in range(3, len(pts)):
            x, y, a = pts[i]
            ln_ = 74 * math.sin(math.pi * (i / len(pts))) + 12
            for side in (-1, 1):
                body += leaf(x, y, ln_, math.degrees(a) + side * 58, 0.13, cls, side * 0.08, op)
    for x, y in [(120, 120), (175, 70), (70, 175)]:
        body += blossom(x, y, 16, "t", 1, rng.uniform(0, 72))
    return body


def corner_pampas():
    rng = random.Random(12)
    body = []
    for ang, ln in [(84, 300), (6, 300)]:  # long grass blades
        pts = curve(-5, -5, ang, ln, rng.uniform(-8, 8))
        body += leaf(*pts[0][:2], ln, math.degrees(pts[0][2]), 0.05, "l", 0.03, 0.8)
    for ang, ln in [(18, 360), (40, 380), (62, 360), (78, 290), (30, 260), (52, 280)]:
        pts = curve(-5, -5, ang, ln, rng.uniform(-10, 10), 30)
        body.append(branch(pts, 1.4, "ds", 0.6))
        for i in range(11, len(pts)):  # the plume: dense soft fronds in the light and leaf tones
            x, y, a = pts[i]
            for _ in range(4):
                da = rng.uniform(-0.8, 0.8)
                l = rng.uniform(14, 30) * math.sin(math.pi * (i - 11) / (len(pts) - 10) + 0.25)
                ex, ey = x + math.cos(a + da) * l, y + math.sin(a + da) * l
                tone = "ts" if rng.random() < 0.6 else "s"
                body.append(f'<path class="{tone}" d="M{f(x)} {f(y)} Q{f((x + ex) / 2 + rng.uniform(-4, 4))} {f((y + ey) / 2 + rng.uniform(-4, 4))} {f(ex)} {f(ey)}" fill="none" stroke-width="{f(rng.uniform(1.8, 3.2))}" stroke-linecap="round" opacity="{rng.uniform(0.4, 0.85):.2f}"/>')
    return body


def corner_celestial():
    rng = random.Random(21)
    body = []
    for r, op in [(150, 0.5), (230, 0.35), (310, 0.25)]:
        body.append(f'<path class="ts" d="M{r} -2 A{r} {r} 0 0 1 -2 {r}" fill="none" stroke-width="1.2" stroke-dasharray="2 7" stroke-linecap="round" opacity="{op}"/>')
    body.append('<path class="d" d="M120 46 A62 62 0 1 0 170 150 A50 50 0 1 1 120 46Z"/>')
    body.append(sparkle(200, 92, 22, "d"))
    body.append(sparkle(68, 210, 15, "d", 0.9))
    for _ in range(40):
        x, y = rng.uniform(0, 340), rng.uniform(0, 340)
        if x + y > 380:
            continue
        if rng.random() < 0.25:
            body.append(sparkle(x, y, rng.uniform(4, 8), "l", rng.uniform(0.6, 1)))
        else:
            body.append(f'<circle class="l" cx="{f(x)}" cy="{f(y)}" r="{f(rng.uniform(1, 2.4))}" opacity="{rng.uniform(0.4, 1):.2f}"/>')
    return body


def corner_laurel():
    rng = random.Random(2)
    body = []
    for ang, ln, bend, op in [(8, 360, 18, 1), (82, 360, -18, 1), (45, 280, 2, 0.75)]:
        pts = curve(-10, -10, ang, ln, bend, 34)
        body.append(branch(pts, 2.2, "s", 0.85 * op))
        for i in range(2, len(pts)):
            x, y, a = pts[i]
            side = 1 if i % 2 else -1
            body += leaf(x, y, 40 * (1 - i / len(pts) * 0.45), math.degrees(a) + side * 38, 0.34, "l" if i % 3 else "d", side * 0.1, op)
        for i in (10, 20, 28):
            body += berries(*pts[i][:2], 4.5, 3, 7, rng)
    return body


def corner_sun():
    """A quarter sun rising from the corner, with long and short rays."""
    body = ['<path class="t" d="M0 0 H150 A150 150 0 0 1 0 150Z" opacity="0.55"/>', '<path class="l" d="M0 0 H96 A96 96 0 0 1 0 96Z"/>']
    body.append('<path class="ds" d="M0 120 A120 120 0 0 0 120 0" fill="none" stroke-width="2"/>')
    for k in range(13):
        a = math.radians(3 + k * 84 / 12)
        r0, r1 = (172, 330) if k % 2 == 0 else (172, 250)
        body.append(f'<path class="{"ds" if k % 2 == 0 else "ls"}" d="M{f(math.cos(a) * r0)} {f(math.sin(a) * r0)} L{f(math.cos(a) * r1)} {f(math.sin(a) * r1)}" stroke-width="{2.2 if k % 2 == 0 else 1.4}" stroke-linecap="round"/>')
    return body


def corner_deco():
    body = []
    for i, op in enumerate([1, 0.7, 0.45]):
        o = 26 + i * 16
        body.append(f'<path class="ds" d="M{o} 400 V{o + 40} L{o + 40} {o} H400" fill="none" stroke-width="{2 if i == 0 else 1.2}" opacity="{op}"/>')
    for k in range(9):  # fan in the corner
        a = math.radians(k * 90 / 8)
        body.append(f'<path class="ls" d="M0 0 L{f(math.cos(a) * 120)} {f(math.sin(a) * 120)}" stroke-width="1.4" opacity="0.8"/>')
    body.append('<path class="ds" d="M120 0 A120 120 0 0 1 0 120" fill="none" stroke-width="2"/>')
    body.append('<path class="l" d="M0 0 H70 A70 70 0 0 1 0 70Z" opacity="0.5"/>')
    body.append('<path class="d" d="M152 68 l8 -8 l8 8 l-8 8z M68 152 l8 -8 l8 8 l-8 8z"/>')
    return body


# ---------- Ornaments (center pieces, 300 x 100) ----------

def mirrored(build):
    """Build one half of an ornament from the center to the right, then mirror it to the left."""
    half = build()
    return [f'<g transform="translate(300 0) scale(-1 1)">{"".join(half)}</g>', *half]


def ornament_for(kind):
    rng = random.Random(1)
    if kind == "eucalyptus":
        def half():
            return eucalyptus_branch(curve(150, 58, -8, 130, 14), rng, 9)
        return mirrored(half) + berries(150, 54, 3.5, 5, 7, rng)
    if kind == "roses":
        def half():
            pts = curve(150, 56, -6, 120, 10)
            return [branch(pts, 1.6, "s", 0.8)] + leafy_branch(pts, rng, 24, 3, "l", 0.36, 50) + baby_breath(196, 50, -20, 34, rng, 6)
        return mirrored(half) + rose(150, 52, 22, 15)
    if kind == "olive":
        def half():
            pts = curve(150, 58, -6, 135, 10, 22)
            out = [branch(pts, 1.6, "s", 0.85)] + leafy_branch(pts, rng, 30, 2, "l", 0.18, 32, curl=0.05)
            x, y, _ = pts[10]
            return out + [f'<ellipse class="d" cx="{f(x)}" cy="{f(y + 9)}" rx="5" ry="6.5"/>']
        return mirrored(half)
    if kind == "wildflowers":
        body = []
        for ang, ln, k in [(-90, 70, "d"), (-120, 60, "c"), (-60, 62, "c"), (-145, 48, "d"), (-35, 50, "d")]:
            pts = curve(150, 96, ang, ln, rng.uniform(-10, 10))
            body.append(branch(pts, 1.4, "s", 0.8))
            body += leaf(*pts[10][:2], 18, math.degrees(pts[10][2]) + 40, 0.25, "l")
            x, y, _ = pts[-1]
            body += daisy(x, y, 15) if k == "d" else blossom(x, y, 11, "d", 0.85)
        return body
    if kind == "citrus":
        def half():
            pts = curve(150, 60, -4, 120, 8)
            return [branch(pts, 1.8, "s", 0.8)] + leafy_branch(pts, rng, 30, 3, "l", 0.34, 44) + blossom(230, 44, 9, "t")
        return mirrored(half) + [f'<ellipse class="d" cx="150" cy="56" rx="19" ry="15"/>', '<ellipse class="t" cx="144" cy="50" rx="5" ry="2.6" opacity="0.65"/>']
    if kind == "tropical":
        def half():
            pts = curve(150, 70, -20, 130, 12, 24)
            out = [branch(pts, 1.6, "s")]
            for i in range(3, len(pts)):
                x, y, a = pts[i]
                for side in (-1, 1):
                    out += leaf(x, y, 30 * math.sin(math.pi * i / len(pts)) + 6, math.degrees(a) + side * 55, 0.12, "l")
            return out
        return mirrored(half)
    if kind == "pampas":
        body = []
        for ang in (-130, -110, -90, -70, -50):
            pts = curve(150, 98, ang, 80, rng.uniform(-8, 8), 20)
            body.append(branch(pts, 1, "s", 0.7))
            for i in range(8, len(pts)):
                x, y, a = pts[i]
                for _ in range(3):
                    da, l = rng.uniform(-0.9, 0.9), rng.uniform(6, 14)
                    body.append(f'<path class="ts" d="M{f(x)} {f(y)} L{f(x + math.cos(a + da) * l)} {f(y + math.sin(a + da) * l)}" stroke-width="1.3" stroke-linecap="round" opacity="0.75"/>')
        return body
    if kind == "celestial":
        body = ['<path class="ts" d="M40 52 H112 M188 52 H260" stroke-width="1.2" stroke-dasharray="2 6" stroke-linecap="round"/>']
        body.append('<path class="d" d="M146 22 A30 30 0 1 0 172 70 A24 24 0 1 1 146 22Z"/>')
        body += [sparkle(186, 30, 9, "d"), sparkle(118, 72, 7, "l"), sparkle(100, 30, 5, "l"), sparkle(205, 72, 5, "l")]
        return body
    if kind == "laurel":
        def half():
            pts = curve(156, 70, -18, 120, 30, 20)
            out = [branch(pts, 1.6, "s", 0.85)]
            for i in range(2, len(pts), 2):
                x, y, a = pts[i]
                for side in (-1, 1):
                    out += leaf(x, y, 18, math.degrees(a) + side * 40, 0.32, "l", side * 0.1)
            return out
        return mirrored(half)
    if kind == "sun":
        body = ['<path class="ds" d="M30 84 H270" stroke-width="1.6" stroke-linecap="round"/>', '<path class="l" d="M114 84 A36 36 0 0 1 186 84Z"/>']
        for k in range(11):
            a = math.radians(180 + 9 + k * 162 / 10)
            r1 = 76 if k % 2 == 0 else 62
            body.append(f'<path class="{"ds" if k % 2 == 0 else "ls"}" d="M{f(150 + math.cos(a) * 46)} {f(84 + math.sin(a) * 46)} L{f(150 + math.cos(a) * r1)} {f(84 + math.sin(a) * r1)}" stroke-width="{2.4 if k % 2 == 0 else 1.6}" stroke-linecap="round"/>')
        return body
    if kind == "deco":
        body = ['<path class="ds" d="M20 50 H110 M190 50 H280" stroke-width="1.4"/>', '<path class="ls" d="M40 58 H118 M182 58 H260" stroke-width="1"/>']
        for k in range(7):
            a = math.radians(200 + k * 140 / 6)
            body.append(f'<path class="ls" d="M150 66 L{f(150 + math.cos(a) * 34)} {f(66 + math.sin(a) * 34)}" stroke-width="1.3"/>')
        body.append('<path class="d" d="M150 30 l8 8 l-8 8 l-8 -8z"/>')
        return body
    raise ValueError(kind)


CORNERS = {
    "eucalyptus": corner_eucalyptus, "roses": corner_roses, "olive": corner_olive, "wildflowers": corner_wildflowers,
    "citrus": corner_citrus, "tropical": corner_tropical, "pampas": corner_pampas, "celestial": corner_celestial,
    "laurel": corner_laurel, "sun": corner_sun, "deco": corner_deco,
}

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name, build in CORNERS.items():
        (OUT / f"{name}-corner.svg").write_text(svg("0 0 400 400", build()))
        (OUT / f"{name}.svg").write_text(svg("0 0 300 100", ornament_for(name)))
    print("wrote", len(CORNERS) * 2, "files to", OUT)
