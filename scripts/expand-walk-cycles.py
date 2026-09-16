#!/usr/bin/env python3
"""Assemble 16-frame looping walk cycles from original keys + generated in-betweens."""
from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path('/Volumes/pexa/abs_website')
ANIM = ROOT / 'public' / 'animation'
SOURCE = ROOT / 'scripts' / 'original-walk-frames'
ASSETS = Path('/Users/apple/.cursor/projects/Volumes-pexa-abs-website/assets')
SEQUENCES = [
    'walking_right',
    'walking_left',
    'walking_away_right',
    'walking_away_left',
    'walking_towards_right',
    'walking_towards_left',
]
PAIRS = [(1, 2), (2, 3), (3, 4), (4, 5), (5, 6), (6, 7), (7, 8), (8, 1)]


def remove_white_background(rgb: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    paper = (
        ((hsv[:, :, 1] < 38) & (hsv[:, :, 2] > 218))
        | ((rgb.min(axis=2) > 236) & (rgb.mean(axis=2) > 242))
    ).astype(np.uint8)
    _num, labels = cv2.connectedComponents(paper, connectivity=4)
    border = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    bg = np.zeros(paper.shape, np.uint8)
    for lab in border:
        if lab == 0:
            continue
        bg[labels == lab] = 1
    bg = bg.astype(bool)
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    dist = cv2.distanceTransform((~bg).astype(np.uint8), cv2.DIST_L2, 3)
    fringe = (~bg) & (dist < 1.6) & (hsv[:, :, 1] < 45) & (hsv[:, :, 2] > 210)
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


def save_png(path: Path, rgba: np.ndarray) -> None:
    Image.fromarray(rgba).save(path, optimize=True)


def assemble(seq: str) -> None:
    dest = ANIM / seq
    dest.mkdir(exist_ok=True)
    for name in dest.glob(f'{seq}_*.png'):
        name.unlink()

    frame_index = 1
    for i, (a, b) in enumerate(PAIRS, start=1):
        orig = np.array(Image.open(SOURCE / seq / f'{seq}_{i}.png').convert('RGBA'))
        save_png(dest / f'{seq}_{frame_index}.png', orig)
        frame_index += 1

        ib_path = ASSETS / f'{seq}_ib_{a}_{b}.png'
        rgb = np.array(Image.open(ib_path).convert('RGB'))
        rgba = crop_content(remove_white_background(rgb))
        save_png(dest / f'{seq}_{frame_index}.png', rgba)
        frame_index += 1
        print(f'  {seq}: wrote {i}/8 key + in-between {a}->{b}  ib={rgba.shape[1]}x{rgba.shape[0]}')


def main() -> None:
    for seq in SEQUENCES:
        print(f'\n=== {seq} ===')
        assemble(seq)
    print('\nDone')


if __name__ == '__main__':
    main()
