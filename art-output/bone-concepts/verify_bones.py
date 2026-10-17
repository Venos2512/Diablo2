"""Read-only validation of the concept deliverables. No test fixtures or writes."""
from pathlib import Path
import json
from PIL import Image

folder=Path(__file__).resolve().parent
required=['01_scattered_bone_decals.png','02_halfburied_monster_skeletons.png','03_giant_carcass_landmark.png','04_act_variants.png','05_readability_check.png']
for name in required:
    assert (folder/name).exists(),name
for p in sorted(folder.glob('*.png')):
    with Image.open(p) as im:im.verify()
    with Image.open(p) as im:
        im.load()
        assert im.mode=='RGB',(p.name,im.mode)
        if p.name in required:assert im.size==(1920,1280),(p.name,im.size)
        print(f'OPEN OK / {p.name} / {im.width} x {im.height}')
m=json.loads((folder/'verification.json').read_text(encoding='utf-8'))
assert m['hero_height_px']==75
assert m['hero_minus_bone_peak']>=15,m
assert m['bone_luma_max']<=45,m
assert m['clear_path_sub']>=3,m
assert m['blocking_vertices_in_corridor']==0,m
assert m['blocking_geometry_clearance_in_sub']>0,m
assert m['corridor_cross_vector_px']==[48,24],m
print(f"VALUE OK / hero {m['hero_luma_min']} - bone {m['bone_luma_max']} = {m['hero_minus_bone_peak']} >= 15")
print(f"PATH OK / {m['clear_path_sub']} Sub; extra clearance {m['blocking_geometry_clearance_in_sub']} Sub; no blocking vertices")
