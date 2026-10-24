"""Preflight R0/R1: do GLB goc cua mot asset va ghi JSON (chi doc, khong sua GLB).

Chay:  python -I preflight_glb.py <glb> <out.json> [--target-height-m 0.5]

Chi dung thu vien chuan. Do: hash nguon, mesh/primitive/tam giac, accessor min/max (khai bao va tinh lai tu du lieu),
node transform, bounds the gioi (sau transform), texture (kich thuoc, dinh dang, byte), skin, animation, cac lat cat theo
chieu cao de dinh vi khop va suy ra huong +Z. Cac suy luan (landmark, huong) ghi o khoa "inferred" va can xac minh bang anh.
"""
import argparse
import hashlib
import json
import math
import os
import struct
import sys

COMP = {5120: ("b", 1), 5121: ("B", 1), 5122: ("h", 2), 5123: ("H", 2), 5125: ("I", 4), 5126: ("f", 4)}
NCOMP = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT2": 4, "MAT3": 9, "MAT4": 16}


def read_glb(path):
    with open(path, "rb") as f:
        data = f.read()
    magic, version, length = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF":
        raise SystemExit("khong phai GLB: " + path)
    off, js, binc = 12, None, None
    chunks = []
    while off < len(data):
        clen, ctype = struct.unpack_from("<I4s", data, off)
        body = data[off + 8: off + 8 + clen]
        chunks.append({"type": ctype.decode("ascii", "replace"), "length": clen})
        if ctype == b"JSON":
            js = json.loads(body.decode("utf-8"))
        elif ctype == b"BIN\x00":
            binc = body
        off += 8 + clen
    return data, version, length, chunks, js, binc


def accessor_array(js, binc, idx):
    acc = js["accessors"][idx]
    bv = js["bufferViews"][acc["bufferView"]]
    fmt, size = COMP[acc["componentType"]]
    n = NCOMP[acc["type"]]
    stride = bv.get("byteStride") or size * n
    base = bv.get("byteOffset", 0) + acc.get("byteOffset", 0)
    out = []
    for i in range(acc["count"]):
        out.append(struct.unpack_from("<" + fmt * n, binc, base + i * stride))
    return out


def image_info(js, binc, img):
    bv = js["bufferViews"][img["bufferView"]]
    raw = binc[bv.get("byteOffset", 0): bv.get("byteOffset", 0) + bv["byteLength"]]
    info = {"mimeType": img.get("mimeType"), "bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest()}
    if raw[:8] == b"\x89PNG\r\n\x1a\n":
        w, h = struct.unpack(">II", raw[16:24])
        info.update(format="PNG", width=w, height=h, bit_depth=raw[24], color_type=raw[25])
    elif raw[:2] == b"\xff\xd8":
        i = 2
        while i < len(raw):
            if raw[i] != 0xFF:
                i += 1
                continue
            m = raw[i + 1]
            if m in (0xC0, 0xC1, 0xC2):
                h, w = struct.unpack(">HH", raw[i + 5: i + 9])
                info.update(format="JPEG", width=w, height=h, components=raw[i + 9])
                break
            i += 2 + struct.unpack(">H", raw[i + 2: i + 4])[0]
    return info


def mat_mul(a, b):
    return [sum(a[r * 4 + k] * b[k * 4 + c] for k in range(4)) for r in range(4) for c in range(4)]


def node_local(n):
    if "matrix" in n:
        m = n["matrix"]  # column-major -> row-major
        return [m[c * 4 + r] for r in range(4) for c in range(4)]
    t = n.get("translation", [0, 0, 0])
    q = n.get("rotation", [0, 0, 0, 1])
    s = n.get("scale", [1, 1, 1])
    x, y, z, w = q
    r = [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w),
         2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w),
         2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]
    return [r[0] * s[0], r[1] * s[1], r[2] * s[2], t[0],
            r[3] * s[0], r[4] * s[1], r[5] * s[2], t[1],
            r[6] * s[0], r[7] * s[1], r[8] * s[2], t[2],
            0, 0, 0, 1]


def xform(m, p):
    return (m[0] * p[0] + m[1] * p[1] + m[2] * p[2] + m[3],
            m[4] * p[0] + m[5] * p[1] + m[6] * p[2] + m[7],
            m[8] * p[0] + m[9] * p[1] + m[10] * p[2] + m[11])


