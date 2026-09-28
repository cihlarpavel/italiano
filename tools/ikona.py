# Generuje ikonu „Parlo → Paolo italiano“ (ručně připsané o nad přeškrtnutým r) v barvách vlajky.
# python3 tools/ikona.py <výstup.png> [a|b]; pak zmenšit do icons/ (180, 192, 512).
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import sys, math

S = 1024
GREEN, WHITE, RED, INK = (0, 146, 70), (255, 255, 255), (206, 43, 55), (28, 28, 34)
out = sys.argv[1]
varianta = sys.argv[2] if len(sys.argv) > 2 else 'a'

img = Image.new('RGB', (S, S), WHITE)
d = ImageDraw.Draw(img)
if varianta == 'a':
    # vlajka přes celou plochu, uprostřed bílá karta s nápisem
    for i, col in enumerate([GREEN, WHITE, RED]):
        d.rectangle([i * S / 3, 0, (i + 1) * S / 3, S], fill=col)
    sh = Image.new('L', (S, S), 0)
    ImageDraw.Draw(sh).rounded_rectangle([96, 250, S - 96, 826], radius=90, fill=120)
    sh = sh.filter(ImageFilter.GaussianBlur(30))
    img = Image.composite(Image.new('RGB', (S, S), (60, 40, 40)), img, sh)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([96, 230, S - 96, 806], radius=90, fill=WHITE)
    base, velikost = 590, 250
else:
    # bílé pozadí, široké pruhy trikolóry nahoře a dole
    for i, col in enumerate([GREEN, (236, 236, 232), RED]):
        d.rectangle([i * S / 3, 0, (i + 1) * S / 3, 120], fill=col)
        d.rectangle([i * S / 3, S - 120, (i + 1) * S / 3, S], fill=col)
    base, velikost = 610, 300

bold = ImageFont.truetype('/System/Library/Fonts/Supplemental/Futura.ttc', velikost, index=2)
parts = ['Pa', 'r', 'lo']
widths = [d.textlength(p, font=bold) for p in parts]
x = (S - sum(widths)) / 2
pos = []
for p, w in zip(parts, widths):
    d.text((x, base), p, font=bold, fill=INK, anchor='ls')
    pos.append((x, w)); x += w
rx, rw = pos[1]
cx = rx + rw / 2
k = velikost / 330
# červený škrt přes r
L = 150 * k
ang = math.radians(-58)
x1, y1 = cx - L / 2 * math.cos(ang), base - 115 * k - L / 2 * math.sin(ang)
x2, y2 = cx + L / 2 * math.cos(ang), base - 115 * k + L / 2 * math.sin(ang)
wline = int(30 * k)
d.line([(x1, y1), (x2, y2)], fill=RED, width=wline)
for px, py in [(x1, y1), (x2, y2)]:
    d.ellipse([px - wline / 2, py - wline / 2, px + wline / 2, py + wline / 2], fill=RED)
# zelené ručně psané o nad r
lay = Image.new('RGBA', (400, 400), (0, 0, 0, 0))
ld = ImageDraw.Draw(lay)
ld.ellipse([110, 100, 290, 300], outline=GREEN + (255,), width=30)
ld.arc([100, 92, 300, 300], start=250, end=330, fill=GREEN + (255,), width=30)
lay = lay.rotate(-14, resample=Image.BICUBIC)
sz = int(400 * k)
lay = lay.resize((sz, sz), Image.LANCZOS)
img.paste(lay, (int(cx - sz / 2), int(base - 330 * k - sz / 2 + 30 * k)), lay)
d = ImageDraw.Draw(img)
small = ImageFont.truetype('/System/Library/Fonts/Supplemental/Futura.ttc', int(velikost * 0.42), index=0)
d.text((S / 2, base + velikost * 0.56), 'italiano', font=small, fill=RED if varianta == 'b' else GREEN, anchor='ms')
img.save(out)
