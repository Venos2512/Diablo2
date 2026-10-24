"""Act I kit for the lab: the 86 Tripo row props of ashlar/3d/act-01/_batches/kit_v1 (A01.1-A14.6, A21.1-A25.6) -> assets/act1-kit/act1-<id>-<name>.glb.

The sources were built in Tripo from multi-asset row images (one run per row: tmp/act1-base-maps/TRIPO_ROWS.md section 2; R23-R33 + R31r for A21-A25,
after the v3 concepts ashlar/art/act-01/_batches/env_A21-A25) and cut into one GLB per asset
by ashlar/3d/act-01/_batches/kit_v1/_tools/split_rows.py, which already levelled each piece, turned its FRONT to +z with the front width along x, normalised
its longest side to 1 m (pivot at the bottom centre, Y up) and cut its UV islands out of the row atlas into an atlas of its own at the row's texel density
(base colour up to 8192 px, normal and metallicRoughness often at half that; the whole row atlas is kept when the islands cover most of it). Each piece is
  1. levelled where it still leans (`level` = 'support': support plane of the convex hull, as in prepare-act1-extras.py),
  2. turned by a baked yaw (three.js rotation.y degrees) where the split's front guess or a small skew needs it, so that size [w, h, d] = local x, y, z
     and front = local +z as in the Act I blockouts (env/act1/blockout.js, interiorBlockout.js and the map KIT / parts shapes),
  3. scaled UNIFORMLY to its real size, keyed on the dimension the concept states first (cells of ashlar/art/act-01/environments/E0x_* (E01-E04) for
     A01-A04, ashlar/art/act-01/_batches/env_A01-A14/prompts for A06-A14) with the base-map value of that dimension (docs/act1-base/ASSETS.md, the sizes of
     TRIPO_ROWS.md section 2), measured on the bbox after the yaw; for A21-A25 the sizes of tmp/act1-base-maps/MISSING_ENV_CONCEPTS_2.md (= the
     placeholders' base-map sizes), keyed on the first-stated one unless that makes the model absurd (the ASSETS comment says which),
  4. re-pivoted to the bottom centre (bbox centre in x / z, lowest point at y = 0),
  5. re-textured: the atlas is cropped to the piece's UV bounds (+ a margin) when they span less than CROP of its area (a piece that kept a whole row
     atlas with compact islands), else resampled whole; base colour + normal as JPEG with the atlas aspect kept (sides rounded to a multiple of 4),
     longest side 2048 px for the landmarks and 1024 px for the TEX_1024 props (about 3-4 m or less, seen from ~15 m by the ARPG camera);
     constant roughness / metalness factors (the metallicRoughness map is dropped, as for the act1 extras and the dungeon props).
TRIM adds a variant of the two post-and-crossbar props whose post rises over the bar (A07.6 rook roost pole, A13.4 Hush bell post: from the game camera
they can read as a cross, which ashlar/art-direction/artdirection.md forbids): the post is cut CUT_ABOVE m over the top of its bar and the cut end is closed by
flattening the post's top onto the cut plane (the top keeps its own end-grain texels). Sample id <id>-trim; the full model stays registered too.
CUT adds a lab variant with a part the base map walks through cut away (A02.1: the knee-high rail across the lychgate's back opening, 0.40-0.62 m, which the
hero would cross on every pass; A06.1: the causeway's two end posts, on its centre line, which put a pair of posts every 4 m down a dike road): every face
whose centroid lies in one of its boxes (the prepared frame) is dropped. Sample id <id>-<suffix>.
TINT grades the base colour of a few assets (sRGB, before the JPEG: part of the way to grey, then RGB multipliers): A08.2 and its stile, whose pale cream
stone read near-white in the Poppy Reach (darkened and greyed to ~0.7).
LIFT lifts a dark band in the base colour of a few assets toward the clean tone of the same faces (sRGB, before the JPEG; a region mask rasterised into
the atlas with a soft edge, only ever lighter): the A23.3 garth bed's limewashed kerb, whose outer sides darken to a grey-brown grime band below ~0.35 m
(a black smear at game distance in the Gentle House cloister, a Mercy space).
FLAT gives a few assets' faces their own vertices with the face normal (hard edges): the same A23.3 kerb sides shared their corner vertices with the
bed's bottom and top, so their averaged normals pointed down at the foot and the lower half of each side faced the floor (unlit: most of that smear).
SQUASH scales a few assets on one axis after step 3 (the key dimension kept): the A11.2 bed's width x 0.7 (1.71 -> 1.2 m: a single hospice bed).
WARP adds a lab variant bent where the map walks (after step 4, in the real-size frame; normals by the inverse transpose of the bend, the feet stay flat):
A21.5 '-wide' (the leaning stones, A17.1 v2) spreads the two stones apart, each by k m below a hinge height and less above it to 0 at the top, so the
passage clears 2.6 m up to 2.2 m while the tops still touch; A25.1 '-slim' (the root rib arch) pulls the root feet that spread ~5 m deep in to ~1.9 m
with a smooth compression of |z| past a (the arch body inside it is untouched). Sample id <id>-<suffix>; the full model stays registered too.
The transform is baked into the vertices with an identity node (the interior engine instances the first mesh's geometry directly). Registered in
src/assets/samples.json after the act1 extras (kind "model", file "act1-kit/<id>.glb", source = the ashlar/3d folder) with one licence paragraph in
THIRD_PARTY_LICENSES.md (marker act1-kit-v1); every other line of both files stays byte-identical, and neither is rewritten when its text is unchanged.
A GLB whose bytes are unchanged is not rewritten either. Never edits the source GLBs.

Usage: python scripts/prepare-act1-kit.py [--only A01.1,A13.4] [--report <path.json>] [--no-register]
  --report writes the measurements for the fit table: dims after the yaw, key, scale, triangles, sizes, crop, up-facing planes, light spots, the
  footprint at walking height (blocking parts, clear passages; for decks the lane above the deck), and for TRIM the cut height.
Idempotent: re-running rewrites nothing when the sources and this table are unchanged.
"""
import importlib.util
import io
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('prepare_act1_extras', os.path.join(HERE, 'prepare-act1-extras.py'))
ext = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ext)  # helpers only (retry, support_up, rot_align, yaw_matrix, up_planes, light_spots, register): its main() does not run

ROOT = ext.ROOT
SRC = os.path.abspath(os.path.join(ROOT, '..', 'ashlar', '3d', 'act-01', '_batches', 'kit_v1'))
OUT = os.path.join(ROOT, 'assets', 'act1-kit')
SOURCE = 'ashlar/3d/act-01/_batches/kit_v1'  # the batch folder only: the pieces live in group folders (ext.piece_dir / ext.piece_rel find them)
piece_dir, piece_rel = ext.piece_dir, ext.piece_rel
ANCHOR = 'act1-p06-poppy-mound'  # the last act1 extras line: the kit lines follow it
TAG = 'act1-kit-v1'
CREDIT = ('Generated with Tripo (image to 3D from a multi-asset row image, split per asset by ashlar/3d/act-01/_batches/kit_v1/_tools/split_rows.py) from a '
          'Codex row image after the Act I concepts; turned to the Act I blockout frame, scaled to real size and re-encoded (JPEG, 2048 px longest side for '
          'the landmarks, 1024 px for props of about 3-4 m or less) by scripts/prepare-act1-kit.py')
LICENSE = ('The ASHLAR Act I kit - {names} - are project props generated with Tripo (image to 3D) from Codex row images after the Act I environment '
           'concepts (`ashlar/art/act-01/environments/E01_*` to `E04_*` and `A01_*` to `A14_*`; rows in `ashlar/3d/act-01/_batches/kit_v1`, split pieces in `ashlar/3d/act-01/environments/<group>`), '
           'turned, scaled to real size and re-encoded into `assets/act1-kit/` by `scripts/prepare-act1-kit.py`; project-internal.')

