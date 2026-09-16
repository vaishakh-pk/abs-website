#!/usr/bin/env python3
"""Assemble 16-frame vertical walk cycles from generated keys + in-betweens."""
from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path('/Volumes/pexa/abs_website')
ANIM = ROOT / 'public' / 'animation'
ASSETS = Path('/Users/apple/.cursor/projects/Volumes-pexa-abs-website/assets')
KEYS = ROOT / 'scripts' / 'original-walk-frames'
SEQUENCES = ['walking_down', 'walking_up']
PAIRS = [(1, 2), (2, 3), (3, 4), (4, 5), (5, 6), (6, 7), (7, 8), (8, 1)]


def remove_white_background(rgb: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    paper = (
        ((hsv[:, :, 1] < 38) & (hsv[:, :, 2] > 218))
        | ((rgb.min(axis=2) > 236) & (rgb.mean(axis=2) > 242))
    )
    core = (~paper).astype(np.uint8)
    core = cv2.morphologyEx(core, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    ys, xs = np.where(core > 0)
    shoes = np.zeros(paper.shape, bool)
    if len(xs):
        top, bot = int(ys.min()), int(ys.max())
        height = max(1, bot - top + 1)
        # Only dilate from the feet themselves so calf-gap studio white stays background.
        feet = np.zeros_like(core)
        feet[top + int(height * 0.84):] = core[top + int(height * 0.84):]
        feet = cv2.dilate(feet, np.ones((11, 11), np.uint8))
        shoes = paper & (feet > 0)

    _num, labels = cv2.connectedComponents(paper.astype(np.uint8), connectivity=4)
    border = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    bg = np.zeros(paper.shape, np.uint8)
    for lab in border:
        if lab == 0:
            continue
        bg[labels == lab] = 1
    bg = bg.astype(bool) & ~shoes
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    dist = cv2.distanceTransform((~bg).astype(np.uint8), cv2.DIST_L2, 3)
    fringe = (~bg) & ~shoes & (dist < 1.6) & (hsv[:, :, 1] < 45) & (hsv[:, :, 2] > 210)
    fade = np.clip((250 - rgb.mean(axis=2)) / 35.0, 0, 1)
    alpha[fringe] = (alpha[fringe].astype(np.float32) * fade[fringe]).astype(np.uint8)
    return np.dstack([rgb, alpha])


def crop_content(rgba: np.ndarray, pad: int = 8) -> np.ndarray:
    ys, xs = np.where(rgba[:, :, 3] > 12)
    if len(xs) == 0:
        return rgba
    l, t, r, b = int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())
    h, w = rgba.shape[:2]
    l, t = max(0, l - pad), max(0, t - pad)
    r, b = min(w - 1, r + pad), min(h - 1, b + pad)
    return rgba[t:b + 1, l:r + 1]


def load_processed(path: Path) -> np.ndarray:
    rgb = np.array(Image.open(path).convert('RGB'))
    return crop_content(remove_white_background(rgb))


def save_png(path: Path, rgba: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba).save(path, optimize=True)


def assemble(seq: str) -> None:
    dest = ANIM / seq
    dest.mkdir(exist_ok=True)
    for name in dest.glob(f'{seq}_*.png'):
        name.unlink()
    key_dir = KEYS / seq
    key_dir.mkdir(parents=True, exist_ok=True)

    frame_index = 1
    for i, (a, b) in enumerate(PAIRS, start=1):
        key = load_processed(ASSETS / f'{seq}_key_{i}.png')
        save_png(key_dir / f'{seq}_{i}.png', key)
        save_png(dest / f'{seq}_{frame_index}.png', key)
        opaque = float((key[:, :, 3] > 12).mean())
        print(f'  {seq}_{frame_index}: key {i}  {key.shape[1]}x{key.shape[0]}  opaque={opaque:.3f}')
        frame_index += 1

        ib = load_processed(ASSETS / f'{seq}_ib_{a}_{b}.png')
        save_png(dest / f'{seq}_{frame_index}.png', ib)
        opaque = float((ib[:, :, 3] > 12).mean())
        print(f'  {seq}_{frame_index}: ib {a}->{b}  {ib.shape[1]}x{ib.shape[0]}  opaque={opaque:.3f}')
        frame_index += 1


def main() -> None:
    for seq in SEQUENCES:
        print(f'\n=== {seq} ===')
        assemble(seq)
    print('\nDone')


if __name__ == '__main__':
    main()
