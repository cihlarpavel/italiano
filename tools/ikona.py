# Generuje ikonu aplikace: bílá bublina s velkým „P“ a malým „italiano“ na pozadí italské vlajky.
# python3 tools/ikona.py <výstup.png>; pak zmenšit do icons/ (180, 192, 512).
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import sys

S = 1024
GREEN, WHITE, RED = (0, 146, 70), (255, 255, 255), (206, 43, 55)
out = sys.argv[1]

img = Image.new('RGB', (S, S), WHITE)
d = ImageDraw.Draw(img)
for i, col in enumerate([GREEN, (246, 246, 242), RED]):
    d.rectangle([i * S / 3, 0, (i + 1) * S / 3, S], fill=col)

# stín bubliny
bx0, by0, bx1, by1 = 202, 176, 822, 736
tail = [(290, by1 - 60), (262, 866), (430, by1 - 10)]
sh = Image.new('L', (S, S), 0)
sd = ImageDraw.Draw(sh)
sd.rounded_rectangle([bx0, by0 + 22, bx1, by1 + 22], radius=170, fill=110)
sd.polygon([(x, y + 22) for x, y in tail], fill=110)
sh = sh.filter(ImageFilter.GaussianBlur(26))
img = Image.composite(Image.new('RGB', (S, S), (40, 30, 30)), img, sh)

# bublina
d = ImageDraw.Draw(img)
d.rounded_rectangle([bx0, by0, bx1, by1], radius=170, fill=WHITE)
d.polygon(tail, fill=WHITE)

# P a pod ním malé italiano
big = ImageFont.truetype('/System/Library/Fonts/Supplemental/Futura.ttc', 340, index=2)
d.text((S / 2 + 4, 400), 'P', font=big, fill=RED, anchor='mm')
small = ImageFont.truetype('/System/Library/Fonts/Supplemental/Futura.ttc', 72, index=0)
d.text((S / 2, 672), 'italiano', font=small, fill=GREEN, anchor='ms')
img.save(out)