# (asset id, source folder, label, key: (axis, metres, band or None), yaw deg, level, roughness, metalness, extra)
# key = the dimension the concept states first, at its base-map value; band = (lo, hi) fraction of the height the key axis is measured in (None: bbox).
# yaw = the baked turn (three.js rotation.y: +90 takes +z to +x), added to the split's own front: A13.4 -62.7 lays its diagonal bar along x with the
# bells on +z; A02.2 +6.5, A11.2 -9.7, A14.1 -11.5, A14.5 -29 square up footprints the split left skewed (min-area rectangle).
# level: None | 'support' | ('column', lo, hi): a modelled lean of a stand's column (A11.6 leans ~12 deg on a flat foot) is taken out by a horizontal
# shear about the ground (x -= kx y, z -= kz y, from the column's section centres at lo and hi x height): the foot stays flat, every slice keeps its shape.
# extra: 'walk' = how the fit table measures walking: 'through' (a passage along z), 'deck' (walked on: the lane above the top surface), 'pieces'
# (loose pieces walked over: their tops), 'ridge' (a roof walked along its ridge: the ridge profile), 'around' (only the parts that block at walking height).
ASSETS = [
    ('A01.1', 'A01_1_stilt_cottage', 'Repaired thatched stilt cottage (5.2 m tall)', ('y', 5.2, None), 0, None, 0.9, 0.0, {}),
    ('A01.2', 'A01_2_walkway', 'Raised wooden walkway segment (4 m long)', ('x', 4.0, None), 0, None, 0.9, 0.0, {'walk': 'deck'}),
    ('A01.3', 'A01_3_flint_wall', 'Patched low flint wall (3.4 m module)', ('x', 3.4, None), 0, None, 0.92, 0.0, {}),
    ('A01.4', 'A01_4_hurdle_fence', 'Willow hurdle fence (3.2 m panel)', ('x', 3.2, None), 0, None, 0.9, 0.0, {}),
    ('A01.5', 'A01_5_village_well', 'Village well (3.4 m tall)', ('y', 3.4, None), 0, None, 0.9, 0.0, {}),
    ('A01.6', 'A01_6_eel_trap_rack', 'Eel-trap fishing rack (3 m tall)', ('y', 3.0, None), 0, None, 0.9, 0.0, {}),
    ('A02.1', 'A02_1_lychgate', 'Lychgate roofed gate (3.8 m tall)', ('y', 3.8, None), 0, None, 0.9, 0.0, {'walk': 'through'}),
    ('A02.2', 'A02_2_mortsafe', 'Mortsafe grave cage (2.6 m long)', ('x', 2.6, None), 6.5, None, 0.85, 0.0, {}),
    ('A02.3', 'A02_3_headstones', 'Small mismatched headstone cluster (3 m wide)', ('x', 3.0, None), 0, None, 0.92, 0.0, {}),
    ('A02.4', 'A02_4_ossuary_tower', 'Round ossuary tower (7.8 m tall)', ('y', 7.8, None), 0, None, 0.9, 0.0, {}),
    ('A02.5', 'A02_5_saint_statue_arch', 'Faceless saint statue supporting an arch (4.3 m tall)', ('y', 4.3, None), 0, None, 0.9, 0.0, {}),
    ('A02.6', 'A02_6_hand_cart', 'Funeral hand cart (3.2 m long)', ('x', 3.2, None), 0, None, 0.9, 0.0, {}),
    ('A03.4', 'A03_4_moss_rock', 'Large moss rock (1.6 m tall)', ('y', 1.6, None), 0, None, 0.92, 0.0, {}),
    ('A03.5', 'A03_5_peat_bank', 'Peat bank chunk (1.4 m tall)', ('y', 1.4, None), 0, None, 0.92, 0.0, {}),
    ('A03.6', 'A03_6_root_stump', 'Waterlogged root stump (1.3 m tall)', ('y', 1.3, None), 0, None, 0.92, 0.0, {}),
    ('A04.1', 'A04_1_old_willow', 'Old broad weeping willow (5.4 m tall)', ('y', 5.4, None), 0, None, 0.92, 0.0, {}),
    ('A04.2', 'A04_2_young_willow', 'Young willow (6 m tall)', ('y', 6.0, None), 0, None, 0.92, 0.0, {}),
    ('A04.3', 'A04_3_dead_tree', 'Dead angular tree (7 m tall)', ('y', 7.0, None), 0, None, 0.92, 0.0, {}),
    ('A04.5', 'A04_5_hollow_trunk', 'Fallen hollow trunk (5 m long)', ('x', 5.0, None), 0, None, 0.92, 0.0, {}),
    ('A04.6', 'A04_6_willow_roots', 'Exposed willow root cluster (2.2 m tall)', ('y', 2.2, None), 0, None, 0.92, 0.0, {}),
    ('A06.1', 'A06_1_causeway', 'Fen causeway segment (4 m long)', ('x', 4.0, None), 0, None, 0.92, 0.0, {'walk': 'deck'}),
    ('A06.2', 'A06_2_marker_stone', 'Upright marker stone (2.6 m tall)', ('y', 2.6, None), 0, None, 0.92, 0.0, {}),
    ('A06.3', 'A06_3_stepping_ford', 'Stepping-stone ford (7 m long, seven pieces)', ('z', 7.0, None), 0, None, 0.92, 0.0, {'walk': 'pieces'}),
    ('A06.4', 'A06_4_bog_lure_post', 'Unlit bog-lure post (2.9 m tall)', ('y', 2.9, None), 0, None, 0.88, 0.0, {}),
    ('A06.5', 'A06_5_fen_punt', 'Half-sunk fen punt (3.4 m long)', ('x', 3.4, None), 0, None, 0.9, 0.0, {}),
    ('A06.6', 'A06_6_bridge_pier', 'Broken bridge pier (5 m tall)', ('y', 5.0, None), 0, None, 0.92, 0.0, {}),
    ('A07.1', 'A07_1_drowned_cottage', 'Half-drowned flint cottage (6.2 m tall)', ('y', 6.2, None), 0, None, 0.9, 0.0, {}),
    ('A07.2', 'A07_2_weir', 'Timber-and-stone weir segment (4.2 m long)', ('x', 4.2, None), 0, None, 0.9, 0.0, {}),
    ('A07.3', 'A07_3_gable_wall', 'Gable wall with door arch (5.3 m tall)', ('y', 5.3, None), 0, None, 0.92, 0.0, {'walk': 'through'}),
    ('A07.4', 'A07_4_roof_platform', 'Sunken roof-ridge platform (6 m long)', ('x', 6.0, None), 0, None, 0.9, 0.0, {'walk': 'ridge'}),
    ('A07.5', 'A07_5_plank_raft', 'Pontoon plank raft (3.6 m long)', ('x', 3.6, None), 0, None, 0.9, 0.0, {'walk': 'deck'}),
    ('A07.6', 'A07_6_roost_pole', 'Rook roost pole (6.2 m tall)', ('y', 6.2, None), 0, None, 0.9, 0.0, {}),
    ('A08.2', 'A08_2_drystone_wall', 'Drystone wall module (3.2 m)', ('x', 3.2, None), 0, None, 0.92, 0.0, {}),
    ('A08.2-stile', 'A08_2_squeeze_stile', 'Squeeze stile in a drystone wall (3.2 m)', ('x', 3.2, None), 0, None, 0.92, 0.0, {'walk': 'through'}),
    ('A08.3', 'A08_3_farmhouse', 'Abandoned hillside farmhouse (6.4 m tall)', ('y', 6.4, None), 0, None, 0.9, 0.0, {'walk': 'through'}),
    ('A08.4', 'A08_4_hay_rick', 'Hay rick (3.2 m tall)', ('y', 3.2, None), 0, None, 0.92, 0.0, {}),
    ('A08.5', 'A08_5_field_gate', 'Field gate between stone posts (4.4 m long)', ('x', 4.4, None), 0, None, 0.9, 0.0, {'walk': 'through'}),
    ('A08.6', 'A08_6_poppy_rack', 'Poppy-drying rack (3.6 m wide)', ('x', 3.6, None), 0, None, 0.9, 0.0, {}),
    ('A11.1', 'A11_1_cloister_bay', 'Whitewashed cloister bay (5.4 m long)', ('x', 5.4, None), 0, None, 0.88, 0.0, {'walk': 'through'}),
    ('A11.2', 'A11_2_hospice_bed', 'Hospice bed (2.16 m long)', ('z', 2.16, None), -9.7, None, 0.9, 0.0, {}),
    ('A11.3', 'A11_3_refectory_table', 'Refectory table with bread (4.32 m long)', ('x', 4.32, None), 0, None, 0.88, 0.0, {}),
    ('A11.4', 'A11_4_gate_tower', 'Gate tower (7.2 m tall)', ('y', 7.2, None), 0, None, 0.88, 0.0, {'walk': 'through'}),
    ('A11.5', 'A11_5_kitchen_hearth', 'Kitchen hearth with cauldron (2.88 m tall)', ('y', 2.88, None), 0, None, 0.88, 0.0, {}),
    ('A11.6', 'A11_6_candle_stand', 'Steady candle stand (2.34 m tall)', ('y', 2.34, None), 0, ('column', 0.3, 0.55), 0.85, 0.0, {}),
    ('A13.1', 'A13_1_bed_furrow', 'Sleeping bed furrow (2.7 m long)', ('z', 2.7, None), 0, None, 0.92, 0.0, {}),
    ('A13.2', 'A13_2_canopy_frame', 'Cloth canopy frame (6.3 m long)', ('x', 6.3, None), 0, None, 0.9, 0.0, {'walk': 'around'}),
    ('A13.3', 'A13_3_night_light_jar', 'Pink night-light jar (0.81 m tall)', ('y', 0.81, None), 0, None, 0.6, 0.0, {}),
    ('A13.4', 'A13_4_bell_post', 'Hush bell post (3.6 m tall)', ('y', 3.6, None), -62.7, None, 0.88, 0.0, {}),
    ('A13.5', 'A13_5_root_wall_bay', 'Root-vaulted wall bay (5.4 m wide)', ('x', 5.4, None), 0, None, 0.92, 0.0, {}),
    ('A13.6', 'A13_6_poppy_furrow', 'Poppy furrow (4.32 m long)', ('x', 4.32, None), 0, None, 0.9, 0.0, {}),
    ('A14.1', 'A14_1_crib_frame', 'Bone-rail crib frame (6.3 m long)', ('x', 6.3, None), -11.5, None, 0.88, 0.0, {'walk': 'around'}),
    ('A14.2', 'A14_2_curtain_pair', 'Linen curtain pair (4.32 m wide)', ('x', 4.32, None), 0, None, 0.92, 0.0, {'walk': 'through'}),
    ('A14.3', 'A14_3_milk_night_light', 'Milk-white night-light (2.16 m tall)', ('y', 2.16, None), 0, None, 0.8, 0.0, {}),
    ('A14.4', 'A14_4_bone_mobile', 'Bone mobile on stand (3.24 m tall)', ('y', 3.24, None), 0, None, 0.85, 0.0, {'walk': 'around'}),
    ('A14.5', 'A14_5_quilted_platform', 'Quilted floor platform (5.4 m long)', ('z', 5.4, None), -29.0, None, 0.92, 0.0, {'walk': 'deck'}),
    ('A14.6', 'A14_6_rocker_runners', 'Rocker runner pair (5.4 m long)', ('x', 5.4, None), 0, None, 0.88, 0.0, {}),
    # A21-A25 (rows R23-R33 + R31r): each replaces a layout-only placeholder (N.. id) of the base maps, A21.5 the A17.1 blockout. Keys from
    # MISSING_ENV_CONCEPTS_2.md; not the first-stated dimension where that gives a wrong model: A21.1 on its 2.8 m height (keyed on the 2.4 m width it is
    # 1.8 m tall with a 1.37 m door), A22.2 and A25.6 on their height (their 0.5 / 0.3 m widths would make a 0.98 m post and a 0.42 m lantern), A22.5 on
    # its 1.6 m crook (squared up, its 0.9 m width would make the crook 1.96 m), A23.6 on its 2.2 m height (on the 6 m width its posts stand 3.45 m),
    # A24.2 on its 1.8 m height (2.42 m on the width), A25.2 on its 2.3 m span (on the 1.5 m width it is 3.66 m long and 0.3 m thick).
    # Yaws: A23.3 +43.9 squares the bed the split left on its corner, A25.4 +54 lays the basket's long axis (the handles) along x, A22.5 +38.5 squares
    # the folded coat (still in front of the crook), A22.1 -22 points the toes to +z, A25.5 +12 lines the stool and the can up along x, A25.2 -1.2 runs
    # the planks' long edges along z (from sections: the min-area rectangle follows the rope loop); A21.3, A21.4, A21.6, A23.5, A24.2, A24.5 square up
    # 2-3 deg skews (min-area rectangle). Upright as the split kept them (no level): the thorn, the root fall, the shoes, the cradle, the bedding.
    ('A21.1', 'A21_1_barrow_door', 'Barrow vault door in a flint terrace wall (2.8 m tall)', ('y', 2.8, None), 0, None, 0.92, 0.0, {}),
    ('A21.2', 'A21_2_flint_retaining_wall', 'Flint retaining wall module (4 m)', ('x', 4.0, None), 0, None, 0.92, 0.0, {}),
    ('A21.3', 'A21_3_peat_stack', 'Peat stack (1.6 m long)', ('x', 1.6, None), -2.2, None, 0.92, 0.0, {}),
    ('A21.4', 'A21_4_vigil_chair', 'Vigil chair with a folded blanket (0.6 m wide)', ('x', 0.6, None), 2.5, None, 0.9, 0.0, {}),
    ('A21.5', 'A21_5_leaning_stones', 'The leaning stones, the Act I arch (4.6 m wide; A17.1 v2)', ('x', 4.6, None), 0, None, 0.92, 0.0, {'walk': 'through'}),
    ('A21.6', 'A21_6_bog_grave', 'Bog grave with a ribboned willow stake (2.4 m long)', ('z', 2.4, None), -3.0, None, 0.92, 0.0, {}),
    ('A22.1', 'A22_1_worn_shoes', 'Worn shoes left side by side (0.45 m wide pair)', ('x', 0.45, None), -22.0, None, 0.85, 0.0, {}),
    ('A22.2', 'A22_2_toll_post', "Ferryman's toll post with a coin dish (1.3 m tall)", ('y', 1.3, None), 0, None, 0.9, 0.0, {}),
    ('A22.3', 'A22_3_wicker_cradle', 'Empty wicker cradle (1 m long)', ('x', 1.0, None), 0, None, 0.9, 0.0, {'walk': 'around'}),
    ('A22.4', 'A22_4_harvester_cairn', "Harvester's cairn with a name slate (1.2 m wide)", ('x', 1.2, None), 0, None, 0.92, 0.0, {}),
    ('A22.5', 'A22_5_crook_and_coat', "Shepherd's crook and folded coat (1.6 m crook)", ('y', 1.6, None), 38.5, None, 0.9, 0.0, {}),
    ('A22.6', 'A22_6_straw_doll', 'Straw doll (0.3 m wide)', ('x', 0.3, None), 0, None, 0.92, 0.0, {}),
    ('A23.1', 'A23_1_abandoned_reaping', 'Abandoned reaping: sheaves, scythe, straw hat (2.4 m wide)', ('x', 2.4, None), 0, None, 0.92, 0.0, {}),
    ('A23.2', 'A23_2_ribbon_thorn', 'Ribbon thorn, a lone wind-bent hawthorn (5.5 m tall)', ('y', 5.5, None), 0, None, 0.92, 0.0, {'walk': 'around'}),
    ('A23.3', 'A23_3_garth_flower_bed', 'Square garth flower bed (3.2 m)', ('x', 3.2, None), 43.9, None, 0.88, 0.0, {}),
    ('A23.4', 'A23_4_potted_flowers', 'Potted flowers in a terracotta pot (0.75 m tall)', ('y', 0.75, None), 0, None, 0.85, 0.0, {}),
    ('A23.5', 'A23_5_walled_flower_bed', 'Walled flower bed (4 m long)', ('x', 4.0, None), -2.2, None, 0.88, 0.0, {}),
    ('A23.6', 'A23_6_drying_line', 'Linen drying line (2.2 m tall)', ('y', 2.2, None), 0, None, 0.92, 0.0, {'walk': 'around'}),
    ('A24.1', 'A24_1_kitchen_table', 'Kitchen work table with bowls and bread (2.4 m long)', ('x', 2.4, None), 0, None, 0.88, 0.0, {}),
    ('A24.2', 'A24_2_bread_rack', 'Bread rack with fresh loaves (1.8 m tall)', ('y', 1.8, None), 3.2, None, 0.88, 0.0, {}),
    ('A24.3', 'A24_3_linen_folding_table', 'Linen folding table (2.4 m long)', ('x', 2.4, None), 0, None, 0.9, 0.0, {}),
    ('A24.4', 'A24_4_turned_down_coverlet', 'Turned-down coverlet with a pillow (1.14 m wide)', ('x', 1.14, None), 0, None, 0.92, 0.0, {}),
    ('A24.5', 'A24_5_turned_down_quilt', 'Turned-down quilt (3 m wide)', ('x', 3.0, None), -2.8, None, 0.92, 0.0, {}),
    ('A24.6', 'A24_6_linen_pillow', 'Linen pillow (1.5 m wide)', ('x', 1.5, None), 0, None, 0.92, 0.0, {}),
    ('A25.1', 'A25_1_root_rib_arch', 'Root rib arch (6.5 m wide)', ('x', 6.5, None), 0, None, 0.92, 0.0, {'walk': 'through'}),
    ('A25.2', 'A25_2_plank_crossing', 'Plank crossing (2.3 m long)', ('z', 2.3, None), -1.2, None, 0.88, 0.0, {'walk': 'deck'}),
    ('A25.3', 'A25_3_root_fall', 'Root fall, a collapsed vault (4.6 m wide)', ('x', 4.6, None), 0, None, 0.92, 0.0, {}),
    ('A25.4', 'A25_4_harvest_basket', 'Harvest basket of poppy heads (0.56 m wide)', ('x', 0.56, None), 54.0, None, 0.9, 0.0, {}),
    ('A25.5', 'A25_5_tending_kit', "Poppy Nurse's tending kit (1 m wide)", ('x', 1.0, None), 12.0, None, 0.85, 0.0, {}),
    ('A25.6', 'A25_6_tamsin_lantern', "Tamsin's lantern on a root bracket (1 m tall)", ('y', 1.0, None), 0, None, 0.8, 0.0, {}),
]
# 1024 px maps: props of about 3-4 m or less seen from ~15 m (the longest side after scaling is in the report). The landmarks keep 2048: the cottages
# A01.1 / A07.1, the ossuary tower A02.4, the farmhouse A08.3, the gate tower A11.4, the trees A04.1-A04.3, and the 5-7 m structures (roots, trunk, pier,
# gable wall, roof platform, roost pole, cloister bay, canopy, root bay, crib, curtains, quilted platform, rockers).
TEX_1024 = {'A01.2', 'A01.3', 'A01.4', 'A01.5', 'A01.6', 'A02.1', 'A02.2', 'A02.3', 'A02.5', 'A02.6', 'A03.4', 'A03.5', 'A03.6', 'A06.1', 'A06.2', 'A06.3',
            'A06.4', 'A06.5', 'A07.2', 'A07.5', 'A08.2', 'A08.2-stile', 'A08.4', 'A08.5', 'A08.6', 'A11.2', 'A11.3', 'A11.5', 'A11.6', 'A13.1', 'A13.3',
            'A13.4', 'A13.6', 'A14.3', 'A14.4',
            # A21-A25: all but the vault door, the leaning stones, the thorn, the root arch and the root fall (the 4 m wall module as A01.3)
            'A21.2', 'A21.3', 'A21.4', 'A21.6', 'A22.1', 'A22.2', 'A22.3', 'A22.4', 'A22.5', 'A22.6', 'A23.1', 'A23.3', 'A23.4', 'A23.5', 'A23.6', 'A24.1',
            'A24.2', 'A24.3', 'A24.4', 'A24.5', 'A24.6', 'A25.2', 'A25.4', 'A25.5', 'A25.6'}
