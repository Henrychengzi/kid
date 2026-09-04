#!/usr/bin/env python3
"""
生成 PWA 图标（纯标准库，不依赖 Pillow）

图标设计：橙色圆角底板 + 白色打开的书本 + 书页文字行 + 右上角黄色点缀。
采用 2x 超采样后降采样，边缘平滑无锯齿。

用法： python scripts/generate-icons.py
输出： public/icons/icon-192.png、icon-512.png、apple-touch-icon.png
"""
import os
import struct
import zlib

# ── 配色（与 src/styles/global.css 保持一致）──
BG = (255, 138, 61)      # --c-orange
BOOK = (255, 255, 255)
SPINE = (255, 138, 61)
LINE = (255, 190, 150)
DOT = (255, 212, 59)     # --c-yellow


def write_png(path, size, pixels):
    """pixels: bytearray，长度 size*size*4，RGBA 顺序"""
    raw = bytearray()
    stride = size * 4
    for y in range(size):
        raw.append(0)  # filter type 0
        raw.extend(pixels[y * stride:(y + 1) * stride])

    def chunk(tag, data):
        return (struct.pack('>I', len(data)) + tag + data
                + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF))

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(bytes(raw), 9))
    png += chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)


def in_rounded_rect(px, py, x0, y0, x1, y1, r):
    """点是否落在圆角矩形内"""
    if px < x0 or px > x1 or py < y0 or py > y1:
        return False
    cx = min(max(px, x0 + r), x1 - r)
    cy = min(max(py, y0 + r), y1 - r)
    return (px - cx) ** 2 + (py - cy) ** 2 <= r * r


def in_rect(px, py, x0, y0, x1, y1):
    return x0 <= px <= x1 and y0 <= py <= y1


def sample(px, py, S):
    """在 S×S 坐标系下采样一个点，返回 RGBA 元组"""
    u = S / 512.0  # 统一按 512 设计，等比缩放

    def s(v):
        return v * u

    # 背景圆角底板
    if not in_rounded_rect(px, py, 0, 0, S, S, s(112)):
        return (0, 0, 0, 0)

    color = BG

    # 书本（白色圆角）
    bx0, by0, bx1, by1 = s(106), s(150), s(406), s(370)
    br = s(16)
    if in_rounded_rect(px, py, bx0, by0, bx1, by1, br):
        color = BOOK
        # 书脊
        if in_rect(px, py, s(248), by0, s(264), by1):
            color = SPINE
        else:
            # 书页文字行：左右各 3 条
            for i in range(3):
                ly0 = s(196 + i * 46)
                ly1 = ly0 + s(15)
                if in_rect(px, py, s(132), ly0, s(232), ly1) or \
                   in_rect(px, py, s(280), ly0, s(380), ly1):
                    color = LINE
                    break

    # 右上角黄色点缀
    dcx, dcy, dr = s(415), s(104), s(34)
    if (px - dcx) ** 2 + (py - dcy) ** 2 <= dr * dr:
        color = DOT

    return (*color, 255)


def render(size, ss=2):
    """渲染 size×size 图标，ss 为超采样倍数"""
    high = size * ss
    acc = [[0, 0, 0, 0] for _ in range(size * size)]
    total = ss * ss

    for y in range(high):
        for x in range(high):
            # 超采样点取子像素中心
            px = (x + 0.5) / ss
            py = (y + 0.5) / ss
            r, g, b, a = sample(px, py, size)
            idx = (int(py) * size) + int(px)
            cell = acc[idx]
            cell[0] += r * a
            cell[1] += g * a
            cell[2] += b * a
            cell[3] += a

    out = bytearray(size * size * 4)
    for i, (r, g, b, a) in enumerate(acc):
        if a == 0:
            out[i * 4:i * 4 + 4] = b'\x00\x00\x00\x00'
        else:
            # 预乘还原
            out[i * 4 + 0] = min(255, int(round(r / a)))
            out[i * 4 + 1] = min(255, int(round(g / a)))
            out[i * 4 + 2] = min(255, int(round(b / a)))
            out[i * 4 + 3] = int(round(a / total))
    return out


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    out_dir = os.path.join(here, '..', 'public', 'icons')
    os.makedirs(out_dir, exist_ok=True)

    for size, name in ((192, 'icon-192.png'), (512, 'icon-512.png'), (180, 'apple-touch-icon.png')):
        pixels = render(size)
        path = os.path.normpath(os.path.join(out_dir, name))
        write_png(path, size, pixels)
        print(f'✅ {name}  {size}x{size}  {os.path.getsize(path) / 1024:.1f} KB')

    print('\n图标已生成到 public/icons/')


if __name__ == '__main__':
    main()
