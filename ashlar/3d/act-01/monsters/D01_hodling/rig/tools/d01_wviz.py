"""Mau cho ban do trong so (dung cho prototype va QA R5)."""
import colorsys
import numpy as np


def palette(names):
    """Mau tuong phan cao, on dinh theo ten bone: trai = tong lanh, phai = tong nong, giua = xanh la/vang."""
    out = {}
    cool = [(0.55 + 0.045 * i) % 1 for i in range(10)]
    warm = [(0.0 + 0.05 * i) % 1 for i in range(10)]
    ci = wi = mi = 0
    for n in names:
        if n.startswith("L_"):
            h = cool[ci % 10]; ci += 1; sat = 0.85; val = 0.95 - 0.12 * (ci % 2)
        elif n.startswith("R_"):
            h = warm[wi % 10]; wi += 1; sat = 0.9; val = 0.95 - 0.12 * (wi % 2)
        else:
            h = (0.25 + 0.083 * mi) % 1; mi += 1; sat = 0.75; val = 0.9 - 0.1 * (mi % 2)
        out[n] = colorsys.hsv_to_rgb(h, sat, val)
    return out


def vertex_colors(W, names, mode="blend", bone=None):
    """mode blend: mau = tong w_i*c_i ; dominant: mau cua bone troi nhat ; bone: thang nhiet (xanh->do) cua 1 bone."""
    pal = palette(names)
    Cn = np.array([pal[n] for n in names])
    if mode == "blend":
        return W @ Cn
    if mode == "dominant":
        return Cn[W.argmax(1)]
    if mode == "bone":
        w = W[:, names.index(bone)]
        # thang nhiet: 0 xam toi, 0..1 -> xanh duong -> xanh la -> vang -> do
        t = np.clip(w, 0, 1)
        r = np.clip(2 * t - 0.5, 0, 1) ; g = np.where(t < 0.5, 2 * t, 2 - 2 * t); b = np.clip(1 - 2 * t, 0, 1)
        col = np.stack([r, g, b], 1)
        col[w <= 1e-6] = (0.12, 0.12, 0.14)
        return col
    raise ValueError(mode)