CROP = 0.8  # crop the atlas to the UV bounds when they span less than this share of its area
MARGIN = 8  # crop margin in pixels of the finer map
CUT_ABOVE = 0.04  # TRIM: the cut plane sits this far (m) over the top of the crossbar
# TRIM: (asset id, the bar is searched from this fraction of the height up)
TRIM = [('A07.6', 0.7), ('A13.4', 0.6)]
# CUT: (asset id, sample id suffix, label note, boxes (x0, x1, y0, y1, z0, z1) in the prepared frame (real size, pivot bottom centre, front +z))
# A cut drops only faces (by centroid): the vertices stay in the buffer, so a CUT variant keeps the full model's bbox (POSITION min / max), its report
# `dims` and its bounding sphere (e.g. -open causeway: 0.97 m tall, the cut posts' height). Fine with fit 'native'; a fit 'size' on a cut model would
# fit the wrong box (the same holds for the lab's def `cut`, outdoorBuild.cutGeometry).
CUT = [('A02.1', 'open', 'back rail cut out (walk-through passage)', [(-1.08, 0.98, 0.33, 0.70, -1.32, -0.78)]),
       # A06.1: the two end posts stand on the centre line (laid end to end along a dike road: a pair every 4 m in the walk line); cut over the
       # deck top (<= 0.45 m): the stubs left stand <= 0.15 m over the deck floor (as the map def note and the act1-outdoor test say)
       ('A06.1', 'open', 'end posts cut out (the road walks over it)', [(1.50, 1.95, 0.47, 1.20, -0.45, 0.15), (-1.75, -1.40, 0.47, 1.00, -0.25, 0.15)])]
