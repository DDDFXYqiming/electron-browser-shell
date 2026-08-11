# -*- coding: utf-8 -*-
"""生成 Luma Browser 应用图标（玻璃风格，原创中性设计）。
输出: icon.png (1024), icon-256.png, icon.ico (多尺寸)
运行: python packages/shell/build/generate-icon.py
"""

import os
from PIL import Image, ImageDraw, ImageFilter

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
SIZE = 1024
SS = 4  # 超采样倍数
CANVAS = SIZE * SS
RADIUS = int(220 * SS)

TOP = (79, 70, 229)     # #4F46E5
BOTTOM = (124, 58, 237)  # #7C3AED
WHITE = (255, 255, 255)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def vertical_gradient(size, top, bottom):
    img = Image.new('RGB', (size, size))
    px = img.load()
    for y in range(size):
        color = lerp(top, bottom, y / size)
        for x in range(size):
            px[x, y] = color
    return img


def rounded_mask(size, radius):
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    return mask


def build():
    n = CANVAS
    icon = Image.new('RGBA', (n, n), (0, 0, 0, 0))

    # 背景渐变 + 圆角
    gradient = vertical_gradient(n, TOP, BOTTOM)
    icon.paste(gradient, (0, 0), rounded_mask(n, RADIUS))

    draw = ImageDraw.Draw(icon, 'RGBA')

    # 顶部玻璃高光（柔和椭圆）
    highlight = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    hd = ImageDraw.Draw(highlight)
    hw, hh = int(0.88 * n), int(0.30 * n)
    hx0, hy0 = (n - hw) // 2, int(n * 0.04)
    for i in range(60):
        alpha = int(38 * (1 - i / 60))
        inset = i * 3
        hd.ellipse(
            (hx0 + inset, hy0 + inset, hx0 + hw - inset, hy0 + hh - inset),
            fill=(255, 255, 255, alpha),
        )
    icon = Image.alpha_composite(icon, highlight)
    draw = ImageDraw.Draw(icon, 'RGBA')

    # 底部内侧反射（玻璃厚度感）
    reflection = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    rd = ImageDraw.Draw(reflection)
    for i in range(80):
        alpha = int(14 * (1 - i / 80))
        inset = int(RADIUS * 0.16)
        rd.rounded_rectangle(
            (inset + i * 2, int(n * 0.72) + i * 2, n - inset - i * 2, n - inset - i * 2),
            radius=RADIUS - i * 2,
            fill=(255, 255, 255, alpha),
        )
    icon = Image.alpha_composite(icon, reflection)
    draw = ImageDraw.Draw(icon, 'RGBA')

    # 中心窗口符号 —— 与浏览器内 nt-logo 统一：
    # 圆角窗口外框 + 顶部地址栏横线 + 中心圆点
    cx, cy = n // 2, int(n * 0.52)
    win_w, win_h = int(0.54 * n), int(0.42 * n)
    win_radius = int(0.105 * n)
    win_lw = int(0.05 * n)
    win_box = (cx - win_w // 2, cy - win_h // 2, cx + win_w // 2, cy + win_h // 2)
    draw.rounded_rectangle(
        win_box,
        radius=win_radius,
        outline=(255, 255, 255, 242),
        width=win_lw,
    )

    # 窗口顶部地址栏横线
    bar_w = int(0.40 * n)
    bar_y = cy - win_h // 2 + int(0.085 * n)
    draw.line(
        (cx - bar_w // 2, bar_y, cx + bar_w // 2, bar_y),
        fill=(255, 255, 255, 210),
        width=int(0.034 * n),
    )

    # 中心圆点（略偏下，呼应页面 logo）
    dot_r = int(0.064 * n)
    dot_cx, dot_cy = cx, cy + int(0.09 * n)
    draw.ellipse(
        (dot_cx - dot_r, dot_cy - dot_r, dot_cx + dot_r, dot_cy + dot_r),
        fill=(255, 255, 255, 252),
    )
    # 圆点高光（左上小光斑）
    hl_r = int(0.025 * n)
    draw.ellipse(
        (
            dot_cx - hl_r,
            dot_cy - int(dot_r * 0.45),
            dot_cx + hl_r,
            dot_cy - int(dot_r * 0.45) + hl_r * 2,
        ),
        fill=(255, 255, 255, 235),
    )

    # 外边缘描边（界定图标）
    draw.rounded_rectangle(
        (2, 2, n - 3, n - 3),
        radius=RADIUS - 2,
        outline=(255, 255, 255, 46),
        width=4,
    )
    draw.rounded_rectangle(
        (1, 1, n - 2, n - 2),
        radius=RADIUS - 1,
        outline=(20, 10, 60, 70),
        width=2,
    )

    # 轻微模糊柔和整体（超采样下保持锐利，只做极小模糊）
    icon = icon.filter(ImageFilter.GaussianBlur(2))

    # 缩放到目标尺寸
    base = icon.resize((SIZE, SIZE), Image.LANCZOS)
    base.save(os.path.join(OUT_DIR, 'icon.png'))
    base.resize((256, 256), Image.LANCZOS).save(os.path.join(OUT_DIR, 'icon-256.png'))

    # 多尺寸 ICO
    sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    ico_path = os.path.join(OUT_DIR, 'icon.ico')
    base.save(ico_path, format='ICO', sizes=sizes)

    # 验证 ICO 内包含的尺寸
    with Image.open(ico_path) as check:
        embedded = check.info.get('sizes', [])
        print(f'ICO sizes: {sorted(embedded)}')

    print(f'OK: icon.png / icon-256.png / icon.ico -> {OUT_DIR}')


if __name__ == '__main__':
    build()
