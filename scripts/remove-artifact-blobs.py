#!/usr/bin/env python3
"""One-off: some AI-generated sprite frames have a small disconnected fragment
(a stray extra hand/finger, an isolated speck) floating apart from the actual
character silhouette. Keep only the largest connected alpha component per
frame and erase everything else."""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

def clean(path, dry_run=False):
    im = Image.open(path).convert("RGBA")
    arr = np.array(im)
    alpha = arr[:, :, 3] > 10
    labels, n = ndimage.label(alpha, structure=np.ones((3, 3)))
    if n <= 1:
        print(f"{path}: no stray blobs")
        return
    sizes = ndimage.sum(alpha, labels, range(1, n + 1))
    main = np.argmax(sizes) + 1
    removed = int(sum(sizes) - sizes[main - 1])
    if dry_run:
        print(f"{path}: {n} components, would remove {n - 1} blob(s), {removed}px")
        return
    arr[labels != main, 3] = 0
    Image.fromarray(arr, "RGBA").save(path, "WEBP", quality=82, method=6)
    print(f"{path}: {n} components, removed {n - 1} blob(s), {removed}px")

if __name__ == "__main__":
    dry = "--dry-run" in sys.argv
    for p in sys.argv[1:]:
        if p.startswith("--"):
            continue
        clean(p, dry_run=dry)