# TINT: asset id -> (desaturate toward the luminance, RGB multipliers), a grade of the base colour (sRGB, before the JPEG). A08.2 (and its stile, the same
# stone): the pale cream lichened tops read near-white, the brightest thing in every Poppy Reach view (ashlar/art-direction/artdirection.md: no clean white but Mercy's
# linen; human work looks worn): greyed and darkened to ~0.7 with a slight green-grey shift. Every other asset's bytes stay as they are.
TINT = {'A08.2': (0.3, (0.68, 0.71, 0.69)), 'A08.2-stile': (0.3, (0.68, 0.71, 0.69))}
# LIFT: asset id -> (faces, fade, ref, gmax, chroma), a lift of a dark band in the base colour (sRGB, before the JPEG) toward the clean tone of the same
# faces. The region = `faces` ('outer_sides': every face whose three corners lie on one vertical side plane of the bbox, within 0.03 m) rasterised into
# the atlas with its height y; its weight is 1 below fade[0] m and eases (smoothstep) to 0 at fade[1] m, and spreads ~2 px (of a 1024 px atlas) past
# the island edges: the soft edge. The clean tone = the median of the region's texels between ref[0] and ref[1] m up. Each texel is scaled by the clean
# luma / its local luma (a 3 px blur inside the region), never below 1 (it only lifts) and at most gmax, then moved `chroma` of the way to the clean
# hue (in full once lifted by 25 %). A23.3 (the Gentle House garth bed, the cloister centrepiece; Mercy things are clean, ashlar/art-direction/artdirection.md §4.2:
# Act I = fresh limewash): its kerb's outer sides fade from the clean cream (~192 / 174 / 156) at 0.4-0.62 m to a grey-brown grime (~120 / 105 / 90)
# under 0.2 m with a brown streak up to 0.42 m (so the full weight reaches 0.4 m; the clean texels over it are left alone by the gain): a black smear
# on the south face at game distance (review a2x F-b; most of it was the normals, see FLAT). The kerb top, the soil and the flowers are
# untouched; the band keeps its texel detail (a gain, not a fill). Every other asset's bytes stay as they are.
LIFT = {'A23.3': ('outer_sides', (0.4, 0.56), (0.44, 0.6), 2.2, 0.6)}
# FLAT: asset id -> faces ('outer_sides', as in LIFT), which get their own vertices (copies: position, uv) with the face normal: hard edges. A23.3: the
# kerb's four outer sides are one quad each whose corners the bed's bottom and the kerb top share, so the averaged corner normals are
# (+-0.19, -0.96, +-0.19) at the foot and (+-0.67, 0.33, +-0.67) at the top: interpolated, the lower half of each side faces the floor and goes black
# under the cloister's high lights, a diagonal streak along each quad's split (review a2x F-b; a flat albedo shows the same band). Their 8 triangles get
# 24 vertices of their own; the rest of the bed (the kerb top keeps its rounded rim shading) is as it was.
FLAT = {'A23.3': 'outer_sides'}
# SQUASH: asset id -> (sx, sy, sz), a non-uniform scale after the uniform one (the key dimension is kept): A11.2, keyed on its 2.16 m length, is 1.71 m wide
# (concept 1.08 m) and reads as a double bed with one sleeper; a plain bed frame, so its width alone is taken to 1.2 m (x 0.7: the texture stretch is small).
SQUASH = {'A11.2': (0.7, 1.0, 1.0)}
# WARP: (asset id, sample id suffix, label note, (kind, *params)), a bent lab variant in the prepared frame (real size, pivot bottom centre):
#   'splay' (k, y0): every connected part moves away from x = 0 (by the sign of its mean x) by k m below y0 and by k (H - y) / (H - y0) above it, 0 at
#     the top H: the stones' feet and lower faces keep their shape (the concept's inner faces rise straight to 2.2 m), the tops still touch.
#     A21.5 at 4.6 m is 1.64 m apart at 0.1 m and 1.76 m at 2.2 m (spec 2.6 m); k 0.5 at y0 2.2 gives 2.64 / 2.72 / 2.72 m at 0.1 / 1 / 2.2 m and
#     5.6 m overall (the plain splay y0 = 0 needs k 0.9: 6.4 m wide, and a plain x stretch x 1.6: 7.4 m with stones 2.3 m thick at the foot;
#     docs/act1-base/act1-a2x-fixes.png).
#   'squeeze_z' (a, w, c): |z| -> a + c (|z| - a) + (1 - c) w sqrt(pi) / 2 erf((|z| - a) / w) past a (slope 1 at a, c far out): A25.1's root feet
#     spread +-2.5 m at the floor (the arch body +-1 m), pulled in to +-0.97 m; nothing within 0.45 m of the arch plane moves.
WARP = [('A21.5', 'wide', 'stones splayed apart: 2.6 m passage up to 2.2 m', ('splay', 0.5, 2.2)),
        ('A25.1', 'slim', 'root feet pulled in to about 1.9 m deep', ('squeeze_z', 0.45, 0.35, 0.12))]


