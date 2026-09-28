from PIL import Image, ImageDraw, ImageFont
# Generuje ikonu „Parlo → Paolo italiano“: python3 tools/ikona.py ikona-1024.png, pak zmenšit do icons/.
import sys, math
S = 1024
out = sys.argv[1]
img = Image.new('RGB', (S, S))
d = ImageDraw.Draw(img)
for y in range(S):
    t = y / S
    d.line([(0, y), (S, y)], fill=(int(255 - 5*t), int(251 - 13*t), int(245 - 20*t)))
h = 30
for i, col in enumerate([(0, 146, 70), (240, 240, 236), (206, 43, 55)]):
    d.rectangle([i*S/3, S-h, (i+1)*S/3, S], fill=col)

bold = ImageFont.truetype('/System/Library/Fonts/Supplemental/Futura.ttc', 330, index=2)
ink = (26, 26, 32)
parts = ['Pa', 'r', 'lo']
widths = [d.textlength(p, font=bold) for p in parts]
x = (S - sum(widths)) / 2
base = 640
pos = []
for p, w in zip(parts, widths):
    d.text((x, base), p, font=bold, fill=ink, anchor='ls')
    pos.append((x, w)); x += w
rx, rw = pos[1]
# červený škrt jen přes r
cx = rx + rw / 2
L = 150
ang = math.radians(-58)
x1, y1 = cx - L/2*math.cos(ang), base - 115 - L/2*math.sin(ang)
x2, y2 = cx + L/2*math.cos(ang), base - 115 + L/2*math.sin(ang)
d.line([(x1, y1), (x2, y2)], fill=(222, 45, 60), width=30)
for (px, py) in [(x1, y1), (x2, y2)]:
    d.ellipse([px-15, py-15, px+15, py+15], fill=(222, 45, 60))
# zelené ručně psané o nad r – mírně nakloněná elipsa s přesahem tahu
lay = Image.new('RGBA', (400, 400), (0, 0, 0, 0))
ld = ImageDraw.Draw(lay)
ld.ellipse([110, 100, 290, 300], outline=(0, 150, 75, 255), width=30)
ld.arc([100, 92, 300, 300], start=250, end=330, fill=(0, 150, 75, 255), width=30)
lay = lay.rotate(-14, resample=Image.BICUBIC)
img.paste(lay, (int(cx - 200), int(base - 330 - 200 + 30)), lay)
small = ImageFont.truetype('/System/Library/Fonts/Supplemental/Futura.ttc', 140, index=0)
d = ImageDraw.Draw(img)
d.text((S/2, base + 185), 'italiano', font=small, fill=(206, 43, 55), anchor='ms')
img.save(out)
