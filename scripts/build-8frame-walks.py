#!/usr/bin/env python3
"""Align 8 walk key PNGs per sequence on a shared canvas; export 8 transparent WebP loop frames."""
from __future__ import annotations

import os
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
_keys_dir = os.environ.get("WALK_KEYS_DIR")
SOURCE = Path(_keys_dir) if _keys_dir else ROOT / "assets" / "walk-keys-v7"
PUBLIC = ROOT / "public" / "animation"
SEQUENCES = [
    "walking_right",
    "walking_left",
    "walking_towards_right",
    "walking_towards_left",
    "walking_away_right",
    "walking_away_left",
    "walking_up",
    "walking_down",
]
CANVAS_W, CANVAS_H, FOOT_Y = 520, 900, 880
QUALITY = 82


def remove_white_background(rgb: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    paper = (
        ((hsv[:, :, 1] < 42) & (hsv[:, :, 2] > 210))
        | ((rgb.min(axis=2) > 228) & (rgb.mean(axis=2) > 236))
    )
    body = (~paper).astype(np.uint8)
    body = cv2.morphologyEx(body, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    _num, labels = cv2.connectedComponents(paper.astype(np.uint8), connectivity=4)
    border = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    bg = np.zeros(paper.shape, bool)
    for lab in border:
        if lab:
            bg[labels == lab] = True
    ys, xs = np.where(body > 0)
    if len(xs):
        top, bot = int(ys.min()), int(ys.max())
        height = max(1, bot - top + 1)
        foot_band = np.zeros_like(body)
        foot_band[top + int(height * 0.78) : bot + 1] = body[top + int(height * 0.78) : bot + 1]
        dist = cv2.distanceTransform((foot_band == 0).astype(np.uint8), cv2.DIST_L2, 3)
        # Keep only studio-white that sits on the sneaker, not the whole backdrop pad.
        shoes = paper & (dist < 8) & (np.arange(rgb.shape[0])[:, None] >= top + int(height * 0.78))
        bg &= ~shoes
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    edge = (~bg) & paper & (cv2.distanceTransform(bg.astype(np.uint8), cv2.DIST_L2, 3) < 2.2)
    fade = np.clip((250 - rgb.mean(axis=2)) / 40.0, 0.15, 1)
    alpha[edge] = (alpha[edge].astype(np.float32) * fade[edge]).astype(np.uint8)
    return np.dstack([rgb, alpha])


def largest_component(rgba: np.ndarray) -> np.ndarray:
    alpha = rgba[:, :, 3] > 10
    labels, n = ndimage.label(alpha, structure=np.ones((3, 3)))
    if n <= 1:
        return rgba
    sizes = ndimage.sum(alpha, labels, range(1, n + 1))
    main = int(np.argmax(sizes)) + 1
    out = rgba.copy()
    out[labels != main, 3] = 0
    return out


def load_key(path: Path) -> np.ndarray:
    im = Image.open(path)
    if im.mode == "RGBA" and np.array(im)[:, :, 3].mean() > 10:
        return largest_component(np.array(im))
    rgb = np.array(im.convert("RGB"))
    return largest_component(remove_white_background(rgb))


def bounds(rgba: np.ndarray) -> tuple[int, int, int, int]:
    ys, xs = np.where(rgba[:, :, 3] > 12)
    if len(xs) == 0:
        return 0, 0, rgba.shape[1], rgba.shape[0]
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def place(rgba: np.ndarray, scale: float) -> np.ndarray:
    l, t, r, b = bounds(rgba)
    crop = rgba[t : b + 1, l : r + 1]
    h, w = crop.shape[:2]
    nh, nw = max(1, int(h * scale)), max(1, int(w * scale))
    resized = cv2.resize(crop, (nw, nh), interpolation=cv2.INTER_AREA)
    canvas = np.zeros((CANVAS_H, CANVAS_W, 4), np.uint8)
    x = (CANVAS_W - nw) // 2
    y = FOOT_Y - nh
    y = max(0, min(CANVAS_H - nh, y))
    canvas[y : y + nh, x : x + nw] = resized
    return canvas


def save_webp(rgba: np.ndarray, dest: Path) -> None:
    clean = largest_component(rgba)
    dest.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(clean, "RGBA").save(dest, "WEBP", quality=QUALITY, method=6)


def build_sequence(seq: str) -> None:
    keys = []
    for i in range(1, 9):
        path = SOURCE / seq / f"{seq}_{i}.png"
        if not path.is_file():
            raise FileNotFoundError(path)
        keys.append(load_key(path))
    scales = []
    for k in keys:
        l, t, r, b = bounds(k)
        h = b - t + 1
        scales.append(min(760 / h, 480 / (r - l + 1)))
    scale = min(scales) * 0.98
    pub = PUBLIC / seq
    pub.mkdir(parents=True, exist_ok=True)
    for old in pub.glob(f"{seq}_*.webp"):
        old.unlink()
    for i, k in enumerate(keys, start=1):
        save_webp(place(k, scale), pub / f"{seq}_{i}.webp")
    print(f"{seq}: 8 aligned transparent frames -> {pub}")


def main() -> None:
    only = [s for s in sys.argv[1:] if s in SEQUENCES]
    for seq in only or SEQUENCES:
        build_sequence(seq)
    print("Done.")


if __name__ == "__main__":
    main()