def sample_id(folder):
    return 'act1-' + folder.lower().replace('_', '-')


def tex_size(w, h, longest):
    """Atlas size with the aspect kept: the longest side = longest, both sides a multiple of 4 (block-compressible later)."""
    k = longest / max(w, h)
    return max(4, int(round(w * k / 4)) * 4), max(4, int(round(h * k / 4)) * 4)


def jpeg(img, size, quality):
    """A PIL image that remembers it is a JPEG (trimesh writes it as such), resized to size = (w, h)."""
    b = io.BytesIO()
    img.convert('RGB').resize(size, Image.LANCZOS).save(b, 'JPEG', quality=quality)
    return Image.open(io.BytesIO(b.getvalue()))


def tint(img, desat, mult):
    """A TINT grade of a base colour image (sRGB values): mixed `desat` of the way to its luminance (Rec. 709), then times the RGB multipliers."""
    a = np.asarray(img.convert('RGB'), dtype=np.float32) / 255
    lum = a @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    a = (a + (lum[..., None] - a) * desat) * np.array(mult, np.float32)
    return Image.fromarray(np.clip(np.round(a * 255), 0, 255).astype(np.uint8), 'RGB')


def pick_faces(v, faces, kind):
    """The faces of a LIFT / FLAT region: 'outer_sides' = every face whose three corners lie on one vertical side plane of the bbox (within 0.03 m)."""
    assert kind == 'outer_sides', kind
    lo, hi = v.min(0), v.max(0)
    tri = v[faces]
    pick = np.zeros(len(faces), bool)
    for ax in (0, 2):
        for side in (lo[ax], hi[ax]):
            pick |= (np.abs(tri[:, :, ax] - side) < 0.03).all(axis=1)
    return pick


def flat_faces(v, nrm, uv, faces, kind):
    """A FLAT op: the picked faces get their own vertices (copies of position and uv) with the face normal, turned to the side of the old normals.
    Returns (v, nrm, uv, faces, number of faces)."""
    idx = np.where(pick_faces(v, faces, kind))[0]
    corners = faces[idx].reshape(-1)
    fn = np.cross(v[faces[idx, 1]] - v[faces[idx, 0]], v[faces[idx, 2]] - v[faces[idx, 0]])
    fn /= np.linalg.norm(fn, axis=1, keepdims=True) + 1e-12
    fn *= np.where((fn * nrm[faces[idx]].sum(axis=1)).sum(axis=1) < 0, -1.0, 1.0)[:, None]
    k0 = len(v)
    faces = faces.copy()
    faces[idx] = (k0 + np.arange(len(corners))).reshape(-1, 3)
    return (np.concatenate([v, v[corners]]), np.concatenate([nrm, np.repeat(fn, 3, axis=0)]), np.concatenate([uv, uv[corners]]), faces, len(idx))


def lift_band(img, v, faces, uv, spec):
    """A LIFT (see the table) of a base colour image (sRGB values); v = the prepared vertices, uv = the (cropped) texture coordinates (v up).
    Returns (image, stats for the report)."""
    from scipy import ndimage
    kind, (f0, f1), (r0, r1), gmax, chroma = spec
    pick = pick_faces(v, faces, kind)
    tri = v[faces]
    a = np.asarray(img.convert('RGB'), dtype=np.float32)
    h, w = a.shape[:2]
    height = np.full((h, w), np.nan, np.float32)  # the region's height (m) at each texel centre, NaN outside
    for i in np.where(pick)[0]:
        p = np.asarray(uv[faces[i]], np.float64) * [w, -h] + [0, h]  # texel coordinates (x right, y down)
        x0, y0 = np.maximum(np.floor(p.min(0)).astype(int), 0)
        x1, y1 = np.minimum(np.ceil(p.max(0)).astype(int), [w - 1, h - 1])
        X, Y = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        (ax_, ay_), (bx, by), (cx, cy) = p
        d = (by - cy) * (ax_ - cx) + (cx - bx) * (ay_ - cy)
        if abs(d) < 1e-9:
            continue
        l1 = ((by - cy) * (X - cx) + (cx - bx) * (Y - cy)) / d
        l2 = ((cy - ay_) * (X - cx) + (ax_ - cx) * (Y - cy)) / d
        l3 = 1 - l1 - l2
        inside = (l1 >= -1e-3) & (l2 >= -1e-3) & (l3 >= -1e-3)
        sub = height[y0:y1 + 1, x0:x1 + 1]
        sub[inside] = (l1 * tri[i, 0, 1] + l2 * tri[i, 1, 1] + l3 * tri[i, 2, 1])[inside]
    region = ~np.isnan(height)
    luma = np.array([0.2126, 0.7152, 0.0722], np.float32)
    hgt = np.where(region, height, 0)
    t = np.clip((hgt - f0) / (f1 - f0), 0, 1)
    wgt = np.where(region, 1 - t * t * (3 - 2 * t), 0).astype(np.float32)
    s = w / 1024  # blur and spread in texels of a 1024 px wide atlas
    m = region.astype(np.float32)
    local = ndimage.gaussian_filter(a @ luma * m, 3 * s) / np.maximum(ndimage.gaussian_filter(m, 3 * s), 1e-3)
    clean = np.median(a[region & (height >= r0) & (height <= r1)], axis=0)
    lclean = float(clean @ luma)
    gain = np.where(region, np.clip(lclean / np.maximum(local, 1), 1, gmax), 1).astype(np.float32)
    # the soft edge: the weight and the gain spread past the island edges (no dark rim where the atlas filtering meets the gutter), the inside kept
    r = max(1, int(round(2 * s)))
    wgt = ndimage.gaussian_filter(np.where(region, wgt, ndimage.grey_dilation(wgt, size=(2 * r + 1, 2 * r + 1))), r / 2)
    gain = np.where(region, gain, ndimage.grey_dilation(gain, size=(2 * r + 1, 2 * r + 1)))
    out = a * gain[..., None]
    k = (chroma * np.clip((gain - 1) / 0.25, 0, 1))[..., None]
    out = out + ((out @ luma)[..., None] * (clean / lclean) - out) * k
    out = np.clip(np.round(a + (out - a) * wgt[..., None]), 0, 255)
    band = region & (height < f0)
    stats = {'faces': int(pick.sum()), 'texels': int(region.sum()), 'clean': [round(float(x)) for x in clean],
             'band_luma': [round(float((a @ luma)[band].mean()), 1), round(float((out @ luma)[band].mean()), 1)],
             'band_gain_max': round(float(gain[band].max()), 2)}
    return Image.fromarray(out.astype(np.uint8), 'RGB'), stats


def crop_box(uv, maps):
    """Normalised crop (u0, v0, u1, v1) of the UV bounds plus MARGIN px of the finest map, snapped to the coarsest map's pixel grid; None = keep whole.
    uv is trimesh's (v up): image row = (1 - v) * height."""
    (u0, v0), (u1, v1) = np.clip(uv.min(0), 0, 1), np.clip(uv.max(0), 0, 1)
    if (u1 - u0) * (v1 - v0) >= CROP:
        return None
    fw, fh = max(m.size[0] for m in maps), max(m.size[1] for m in maps)
    cw, ch = min(m.size[0] for m in maps), min(m.size[1] for m in maps)
    u0, u1 = max(0.0, u0 - MARGIN / fw), min(1.0, u1 + MARGIN / fw)
    v0, v1 = max(0.0, v0 - MARGIN / fh), min(1.0, v1 + MARGIN / fh)
    return (np.floor(u0 * cw) / cw, np.floor(v0 * ch) / ch, np.ceil(u1 * cw) / cw, np.ceil(v1 * ch) / ch)


