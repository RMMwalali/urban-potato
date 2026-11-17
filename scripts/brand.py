"""Builds the LAAZIZI logo set from the Geist font: the one-line wordmark exactly as in the site header
(Geist SemiBold, capitals, -0.02em tracking, LA blue / AZIZI pink), as vector outlines.

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
NAME, SPLIT = "LAAZIZI", 2
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
b = hb.Buffer(); b.add_str(NAME); b.guess_segment_properties()
hb.shape(hfont, b, {"kern": True, "liga": False})
track = -0.02 * upm
x = 0.0
paths = []
for i, (info, pos) in enumerate(zip(b.glyph_infos, b.glyph_positions)):
    gname = font.getGlyphName(info.codepoint)
    pen = SVGPathPen(glyphs)
    glyphs[gname].draw(TransformPen(pen, (1, 0, 0, -1, x + pos.x_offset, 0)))  # flip y for SVG
    bp = BoundsPen(glyphs); glyphs[gname].draw(TransformPen(bp, (1, 0, 0, -1, x + pos.x_offset, 0)))
    paths.append((i, pen.getCommands(), bp.bounds))
    x += pos.x_advance + (track if i < len(NAME) - 1 else 0)

xs = [p[2][0] for p in paths if p[2]] + [p[2][2] for p in paths if p[2]]
ys = [p[2][1] for p in paths if p[2]] + [p[2][3] for p in paths if p[2]]
minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
W, H = maxx - minx, maxy - miny

def group(c1, c2, dx=0.0, dy=0.0, scale=1.0):
    a = "".join(d for i, d, _ in paths if i < SPLIT); z = "".join(d for i, d, _ in paths if i >= SPLIT)
    t = f'transform="translate({dx:.2f} {dy:.2f}) scale({scale:.5f}) translate({-minx:.2f} {-miny:.2f})"'
    return f'<g {t}><path fill="{c1}" d="{a}"/><path fill="{c2}" d="{z}"/></g>'

def svg(w, h, body, bg=None, rx=0):
    rect = f'<rect width="{w}" height="{h}" rx="{rx}" fill="{bg}"/>' if bg else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" width="{w:.0f}" height="{h:.0f}" role="img" aria-label="LAAZIZI">{rect}{body}</svg>'

def write(name, content):
    with open(os.path.join(OUT, name), "w") as f: f.write(content)

os.makedirs(OUT, exist_ok=True)
pad = H * 0.25
ww, wh = W + 2 * pad, H + 2 * pad
# 1. wordmarks (transparent): colour, for dark backgrounds, one-colour ink, one-colour white
write("laazizi-wordmark.svg", svg(ww, wh, group(BLUE, PINK, pad, pad)))
write("laazizi-wordmark-on-dark.svg", svg(ww, wh, group(BLUE_DARK, PINK_DARK, pad, pad)))
write("laazizi-wordmark-ink.svg", svg(ww, wh, group(INK, INK, pad, pad)))
write("laazizi-wordmark-white.svg", svg(ww, wh, group(WHITE, WHITE, pad, pad)))

def centred(size_w, size_h, width_frac, c1, c2, bg, rx=0):
    s = size_w * width_frac / W
    dx, dy = (size_w - W * s) / 2, (size_h - H * s) / 2
    return svg(size_w, size_h, group(c1, c2, dx, dy, s), bg, rx)

# 2. square marks: app icon (paper), dark variant, maskable (inside the 80% safe circle)
write("laazizi-icon.svg", centred(1024, 1024, 0.80, BLUE, PINK, PAPER))
write("laazizi-icon-dark.svg", centred(1024, 1024, 0.80, BLUE_DARK, PINK_DARK, INK))
write("laazizi-icon-maskable.svg", centred(1024, 1024, 0.62, BLUE, PINK, PAPER))
# 3. favicon: the text logo in blue and pink, as big as a tab icon allows, on a soft paper tile
write("laazizi-favicon.svg", centred(64, 64, 0.94, BLUE, PINK, PAPER, rx=12))
# 4. social: share card and profile picture, email header
write("laazizi-social-1200x630.svg", centred(1200, 630, 0.62, BLUE, PINK, PAPER))
write("laazizi-profile-1080.svg", centred(1080, 1080, 0.78, BLUE, PINK, PAPER))
write("laazizi-email-header-1200x240.svg", centred(1200, 240, 0.36, BLUE, PINK, WHITE))
print("wordmark", round(W), "x", round(H), "units; files in public/brand")
