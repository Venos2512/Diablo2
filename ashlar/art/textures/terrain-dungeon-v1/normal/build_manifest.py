#!/usr/bin/env python3
"""Build normal/manifest.json: one Codex (gpt-6-astra image_gen) normal-map job per chosen dungeon albedo.

Same brief as ashlar/art/textures/terrain-biomes-v1/normal/build_manifest.py (OpenGL tangent space, keep the exact layout), with the
wrap sentence of its reruns on every job (the slab and rubble tiles have shapes cut by the tile edge). Each job attaches
albedo1024/{id}.png (seam-fixed by prepare_delivery.py) as the edit target. Two candidates per tile (_n1, _n2).
Run from the repo root:
  python -I ashlar/art/textures/terrain-biomes-v1/tools/generate_textures.py --manifest ashlar/art/textures/terrain-dungeon-v1/normal/manifest.json
Raw outputs land in normal/textures/{id}_n1.png / _n2.png.
"""
import importlib.util
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
BASE = HERE.parent
SRC = Path("E:/Diablo2/ashlar/art/textures/terrain-biomes-v1/normal")


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


TPL = load(SRC / "build_manifest.py", "bio_normal").TPL
WRAP = load(SRC / "reruns" / "build_manifest.py", "bio_normal_reruns").WRAP

# per texture: (English material name, features that must stay in place, relief brief)
R = {
    "crypt_dust_a": ("grave dust over old stone", "dust drift, faint slab edge and bone chip",
        "a soft, almost flat dusty floor: the pale dust drifts are very low soft mounds with blurred edges, the faint "
        "buried slab edges are very shallow soft grooves, the tiny bone chips are small low bumps; very low overall "
        "strength, mostly flat #8080FF"),
    "crypt_damp_a": ("damp dark crypt slabs", "stone slab, joint and mould patch",
        "irregular old floor slabs with flat, slightly worn tops and softly rounded edges; the narrow dark joints are "
        "recessed grooves; seepage stains and mould are colour only and have no relief; moderate strength"),
    "crypt_rubble_a": ("collapsed limestone rubble on a dusty floor", "rubble piece, stone chip and dust gap",
        "the broken limestone pieces are raised flat-topped chunks with chipped, softly bevelled edges, larger pieces "
        "clearly higher than the small chips; the dusty floor between them is low and smooth; moderate strength"),
    "cave_floor_a": ("natural chalk cave floor", "rock plane, drip hollow and flint nodule",
        "smooth water-worn natural rock: broad gently undulating rounded planes, the soft grey hollows are shallow "
        "rounded dips, the black flint nodules are slightly raised rounded lumps; soft, low to moderate strength, no "
        "cut edges"),
    "cave_clay_a": ("wet chalk clay mud", "clay mass, drier crust edge and drag mark",
        "smooth soft mud: broad low rounded swellings, the drier crust edges are very slightly raised soft rims, the "
        "drag marks are shallow soft grooves; very gentle overall strength"),
    "cave_rubble_a": ("chalk and flint rubble on cave dust", "chalk lump, flint shard and dust gap",
        "the pale chalk lumps are raised rounded chunks, the black flint shards are raised angular chips with crisp "
        "but soft-bevelled facets, the grey dust between them is low and smooth; moderate strength"),
    "cave_flowstone_a": ("calcite flowstone with rimstone terraces", "terrace rim, pool hollow and mineral stain",
        "rounded raised rims of the small rimstone terraces, each with a gently dished, lower flat floor behind its rim, "
        "stepping down the tile; stains are colour only; soft, moderate strength"),
}


def main():
    src = json.loads((BASE / "manifest_selected.json").read_text(encoding="utf-8"))
    ids = [j["id"] for j in src]
    if set(ids) != set(R):
        raise SystemExit(f"relief table out of sync with manifest_selected: {sorted(set(ids) ^ set(R))}")
    out = []
    for j in src:
        i = j["id"]
        material, features, relief = R[i]
        ref = BASE / "albedo1024" / f"{i}.png"
        if not ref.is_file():
            raise SystemExit(f"missing albedo {ref}")
        for v in ("n1", "n2"):
            out.append({
                "id": f"{i}_{v}", "source": i, "map": "normal", "albedo": f"albedo1024/{i}.png",
                "prompt": TPL.format(material=material, features=features, relief=relief) + WRAP,
                "reference": ref.as_posix(),
            })
    (HERE / "manifest.json").write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{len(out)} jobs -> {HERE / 'manifest.json'}")


if __name__ == "__main__":
    main()