def crop(img, box):
    u0, v0, u1, v1 = box
    w, h = img.size
    return img.crop((int(round(u0 * w)), int(round((1 - v1) * h)), int(round(u1 * w)), int(round((1 - v0) * h))))


# ---------------------------------------------------------------- walking measurements (fit table)

def footprint(mesh, y0, y1, res=0.05, step=0.1):
    """Boolean grid (z rows, x cols) of what the mesh occupies between heights y0 and y1: the cross-sections every `step` m drawn at `res` m,
    closed outlines filled, unioned. Returns (grid, x0, z0)."""
    from scipy import ndimage
    lo, hi = mesh.bounds
    x0, z0 = lo[0] - 2 * res, lo[2] - 2 * res
    nx, nz = int(np.ceil((hi[0] - x0) / res)) + 3, int(np.ceil((hi[2] - z0) / res)) + 3
    occ = np.zeros((nz, nx), bool)
    for y in np.arange(y0, y1 + 1e-6, step):
        if y <= lo[1] + 1e-3 or y >= hi[1] - 1e-3:
            continue
        sec = mesh.section(plane_origin=[0, y, 0], plane_normal=[0, 1, 0])
        if sec is None:
            continue
        im = Image.new('1', (nx, nz), 0)
        dr = ImageDraw.Draw(im)
        for line in sec.discrete:
            pts = [((p[0] - x0) / res, (p[2] - z0) / res) for p in line]
            if len(pts) > 1:
                dr.line(pts, fill=1, width=1)
        occ |= ndimage.binary_fill_holes(np.array(im, bool))
    return occ, x0, z0


def free_runs(blocked, origin, res):
    """Interior free intervals (bounded by blocked cells on both sides) of a 1D blocked mask: [(start m, end m, width m)], widest first."""
    idx = np.flatnonzero(blocked)
    if len(idx) == 0:
        return []
    runs, start = [], None
    for i in range(idx[0], idx[-1] + 1):
        if not blocked[i] and start is None:
            start = i
        elif blocked[i] and start is not None:
            runs.append((origin + start * res, origin + i * res, (i - start) * res))
            start = None
    return sorted(([round(a, 2), round(b, 2), round(w, 2)] for a, b, w in runs), key=lambda r: -r[2])


def blockers(occ, x0, z0, res=0.05, min_area=0.01):
    """Connected parts of a footprint grid: [x0, x1, z0, z1] in m, largest first."""
    from scipy import ndimage
    lab, n = ndimage.label(occ)
    out = []
    for k, sl in enumerate(ndimage.find_objects(lab), 1):
        area = float((lab[sl] == k).sum()) * res * res
        if area < min_area:
            continue
        zs, xs = sl
        out.append((area, [round(x0 + xs.start * res, 2), round(x0 + xs.stop * res, 2), round(z0 + zs.start * res, 2), round(z0 + zs.stop * res, 2)]))
    return [b for _, b in sorted(out, key=lambda t: -t[0])]


def walk_report(mesh, kind, planes):
    """What a swap agent needs to keep the hero's path: blocking parts at walking height (0.15-2.0 m), the clear passage through along z,
    for 'deck' the top height and the lane above it, for 'pieces' each piece's top."""
    res = 0.05
    rec = {}
    occ, x0, z0 = footprint(mesh, 0.15, 2.0)
    rec['blockers'] = blockers(occ, x0, z0)[:12]
    if kind in ('through', 'around'):
        rec['passage_x'] = free_runs(occ.any(axis=0), x0, res)[:3]  # free x-intervals that run through the whole depth (walking along z)
        if kind == 'through' and rec['passage_x']:
            a, b, _ = rec['passage_x'][0]
            cx = (a + b) / 2
            col = mesh.vertices[np.abs(mesh.vertices[:, 0] - cx) < 0.3]
            over = col[col[:, 1] > 1.2]
            rec['passage_clear_h'] = round(float(over[:, 1].min()), 2) if len(over) else None  # lowest point above 1.2 m near the passage centre
        if kind == 'through':  # the widest clear x-interval through the whole depth at the floor, at 1 m and at 2.2 m (the Play grid's height)
            rec['passage_at'] = {}
            for y in (0.1, 1.0, 2.2):
                o, xa, _ = footprint(mesh, y, y, res)
                runs = free_runs(o.any(axis=0), xa, res)
                rec['passage_at'][str(y)] = runs[0] if runs else None
    if kind == 'deck':
        top = planes[0][0] if planes else float(mesh.bounds[1][1])  # the largest up-facing flat area is the walk surface
        rec['deck_y'] = top
        occ2, x2, z2 = footprint(mesh, top + 0.2, top + 2.0)
        rec['lane_z'] = free_runs(occ2.any(axis=1), z2, res)[:2]  # free z-intervals running the whole length along x above the deck
        rec['above_deck'] = blockers(occ2, x2, z2)[:8]
    if kind == 'ridge':
        v = mesh.vertices
        prof = []
        for x in np.arange(np.floor(v[:, 0].min() * 2) / 2, v[:, 0].max(), 0.5):
            s = v[(v[:, 0] >= x) & (v[:, 0] < x + 0.5)]
            if len(s):
                t = s[s[:, 1] >= s[:, 1].max() - 0.05]
                prof.append([round(float(x + 0.25), 2), round(float(s[:, 1].max()), 2), round(float(t[:, 2].mean()), 2)])
        rec['ridge'] = prof  # [x, top y, z of the top] every 0.5 m along x
    if kind == 'pieces':
        from scipy import ndimage
        occ3, x3, z3 = footprint(mesh, 0.03, 0.3, step=0.05)
        lab, n = ndimage.label(occ3)
        pieces = []
        for k, sl in enumerate(ndimage.find_objects(lab), 1):
            if float((lab[sl] == k).sum()) * res * res < 0.02:
                continue
            zs, xs = sl
            bx = (x3 + xs.start * res, x3 + xs.stop * res, z3 + zs.start * res, z3 + zs.stop * res)
            v = mesh.vertices[(mesh.vertices[:, 0] >= bx[0]) & (mesh.vertices[:, 0] <= bx[1]) & (mesh.vertices[:, 2] >= bx[2]) & (mesh.vertices[:, 2] <= bx[3])]
            pieces.append([round((bx[0] + bx[1]) / 2, 2), round((bx[2] + bx[3]) / 2, 2), round(bx[1] - bx[0], 2), round(bx[3] - bx[2], 2),
                           round(float(v[:, 1].max()), 2) if len(v) else None])
        rec['pieces'] = sorted(pieces, key=lambda p: p[1])  # [x, z, size x, size z, top y], along z
    return rec


# ---------------------------------------------------------------- the cross-safe trim

def trim_post(v, faces, bar_from, ring=0.6, bar_len=0.6, step=0.02):
    """Cut height for a post that rises over its crossbar. Sections are scanned down from the post's top: the post's own loop (the one under the top,
    followed down as it leans) is skipped, and the first long loop (an extent of bar_len m or more: the bar or a nest on it, not a rope coil) whose box comes within
    `ring` m of the post's box marks the bar where it meets the post (the roost pole's nests sit ~0.5 m out on short arms). Sections, not vertices:
    a shaft can be long faces with no vertex along it. Returns (bar top y, post box at that height)."""
    import trimesh
    tmp = trimesh.Trimesh(vertices=v, faces=faces, process=False)
    top = v[:, 1].max()
    loops = lambda y: [(p[:, 0].min(), p[:, 0].max(), p[:, 2].min(), p[:, 2].max()) for p in
                       (tmp.section(plane_origin=[0, y, 0], plane_normal=[0, 1, 0]) or trimesh.path.Path3D()).discrete if len(p) > 3]
    post = max(loops(top - 0.03), key=lambda b: (b[1] - b[0]) * (b[3] - b[2]))
    gap = lambda a, b: np.hypot(max(0.0, a[0] - b[1], b[0] - a[1]), max(0.0, a[2] - b[3], b[2] - a[3]))
    for y in np.arange(top - 0.03, bar_from * top, -step):
        ls = loops(y)
        own = [b for b in ls if gap(b, post) < 0.02 and (b[1] - b[0]) < 1.5 * (post[1] - post[0]) + 0.05 and (b[3] - b[2]) < 1.5 * (post[3] - post[2]) + 0.05]
        if own:
            post = max(own, key=lambda b: (b[1] - b[0]) * (b[3] - b[2]))
        if any(b not in own and max(b[1] - b[0], b[3] - b[2]) >= bar_len and gap(b, post) < ring for b in ls):
            return float(y), tuple(float(x) for x in post)
    raise AssertionError('no crossbar found next to the post')