def r(v, n=4):
    return round(v, n)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("glb")
    ap.add_argument("out")
    ap.add_argument("--target-height-m", type=float, default=None)
    ap.add_argument("--bands", type=int, default=20)
    a = ap.parse_args()

    data, version, length, chunks, js, binc = read_glb(a.glb)
    res = {
        "tool": "preflight_glb.py",
        "source": {
            "path": os.path.relpath(a.glb, os.getcwd()).replace("\\", "/") if os.path.isabs(a.glb) is False else a.glb.replace("\\", "/"),
            "bytes": len(data),
            "sha256": hashlib.sha256(data).hexdigest(),
            "glb_version": version,
            "header_length": length,
            "chunks": chunks,
            "generator": js.get("asset", {}),
            "extensionsUsed": js.get("extensionsUsed", []),
            "extensionsRequired": js.get("extensionsRequired", []),
        },
        "counts": {k: len(js.get(k, [])) for k in
                   ("scenes", "nodes", "meshes", "materials", "textures", "images", "samplers", "skins", "animations",
                    "accessors", "bufferViews", "cameras")},
    }

    # node transforms, world matrices
    nodes = js.get("nodes", [])
    parent = {}
    for i, n in enumerate(nodes):
        for c in n.get("children", []):
            parent[c] = i
    world = {}

    def get_world(i):
        if i in world:
            return world[i]
        m = node_local(nodes[i])
        if i in parent:
            m = mat_mul(get_world(parent[i]), m)
        world[i] = m
        return m

    res["scene_roots"] = [js["scenes"][s].get("nodes", []) for s in range(len(js.get("scenes", [])))]
    res["nodes"] = []
    for i, n in enumerate(nodes):
        res["nodes"].append({
            "index": i, "name": n.get("name"), "mesh": n.get("mesh"), "skin": n.get("skin"),
            "parent": parent.get(i), "children": n.get("children", []),
            "translation": n.get("translation"), "rotation": n.get("rotation"), "scale": n.get("scale"),
            "matrix": n.get("matrix"),
            "world_is_identity": all(abs(get_world(i)[k] - (1 if k % 5 == 0 else 0)) < 1e-9 for k in range(16)),
        })

    # meshes
    all_pts = []
    uv_ranges = []
    res["meshes"] = []
    tri_total = 0
    for mi, mesh in enumerate(js.get("meshes", [])):
        m_entry = {"index": mi, "name": mesh.get("name"), "primitives": []}
        inst_nodes = [i for i, n in enumerate(nodes) if n.get("mesh") == mi]
        for pi, prim in enumerate(mesh["primitives"]):
            attrs = prim["attributes"]
            mode = prim.get("mode", 4)
            pos_acc = js["accessors"][attrs["POSITION"]]
            idx_acc = js["accessors"][prim["indices"]] if "indices" in prim else None
            count_idx = idx_acc["count"] if idx_acc else pos_acc["count"]
            tris = count_idx // 3 if mode == 4 else None
            if tris:
                tri_total += tris
            pos = accessor_array(js, binc, attrs["POSITION"])
            calc_min = [min(p[k] for p in pos) for k in range(3)]
            calc_max = [max(p[k] for p in pos) for k in range(3)]
            e = {
                "index": pi, "mode": mode, "material": prim.get("material"),
                "vertices": pos_acc["count"], "index_count": idx_acc["count"] if idx_acc else None,
                "index_component_type": idx_acc["componentType"] if idx_acc else None,
                "triangles": tris,
                "attributes": {k: {"accessor": v, "type": js["accessors"][v]["type"],
                                   "componentType": js["accessors"][v]["componentType"],
                                   "count": js["accessors"][v]["count"],
                                   "normalized": js["accessors"][v].get("normalized", False),
                                   "min": js["accessors"][v].get("min"), "max": js["accessors"][v].get("max")}
                               for k, v in attrs.items()},
                "position_min_declared": pos_acc.get("min"), "position_max_declared": pos_acc.get("max"),
                "position_min_computed": [r(v, 6) for v in calc_min], "position_max_computed": [r(v, 6) for v in calc_max],
                "position_bounds_match_declared": (
                    pos_acc.get("min") is not None and
                    all(abs(calc_min[k] - pos_acc["min"][k]) < 1e-5 and abs(calc_max[k] - pos_acc["max"][k]) < 1e-5 for k in range(3))),
                "has_joints_weights": "JOINTS_0" in attrs and "WEIGHTS_0" in attrs,
                "morph_targets": len(prim.get("targets", [])),
            }
            if idx_acc and mode == 4:
                ids = accessor_array(js, binc, prim["indices"])
                flat = [v[0] for v in ids]
                mx = max(flat) if flat else -1
                degenerate = 0
                for t in range(0, len(flat) - 2, 3):
                    if flat[t] == flat[t + 1] or flat[t + 1] == flat[t + 2] or flat[t] == flat[t + 2]:
                        degenerate += 1
                used = len(set(flat))
                e["index_max"] = mx
                e["degenerate_triangles"] = degenerate
                e["unused_vertices"] = pos_acc["count"] - used
            if "TEXCOORD_0" in attrs:
                uv = accessor_array(js, binc, attrs["TEXCOORD_0"])
                e["uv0_range"] = [[r(min(u[k] for u in uv), 5), r(max(u[k] for u in uv), 5)] for k in range(2)]
            if "NORMAL" in attrs:
                nrm = accessor_array(js, binc, attrs["NORMAL"])
                lens = [math.sqrt(x * x + y * y + z * z) for x, y, z in nrm]
                e["normal_length_minmax"] = [r(min(lens), 5), r(max(lens), 5)]
            m_entry["primitives"].append(e)
            # world points, per instance node
            for ni in inst_nodes:
                wm = get_world(ni)
                for p in pos:
                    all_pts.append(xform(wm, p))
        m_entry["instanced_by_nodes"] = inst_nodes
        res["meshes"].append(m_entry)
    res["totals"] = {"triangles": tri_total, "vertices": sum(p["vertices"] for m in res["meshes"] for p in m["primitives"])}

    # world bounds and dimensions
    if all_pts:
        mn = [min(p[k] for p in all_pts) for k in range(3)]
        mx = [max(p[k] for p in all_pts) for k in range(3)]
        dims = [mx[k] - mn[k] for k in range(3)]
        res["world_bounds"] = {
            "min": [r(v, 6) for v in mn], "max": [r(v, 6) for v in mx],
            "size_xyz": [r(v, 6) for v in dims],
            "longest_axis": "xyz"[dims.index(max(dims))],
            "foot_y_min": r(mn[1], 6),
            "center_xz": [r((mn[0] + mx[0]) / 2, 6), r((mn[2] + mx[2]) / 2, 6)],
        }
        # chieu cao than: bo qua dau mut tay -> dung chieu Y
        H = dims[1]
        res["scale_to_target"] = None
        if a.target_height_m:
            res["scale_to_target"] = {"target_height_m": a.target_height_m, "height_y_now_m": r(H, 6),
                                      "scale_factor": r(a.target_height_m / H, 6),
                                      "arm_span_x_after_scale_m": r(dims[0] * a.target_height_m / H, 4),
                                      "depth_z_after_scale_m": r(dims[2] * a.target_height_m / H, 4),
                                      "note": "target tinh theo chieu Y cua bounds (dinh mu den day chan), khong phai chieu cao dung thang cua nhan vat"}
        # lat cat theo chieu cao
        nb = a.bands
        bands = []
        for b in range(nb):
            y0 = mn[1] + H * b / nb
            y1 = mn[1] + H * (b + 1) / nb
            pts = [p for p in all_pts if y0 <= p[1] < y1 or (b == nb - 1 and p[1] == y1)]
            if not pts:
                bands.append({"band": b, "y": [r(y0), r(y1)], "n": 0})
                continue
            bands.append({
                "band": b, "y": [r(y0), r(y1)], "n": len(pts),
                "x": [r(min(p[0] for p in pts)), r(max(p[0] for p in pts))],
                "z": [r(min(p[2] for p in pts)), r(max(p[2] for p in pts))],
                "z_mean": r(sum(p[2] for p in pts) / len(pts)),
            })
        res["height_bands"] = {"count": nb, "bands": bands}

        # suy luan: huong, tay, chan (chi mang tinh hinh hoc)
        inf = {"note": "Suy luan hinh hoc tu dinh, chua xac minh bang anh trong Blender; xem rig_brief muc 'chua xac minh'"}
        cx = (mn[0] + mx[0]) / 2
        # tay: dai x lon nhat nam o dai y nao
        widest = max((b for b in bands if b.get("n")), key=lambda b: b["x"][1] - b["x"][0])
        inf["widest_band_y"] = widest["y"]
        inf["widest_band_x_span"] = r(widest["x"][1] - widest["x"][0])
        inf["arm_height_ratio_of_H"] = r(((widest["y"][0] + widest["y"][1]) / 2 - mn[1]) / H, 3)
        # chan: dai thap 0..25% H, trai/phai (x<cx, x>cx)
        low = [p for p in all_pts if p[1] < mn[1] + 0.12 * H]
        l = [p for p in low if p[0] < cx]
        rr = [p for p in low if p[0] >= cx]
        if l and rr:
            inf["feet_band_y_lt_0.12H"] = {
                "x_low_side": [r(min(p[0] for p in l)), r(max(p[0] for p in l))],
                "x_high_side": [r(min(p[0] for p in rr)), r(max(p[0] for p in rr))],
                "gap_between_feet_x": r(min(p[0] for p in rr) - max(p[0] for p in l)),
                "z_extent": [r(min(p[2] for p in low)), r(max(p[2] for p in low))],
            }
        # than tren (bao): vung y>0.55H, z cua khoi lon nhat
        up = [p for p in all_pts if p[1] > mn[1] + 0.55 * H and abs(p[0] - cx) < 0.12 * (mx[0] - mn[0])]
        if up:
            inf["upper_torso_z_range_central_x"] = [r(min(p[2] for p in up)), r(max(p[2] for p in up))]
            zc = sum(p[2] for p in up) / len(up)
            inf["upper_torso_z_mean_central_x"] = r(zc)
            foot_z = sum(p[2] for p in low) / len(low)
            inf["feet_z_mean"] = r(foot_z)
            inf["upper_minus_feet_z_mean"] = r(zc - foot_z)
        # huong mat theo ban chan: de (y < 0.05H) keo ve phia mui chan so voi ong chan (0.10..0.20H)
        sole = [p for p in all_pts if p[1] < mn[1] + 0.05 * H]
        shin = [p for p in all_pts if mn[1] + 0.10 * H <= p[1] < mn[1] + 0.20 * H]
        if sole and shin:
            ev = {}
            for name, sel in (("x_low_side", lambda p: p[0] < cx), ("x_high_side", lambda p: p[0] >= cx)):
                s = [p[2] for p in sole if sel(p)]
                h = [p[2] for p in shin if sel(p)]
                if s and h:
                    ev[name] = {"sole_z_min": r(min(s)), "sole_z_max": r(max(s)),
                                "sole_z_mean": r(sum(s) / len(s)), "shin_z_mean": r(sum(h) / len(h)),
                                "toe_toward": "+Z" if sum(s) / len(s) > sum(h) / len(h) else "-Z"}
            inf["foot_forward_evidence"] = ev
        # mui/dau: dinh o 0.8..1.0H, z cuc tri
        head = [p for p in all_pts if p[1] > mn[1] + 0.78 * H and abs(p[0] - cx) < 0.15 * (mx[0] - mn[0])]
        if head:
            inf["head_band_gt_0.78H_z_range"] = [r(min(p[2] for p in head)), r(max(p[2] for p in head))]
        res["inferred"] = inf

    # materials + textures
    res["materials"] = js.get("materials", [])
    res["images"] = []
    for i, im in enumerate(js.get("images", [])):
        if "bufferView" in im:
            res["images"].append({"index": i, **image_info(js, binc, im)})
        else:
            res["images"].append({"index": i, "uri": im.get("uri")})
    res["textures"] = js.get("textures", [])
    res["samplers"] = js.get("samplers", [])

    # skin / animation
    res["skins"] = js.get("skins", [])
    res["animations"] = [{"name": an.get("name"), "channels": len(an.get("channels", [])), "samplers": len(an.get("samplers", []))}
                         for an in js.get("animations", [])]
    res["rigging_state"] = {
        "has_skin": bool(js.get("skins")), "has_animation": bool(js.get("animations")),
        "has_joint_weight_attributes": any(p["has_joints_weights"] for m in res["meshes"] for p in m["primitives"]),
        "has_morph_targets": any(p["morph_targets"] for m in res["meshes"] for p in m["primitives"]),
    }

    with open(a.out, "w", encoding="utf-8", newline="\n") as f:
        json.dump(res, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print("ghi", a.out, "| tris", tri_total, "| sha256", res["source"]["sha256"][:16])


if __name__ == "__main__":
    sys.exit(main())
