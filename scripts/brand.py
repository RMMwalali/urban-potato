"""Builds the DARLING HQ logo set from the Geist font: the one-line wordmark exactly as in the site header
(Geist SemiBold, capitals, -0.02em tracking, DAR blue / LING pink) with a small "HQ" at its top right,
as vector outlines. The favicon leaves the HQ out (it would be unreadable at tab size).

Run:  python3 scripts/brand.py      (needs: pip install fonttools brotli uharfbuzz)
Then: node scripts/brand-png.mjs    (renders the PNG sizes with the bundled Chromium)
"""
import io, os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen
import uharfbuzz as hb

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WOFF2 = os.path.join(ROOT, "node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2")
OUT = os.path.join(ROOT, "public/brand")
NAME, SPLIT = "DARLING", 3
BLUE, PINK = "#1f5277", "#d9468a"           # header colours (on light)
BLUE_DARK, PINK_DARK = "#4f9cf0", "#f06fae"  # same hues lifted for dark backgrounds
INK, PAPER, WHITE = "#1c1f24", "#ededed", "#ffffff"

font = TTFont(WOFF2)
font.flavor = None
font = instancer.instantiateVariableFont(font, {"wght": 600})
buf = io.BytesIO(); font.save(buf); data = buf.getvalue()
upm = font["head"].unitsPerEm
glyphs = font.getGlyphSet()

# shape with HarfBuzz so kerning matches the browser, then apply the header's letter-spacing
face = hb.Face(data); hfont = hb.Font(face)
track = -0.02 * upm

def outline(text, x0=0.0, y0=0.0, k=1.0):
    """Glyph outlines for `text`, scaled by k, baseline at y0 (SVG y down). Returns [(index, path, bounds)]."""
    b = hb.Buffer(); b.add_str(text); b.guess_segment_properties()
    hb.shape(hfont, b, {"kern": True, "liga": False})
    x, out = x0, []
    for i, (info, pos) in enumerate(zip(b.glyph_infos, b.glyph_positions)):
        gname = font.getGlyphName(info.codepoint)
        m = (k, 0, 0, -k, x + pos.x_offset * k, y0)  # flip y for SVG
        pen = SVGPathPen(glyphs); glyphs[gname].draw(TransformPen(pen, m))
        bp = BoundsPen(glyphs); glyphs[gname].draw(TransformPen(bp, m))
        out.append((i, pen.getCommands(), bp.bounds))
        x += (pos.x_advance + (track if i < len(text) - 1 else 0)) * k
    return out

def bounds(ps):
    bs = [p[2] for p in ps if p[2]]
    return min(b[0] for b in bs), min(b[1] for b in bs), max(b[2] for b in bs), max(b[3] for b in bs)

paths = outline(NAME)
wx0, wy0, wx1, wy1 = bounds(paths)  # the wordmark alone
CAP = wy1 - wy0
# "HQ" at about a third of the cap height, its top level with the top of the capitals, a small gap after the I
HQK = 0.34
hq_probe = outline("HQ", 0, 0, HQK)
_, hy0, _, _ = bounds(hq_probe)
hq = outline("HQ", wx1 + CAP * 0.07, wy0 - hy0, HQK)

def frame(with_hq):
    x0, y0, x1, y1 = bounds(paths + (hq if with_hq else []))
    return x0, y0, x1 - x0, y1 - y0

def group(c1, c2, dx=0.0, dy=0.0, scale=1.0, c3=None, with_hq=True):
    minx, miny, _, _ = frame(with_hq)
    a = "".join(d for i, d, _ in paths if i < SPLIT); z = "".join(d for i, d, _ in paths if i >= SPLIT)
    t = f'transform="translate({dx:.2f} {dy:.2f}) scale({scale:.5f}) translate({-minx:.2f} {-miny:.2f})"'
    q = f'<path fill="{c3 or c1}" d="{"".join(d for _, d, _ in hq)}"/>' if with_hq else ""
    return f'<g {t}><path fill="{c1}" d="{a}"/><path fill="{c2}" d="{z}"/>{q}</g>'

def svg(w, h, body, bg=None, rx=0):
    rect = f'<rect width="{w}" height="{h}" rx="{rx}" fill="{bg}"/>' if bg else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" width="{w:.0f}" height="{h:.0f}" role="img" aria-label="DARLING HQ">{rect}{body}</svg>'

def write(name, content):
    with open(os.path.join(OUT, name), "w") as f: f.write(content)

os.makedirs(OUT, exist_ok=True)
_, _, W, H = frame(True)
pad = CAP * 0.25
ww, wh = W + 2 * pad, H + 2 * pad
# 1. wordmarks (transparent): colour, for dark backgrounds, one-colour ink, one-colour white
write("darling-wordmark.svg", svg(ww, wh, group(BLUE, PINK, pad, pad, c3=INK)))
write("darling-wordmark-on-dark.svg", svg(ww, wh, group(BLUE_DARK, PINK_DARK, pad, pad, c3=PAPER)))
write("darling-wordmark-ink.svg", svg(ww, wh, group(INK, INK, pad, pad)))
write("darling-wordmark-white.svg", svg(ww, wh, group(WHITE, WHITE, pad, pad)))

def centred(size_w, size_h, width_frac, c1, c2, bg, rx=0, c3=INK, with_hq=True):
    _, _, w, h = frame(with_hq)
    s = size_w * width_frac / w
    dx, dy = (size_w - w * s) / 2, (size_h - h * s) / 2
    return svg(size_w, size_h, group(c1, c2, dx, dy, s, c3, with_hq), bg, rx)

# 2. square marks: app icon (paper), dark variant, maskable (inside the 80% safe circle)
write("darling-icon.svg", centred(1024, 1024, 0.80, BLUE, PINK, PAPER))
write("darling-icon-dark.svg", centred(1024, 1024, 0.80, BLUE_DARK, PINK_DARK, INK, c3=PAPER))
write("darling-icon-maskable.svg", centred(1024, 1024, 0.62, BLUE, PINK, PAPER))
# 3. favicon: the text logo in blue and pink, as big as a tab icon allows, on a soft paper tile
write("darling-favicon.svg", centred(64, 64, 0.94, BLUE, PINK, PAPER, rx=12, with_hq=False))
# 4. social: share card and profile picture, email header
write("darling-social-1200x630.svg", centred(1200, 630, 0.62, BLUE, PINK, PAPER))
write("darling-profile-1080.svg", centred(1080, 1080, 0.78, BLUE, PINK, PAPER))
write("darling-email-header-1200x240.svg", centred(1200, 240, 0.36, BLUE, PINK, WHITE))
print("wordmark", round(W), "x", round(H), "units; files in public/brand")