def apply_trim(v, nrm, cut, post, pad=0.06):
    """Flatten everything over the cut plane inside the post's column (its box + pad) onto the plane: the post's own top becomes the lid
    (a closed surface projected down covers its whole cut section); the moved vertices get an up normal."""
    px0, px1, pz0, pz1 = post
    m = (v[:, 1] > cut) & (v[:, 0] > px0 - pad) & (v[:, 0] < px1 + pad) & (v[:, 2] > pz0 - pad) & (v[:, 2] < pz1 + pad)
    v, nrm = v.copy(), nrm.copy()
    v[m, 1] = cut
    nrm[m] = [0.0, 1.0, 0.0]
    return v, nrm, int(m.sum())


# ---------------------------------------------------------------- the WARP bends

def warp(v, nrm, faces, kind, *p):
    """A WARP row's bend of the prepared vertices; normals by the inverse transpose of its Jacobian (renormalised by the caller)."""
    import trimesh
    from scipy.special import erf
    v, nrm = v.copy(), nrm.copy()
    if kind == 'splay':
        k, y0 = p
        side = np.zeros(len(v))
        tmp = trimesh.Trimesh(vertices=v, faces=faces, process=False)
        for comp in trimesh.graph.connected_components(tmp.face_adjacency, nodes=np.arange(len(faces)), min_len=1):
            vi = np.unique(faces[comp])
            side[vi] = np.sign(v[vi, 0].mean())
        top = v[:, 1].max()
        t = (v[:, 1] - y0) / (top - y0)
        f = np.clip(1 - t, 0, 1)
        df = np.where((t > 0) & (t < 1), -1 / (top - y0), 0.0)  # d f / d y
        v[:, 0] += side * k * f
        nrm[:, 1] -= side * k * df * nrm[:, 0]  # x' = x + s k f(y): n' = (nx, ny - s k f'(y) nx, nz)
    elif kind == 'squeeze_z':
        a, w, c = p
        u = np.abs(v[:, 2])
        t = np.clip(u - a, 0, None)
        g = np.where(u <= a, u, a + c * t + (1 - c) * w * np.sqrt(np.pi) / 2 * erf(t / w))
        dg = np.where(u <= a, 1.0, c + (1 - c) * np.exp(-(t / w) ** 2))
        v[:, 2] = np.sign(v[:, 2]) * g
        nrm[:, 2] /= dg  # z' = g(z): n' = (nx, ny, nz / g'(z))
    else:
        raise ValueError(kind)
    return v, nrm


# ---------------------------------------------------------------- one asset

def prep(entry, report, trim=None, cut_out=None, warp_row=None):
    """trim = the TRIM bar_from fraction for the cut variant (sample id <id>-trim), None for the normal model; cut_out = a CUT row (sample id <id>-<suffix>);
    warp_row = a WARP row (sample id <id>-<suffix>)."""
    import trimesh
    aid, folder, label, (kax, kval, band), yaw, level, rough, metal, extra = entry
    src = [f for f in os.listdir(piece_dir(folder)) if f.startswith('act1_kit_v1_') and f.endswith('.glb')]
    assert len(src) == 1, f'{folder}: expected one source GLB, found {src}'
    scene = trimesh.load(os.path.join(piece_dir(folder), src[0]), force='scene')
    assert len(scene.geometry) == 1, f'{folder}: expected one mesh'
    g = list(scene.geometry.values())[0]
    node_t = scene.graph.get(scene.graph.nodes_geometry[0])[0]
    v = trimesh.transform_points(g.vertices, node_t)
    nrm = np.asarray(g.vertex_normals) @ node_t[:3, :3].T
    R = np.eye(3)
    tilt = 0.0
    if level == 'support':
        up = ext.support_up(v)
        tilt = float(np.degrees(np.arccos(np.clip(up[1], -1, 1))))
        R = ext.rot_align(up, np.array([0.0, 1.0, 0.0]))
    R = ext.yaw_matrix(yaw) @ R
    v = v @ R.T
    nrm = nrm @ R.T
    if isinstance(level, tuple) and level[0] == 'column':
        tmp = trimesh.Trimesh(vertices=v, faces=g.faces, process=False)
        y0 = v[:, 1].min()
        hgt = v[:, 1].max() - y0
        c = []
        for f in level[1:]:
            sec = tmp.section(plane_origin=[0, y0 + f * hgt, 0], plane_normal=[0, 1, 0])
            c.append([(sec.vertices[:, 0].min() + sec.vertices[:, 0].max()) / 2, y0 + f * hgt, (sec.vertices[:, 2].min() + sec.vertices[:, 2].max()) / 2])
        kx, kz = (c[1][0] - c[0][0]) / (c[1][1] - c[0][1]), (c[1][2] - c[0][2]) / (c[1][1] - c[0][1])
        tilt = float(np.degrees(np.arctan(np.hypot(kx, kz))))
        v = v - np.outer(v[:, 1] - y0, [kx, 0.0, kz])
        nrm = nrm + np.outer(kx * nrm[:, 0] + kz * nrm[:, 2], [0.0, 1.0, 0.0])  # normals by the inverse transpose of the shear
    nrm /= np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-12
    ax = 'xyz'.index(kax)
    sel = v
    if band:
        h0, h1 = v[:, 1].min(), v[:, 1].max()
        sel = v[(v[:, 1] >= h0 + band[0] * (h1 - h0)) & (v[:, 1] <= h0 + band[1] * (h1 - h0))]
    scale = kval / float(np.ptp(sel[:, ax]))
    v = v * scale
    if aid in SQUASH:
        sq = np.array(SQUASH[aid], dtype=np.float64)
        v = v * sq
        nrm = nrm / sq  # normals by the inverse transpose of the scale
        nrm /= np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-12
    lo, hi = v.min(0), v.max(0)
    v -= np.array([(lo[0] + hi[0]) / 2, lo[1], (lo[2] + hi[2]) / 2])
    cut = None
    if trim:
        cut, post = trim_post(v, g.faces, trim)
        cut += CUT_ABOVE
        v, nrm, moved = apply_trim(v, nrm, cut, post)
        lo, hi = v.min(0), v.max(0)
        v -= np.array([(lo[0] + hi[0]) / 2, 0.0, (lo[2] + hi[2]) / 2])  # re-centre the bbox (the cut post can shift it); the base stays at y = 0
    faces = g.faces
    dropped = 0
    if cut_out:
        c = v[faces].mean(axis=1)
        drop = np.zeros(len(faces), bool)
        for x0, x1, y0, y1, z0, z1 in cut_out[3]:
            drop |= (c[:, 0] > x0) & (c[:, 0] < x1) & (c[:, 1] > y0) & (c[:, 1] < y1) & (c[:, 2] > z0) & (c[:, 2] < z1)
        faces, dropped = faces[~drop], int(drop.sum())
    if warp_row:
        v, nrm = warp(v, nrm, faces, *warp_row[3])
        nrm /= np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-12
        lo, hi = v.min(0), v.max(0)
        v -= np.array([(lo[0] + hi[0]) / 2, lo[1], (lo[2] + hi[2]) / 2])  # re-centre; the bends keep the base at y = 0
    dims = v.max(0) - v.min(0)
    longest = 1024 if aid in TEX_1024 else 2048
    m = g.visual.material
    base, normal = m.baseColorTexture, m.normalTexture
    assert base is not None and normal is not None, f'{folder}: missing base colour or normal map'
    uv = np.asarray(g.visual.uv, dtype=np.float64)
    box = crop_box(uv, [base, normal])
    src_size = [list(base.size), list(normal.size)]
    if box:
        base, normal = crop(base, box), crop(normal, box)
        uv = (uv - [box[0], box[1]]) / [box[2] - box[0], box[3] - box[1]]
    if aid in TINT:
        base = tint(base, *TINT[aid])
    lift = None
    if aid in LIFT:
        base, lift = lift_band(base, v, faces, uv, LIFT[aid])
    flat = 0
    if aid in FLAT:
        v, nrm, uv, faces, flat = flat_faces(v, nrm, uv, faces, FLAT[aid])
    size = tex_size(*base.size, longest)
    sid = sample_id(folder) + ('-trim' if trim else '') + (f'-{cut_out[1]}' if cut_out else '') + (f'-{warp_row[1]}' if warp_row else '')
    mat = trimesh.visual.material.PBRMaterial(name=sid, baseColorTexture=jpeg(base, size, 86), normalTexture=jpeg(normal, size, 90),
                                              roughnessFactor=rough, metallicFactor=metal)
    out = trimesh.Trimesh(vertices=v, faces=faces, vertex_normals=nrm, visual=trimesh.visual.TextureVisuals(uv=uv, material=mat), process=False)
    data = trimesh.Scene({sid: out}).export(file_type='glb')
    path = os.path.join(OUT, f'{sid}.glb')
    same = os.path.exists(path) and os.path.getsize(path) == len(data) and open(path, 'rb').read() == data
    if not same:
        ext.retry(lambda: open(path, 'wb').write(data))
    rec = {'id': aid, 'sample': sid, 'folder': folder, 'label': label, 'tex': list(size), 'src_tex': src_size, 'crop': [round(float(x), 4) for x in box] if box else None,
           'tris': int(len(out.faces)), 'bytes': len(data), 'dims': [round(float(x), 3) for x in dims], 'key': [kax, kval, band], 'scale': round(scale, 4),
           'yaw': yaw, 'tilt_fixed': round(tilt, 2), 'rough': rough, 'metal': metal, 'written': not same}
    rec['up_planes'] = ext.up_planes(out)
    rec['lights'] = ext.light_spots(out, uv, mat.baseColorTexture, float(dims.max()))
    low = v[v[:, 1] <= 0.3 * dims[1]]
    rec['foot_centre'] = [round(float((low[:, 0].min() + low[:, 0].max()) / 2), 2), round(float((low[:, 2].min() + low[:, 2].max()) / 2), 2)]
    if trim:
        rec['trim'] = {'cut_y': round(cut, 3), 'post': [round(x, 3) for x in post], 'flattened_vertices': moved, 'full_height': None}
    if cut_out:
        rec['cut_out'] = {'suffix': cut_out[1], 'boxes': cut_out[3], 'dropped_faces': dropped}
    if warp_row:
        rec['warp'] = {'suffix': warp_row[1], 'kind': warp_row[3][0], 'params': list(warp_row[3][1:])}
    if aid in TINT:
        rec['tint'] = {'desaturate': TINT[aid][0], 'multiply': list(TINT[aid][1])}
    if lift:
        rec['lift'] = lift
    if flat:
        rec['flat'] = {'faces': FLAT[aid], 'count': flat}
    if aid in SQUASH:
        rec['squash'] = list(SQUASH[aid])
    if extra.get('walk') and not trim and not cut_out:
        rec['walk'] = walk_report(out, extra['walk'], rec['up_planes'])
    report.append(rec)
    print(f"  {sid}.glb: {rec['tris']} tris, {dims[0]:.2f} x {dims[1]:.2f} x {dims[2]:.2f} m (w x h x d), key {kax} {kval} m, yaw {yaw}, "
          f"{'level %.1f deg, ' % tilt if level else ''}{size[0]}x{size[1]} px{' (cropped)' if box else ''}, {len(data) / 1e6:.2f} MB"
          f"{'' if not same else ' (unchanged)'}{', cut at %.2f m' % cut if trim else ''}{', %d faces cut out' % dropped if cut_out else ''}"
          f"{', %s %s' % warp_row[3][:2] if warp_row else ''}")
    if lift:
        print(f"    lift {LIFT[aid][0]}: {lift['faces']} faces, {lift['texels']} texels, clean {lift['clean']}, band luma {lift['band_luma'][0]} -> "
              f"{lift['band_luma'][1]} (gain <= {lift['band_gain_max']})")
    if flat:
        print(f"    flat {FLAT[aid]}: {flat} faces on vertices of their own (face normals)")


