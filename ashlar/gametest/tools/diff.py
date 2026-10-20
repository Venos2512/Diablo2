#!/usr/bin/env python
"""Mean absolute pixel difference between two sets of screenshots (0..255 scale, RGB): raw and 8x8 mean-pooled.

    python -I tools/diff.py shots <suffixA> <suffixB> state1 state2 ...     (compares shots/<state>-<suffixA>.png with ...-<suffixB>.png)
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

d, a, b, *states = sys.argv[1:]
for st in states:
    x = np.asarray(Image.open(Path(d) / f'{st}-{a}.png').convert('RGB')).astype(np.int16)
    y = np.asarray(Image.open(Path(d) / f'{st}-{b}.png').convert('RGB')).astype(np.int16)
    if x.shape != y.shape:
        print(f'{st:12s} size mismatch {x.shape} vs {y.shape}')
        continue
    e = np.abs(x - y)
    # film grain (the post pass animates it with time) and fire particles make two renders of the SAME build differ:
    # the 8x8 mean-pooled difference averages the grain away and is the number to compare against the noise floor.
    h, w = (x.shape[0] // 8) * 8, (x.shape[1] // 8) * 8
    pool = lambda a: a[:h, :w].reshape(h // 8, 8, w // 8, 8, 3).mean(axis=(1, 3))
    eb = np.abs(pool(x.astype(np.float64)) - pool(y.astype(np.float64)))
    print(f'{st:12s} mean abs diff {e.mean():7.3f} (raw)  {eb.mean():7.3f} (8x8 pooled)  max pooled {eb.max():6.2f}')