def license_note(entries):
    """One marker-delimited paragraph (TAG) naming every entry, after the act1 static monsters' paragraph (else the extras', else before the closing
    note); every other byte of THIRD_PARTY_LICENSES.md stays as it is, and the file is not rewritten when the text is unchanged."""
    path = os.path.join(ROOT, 'THIRD_PARTY_LICENSES.md')
    a, b = f'<!-- {TAG}:start -->', f'<!-- {TAG}:end -->'
    para = a + '\n' + LICENSE.format(names=', '.join(e[1] for e in entries)) + '\n' + b

    def write():
        old = open(path, encoding='utf-8', newline='').read()
        nl = '\r\n' if '\r\n' in old else '\n'
        p = para.replace('\n', nl)
        if a in old:
            head, rest = old.split(a, 1)
            text = head + p + rest.split(b, 1)[1]
        else:
            after = next((m for m in ('<!-- act1-monsters-static-v1:end -->', '<!-- act1-extras-v1:end -->') if m in old), None)
            anchor = 'The same credits are shown in the app'
            if after:
                text = old.replace(after, after + nl + nl + p, 1)
            elif anchor in old:
                text = old.replace(anchor, p + nl + nl + anchor, 1)
            else:
                text = old.rstrip() + nl + nl + p + nl
        if text != old:
            with open(path, 'w', encoding='utf-8', newline='') as f:
                f.write(text)
            print('THIRD_PARTY_LICENSES.md: act1-kit-v1 paragraph written')
    ext.retry(write)


def entry_tuple(e, trim=False, cut_out=None, warp_row=None):
    aid, folder, label = e[:3]
    sid = sample_id(folder) + ('-trim' if trim else '') + (f'-{cut_out[1]}' if cut_out else '') + (f'-{warp_row[1]}' if warp_row else '')
    return (sid, f'{aid} {label}{" · post cut over the bar" if trim else ""}{f" · {cut_out[2]}" if cut_out else ""}{f" · {warp_row[2]}" if warp_row else ""}'
            ' · Tripo row prop (GLB, real size, pivot bottom centre) · Act I kit', f'act1-kit/{sid}.glb', piece_rel(folder), CREDIT)


def main():
    args = sys.argv[1:]
    opt = lambda name, default: (args.pop(args.index(name) + 1), args.remove(name))[0] if name in args else default
    only = opt('--only', '')
    report_path = opt('--report', '')
    no_register = '--no-register' in args
    pick = lambda aid: not only or aid in only.split(',')
    os.makedirs(OUT, exist_ok=True)
    report = []
    trims = {aid: rest for aid, *rest in TRIM}
    cuts = {c[0]: c for c in CUT}
    warps = {w[0]: w for w in WARP}
    for e in ASSETS:
        if pick(e[0]):
            prep(e, report)
            if e[0] in trims:
                prep(e, report, trim=trims[e[0]][0])
            if e[0] in cuts:
                prep(e, report, cut_out=cuts[e[0]])
            if e[0] in warps:
                prep(e, report, warp_row=warps[e[0]])
    full = {r['id']: r['dims'][1] for r in report if 'trim' not in r and 'cut_out' not in r and 'warp' not in r}
    for r in report:
        if 'trim' in r:
            r['trim']['full_height'] = full.get(r['id'])
    if report_path:
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=1, ensure_ascii=False)
    if not no_register:
        # always the full list, in table order (each trim, cut or warp variant right after its model), for the files that exist
        entries = []
        for e in ASSETS:
            for t in ([False, True] if e[0] in trims else [False]):
                x = entry_tuple(e, t)
                if os.path.exists(os.path.join(OUT, f'{x[0]}.glb')):
                    entries.append(x)
            if e[0] in cuts:
                x = entry_tuple(e, cut_out=cuts[e[0]])
                if os.path.exists(os.path.join(OUT, f'{x[0]}.glb')):
                    entries.append(x)
            if e[0] in warps:
                x = entry_tuple(e, warp_row=warps[e[0]])
                if os.path.exists(os.path.join(OUT, f'{x[0]}.glb')):
                    entries.append(x)
        ext.ANCHOR = ANCHOR  # register() inserts a new block after its module's ANCHOR line
        ext.register(entries)
        license_note(entries)
    small = [r['sample'] for r in report if max(r['tex']) == 1024]
    print(f'1024 px maps ({len(small)}): ' + ', '.join(small))
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(f'assets/act1-kit: {len(os.listdir(OUT))} files, {total / 1048576:.1f} MB')


if __name__ == '__main__':
    main()
