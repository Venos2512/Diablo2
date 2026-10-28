# Transform verification: optimized GLB -> lab GLB

`fromOptimized` (column-major, three.js Matrix4 order) carries a vertex of the optimized GLB (as loaded, node transforms applied) into the lab GLB frame. It is derived from the
scripts that built the lab GLBs (`prepare-act1-kit.py`, `prepare-act1-extras.py`, `prepare-terrain-biomes-v1.py` with `--transforms-only`); legacy kit pieces are the identity.

Check (verify-transforms.py): the optimized mesh (vertices + 4000 surface samples) is pushed through the matrix and measured against the lab mesh surface (30000 samples + vertices).
Numbers are percent of the lab bbox diagonal. `bbox` = largest difference of the 6 bbox numbers; `p50` / `p90` = median / 90th percentile nearest distance;
`frame` = the same optimized GLB against the raw source GLB with NO matrix (bbox / p50): it shows the optimizer deviation (decimation, small parts removed) and proves the optimized GLB is in the source frame.
A bbox is a weak test (a rotated, decimated mesh loses its extreme corners), so the points decide.
PASS = (for exact matrices) the INDEX-WISE check: the raw source GLB vertices (node applied) pushed through the matrix land on the lab GLB vertices by vertex index with error < 1e-5 of the lab diagonal (column `exact err`); AND the point test: p50 <= 1.2 %, p90 <= 4 %, bbox excess over the optimizer shrink (frame bbox) <= 8 %, and no wrong turn (90/180/270 deg about the bbox centre) fits better than the matrix. The wrong-turn gate always applies; `sym` only marks shapes where a wrong turn fits within 1.5 x (informational: the index-wise check proves the orientation exactly).
APPROX rows are the non-affine / partial variants (cut, trim, warp): they use the matrix of the base model, the numbers are shown but they are not counted as PASS (a warp moves the surface by design).

Assets: 154. Exact: 148 PASS, 0 FAIL. Approx variants: 6. Near-symmetric shapes (a wrong turn within 1.5 x, orientation proven by the index-wise check): 5.

| asset | family | optimized id | bbox % | p50 % | p90 % | best wrong turn p50 % | frame (opt vs source) bbox / p50 % | exact err (index-wise) | sym | status |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | ---: | --- | --- |
| dungeon-prop-sarcophagus | props | sarcophagus | 0.00 | 0.37 | 0.75 | 0.53 | 0.00 / 0.37 | 2.0e-8 | sym | PASS |
| dungeon-prop-bone-pile | props | bone_pile | 0.60 | 0.34 | 0.78 | 1.50 | 0.60 / 0.34 | 1.5e-8 |  | PASS |
| dungeon-prop-broken-column | props | broken_column | 0.07 | 0.24 | 0.48 | 1.51 | 0.07 / 0.24 | 2.3e-8 |  | PASS |
| dungeon-prop-candle-cluster | props | candle_cluster | 1.98 | 0.35 | 0.69 | 0.85 | 1.98 / 0.35 | 1.8e-8 |  | PASS |
| dungeon-prop-fallen-bell | props | fallen_bell | 0.32 | 0.29 | 0.54 | 4.46 | 0.32 / 0.29 | 1.1e-8 |  | PASS |
| dungeon-prop-crypt-wall | props | crypt_wall | 0.34 | 0.26 | 0.56 | 0.67 | 0.34 / 0.26 | 0.0e+0 |  | PASS |
| dungeon-prop-stalagmites | props | stalagmites | 0.47 | 0.27 | 0.51 | 2.14 | 0.47 / 0.27 | 1.8e-8 |  | PASS |
| dungeon-prop-mine-timber | props | mine_timber | 0.18 | 0.23 | 0.44 | 0.54 | 0.18 / 0.23 | 3.0e-8 |  | PASS |
| dungeon-prop-flint-boulders | props | flint_boulders | 0.23 | 0.31 | 0.58 | 3.41 | 0.23 / 0.31 | 0.0e+0 |  | PASS |
| act1-a15-1-flint-church | act1-extras | A15_1_flint_church | 0.83 | 0.31 | 0.64 | 0.82 | 0.83 / 0.31 | 2.2e-8 |  | PASS |
| act1-a15-2-forge | act1-extras | A15_2_forge | 0.64 | 0.34 | 0.69 | 2.42 | 0.21 / 0.34 | 1.6e-8 |  | PASS |
| act1-a15-3-name-board | act1-extras | A15_3_name_board | 0.31 | 0.24 | 0.57 | 0.89 | 0.31 / 0.24 | 3.2e-8 |  | PASS |
| act1-a15-4-bell-frame | act1-extras | A15_4_bell_frame | 0.58 | 0.30 | 0.62 | 1.29 | 0.68 / 0.30 | 2.4e-8 |  | PASS |
| act1-a15-5-grave-goods-stall | act1-extras | A15_5_grave_goods_stall | 1.25 | 0.27 | 0.60 | 2.64 | 1.25 / 0.27 | 2.4e-8 |  | PASS |
| act1-a15-6-watch-post | act1-extras | A15_6_watch_post | 0.35 | 0.32 | 0.69 | 2.75 | 0.35 / 0.32 | 2.0e-8 |  | PASS |
| act1-a16-1-yew | act1-extras | A16_1_yew | 0.51 | 0.43 | 0.94 | 1.36 | 0.51 / 0.43 | 3.0e-8 |  | PASS |
| act1-a16-2-gibbet | act1-extras | A16_2_gibbet | 1.71 | 0.21 | 0.46 | 3.77 | 1.71 / 0.21 | 3.4e-8 |  | PASS |
| act1-a16-3-jar-candle-grave | act1-extras | A16_3_jar_candle_grave | 0.37 | 0.26 | 0.55 | 1.91 | 0.34 / 0.24 | 1.9e-8 |  | PASS |
| act1-a16-4-fresh-grave | act1-extras | A16_4_fresh_grave | 2.84 | 0.23 | 0.48 | 1.97 | 2.84 / 0.23 | 1.9e-8 |  | PASS |
| act1-a16-5-unquiet-grave | act1-extras | A16_5_unquiet_grave | 3.53 | 0.25 | 0.55 | 1.85 | 3.53 / 0.25 | 1.6e-8 |  | PASS |
| act1-a16-6-sexton-lamp | act1-extras | A16_6_sexton_lamp | 0.08 | 0.20 | 0.39 | 7.40 | 0.08 / 0.20 | 3.9e-8 |  | PASS |
| act1-a17-1-leaning-stones | act1-extras | A17_1_leaning_stones | 0.25 | 0.29 | 0.72 | 0.86 | 0.25 / 0.29 | 2.5e-8 |  | PASS |
| act1-a17-2-drowned-bell-tower | act1-extras | A17_2_drowned_bell_tower | 6.46 | 0.32 | 0.67 | 1.17 | 6.46 / 0.32 | 3.5e-8 |  | PASS |
| act1-a17-3-gentle-boat | act1-extras | A17_3_gentle_boat | 1.42 | 0.26 | 0.52 | 0.64 | 1.42 / 0.26 | 1.5e-8 |  | PASS |
| act1-a17-4-flooded-supper-table | act1-extras | A17_4_flooded_supper_table | 0.34 | 0.33 | 0.66 | 0.94 | 0.34 / 0.33 | 1.9e-8 |  | PASS |
| act1-a17-5-flooded-lace-window | act1-extras | A17_5_flooded_lace_window | 0.38 | 0.33 | 0.65 | 5.85 | 0.38 / 0.33 | 3.5e-8 |  | PASS |
| act1-a17-6-gentle-dock | act1-extras | A17_6_gentle_dock | 1.71 | 0.25 | 0.48 | 0.80 | 1.71 / 0.25 | 1.6e-8 |  | PASS |
| act1-a18-1-ox-cart | act1-extras | A18_1_ox_cart | 1.33 | 0.29 | 0.64 | 5.16 | 1.33 / 0.29 | 1.2e-8 |  | PASS |
| act1-a18-2-bed-clean-pillow | act1-extras | A18_2_bed_clean_pillow | 0.72 | 0.37 | 0.70 | 1.28 | 0.72 / 0.37 | 1.1e-8 |  | PASS |
| act1-a18-3-delvings-mouth | act1-extras | A18_3_delvings_mouth | 1.63 | 0.36 | 0.85 | 1.95 | 1.63 / 0.36 | 1.9e-8 |  | PASS |
| act1-a18-4-hospice-range | act1-extras | A18_4_hospice_range | 0.55 | 0.24 | 0.48 | 0.32 | 0.55 / 0.24 | 1.4e-8 | sym | PASS |
| act1-a18-5-hospice-wall-niche | act1-extras | A18_5_hospice_wall_niche | 0.04 | 0.24 | 0.53 | 0.97 | 0.04 / 0.24 | 1.8e-8 |  | PASS |
| act1-a18-6-hilltop-steps | act1-extras | A18_6_hilltop_steps | 0.29 | 0.31 | 0.59 | 2.90 | 0.29 / 0.31 | 1.9e-8 |  | PASS |
| act1-a19-1-vase-flowers | act1-extras | A19_1_vase_flowers | 0.43 | 0.31 | 0.64 | 0.72 | 0.43 / 0.31 | 2.2e-8 |  | PASS |
| act1-a19-2-poppy-tea-tray | act1-extras | A19_2_poppy_tea_tray | 0.82 | 0.36 | 0.74 | 0.72 | 0.82 / 0.36 | 1.2e-8 |  | PASS |
| act1-a19-3-window-chair | act1-extras | A19_3_window_chair | 0.05 | 0.32 | 0.61 | 3.68 | 0.00 / 0.32 | 3.2e-8 |  | PASS |
| act1-a19-4-linen-press | act1-extras | A19_4_linen_press | 0.22 | 0.40 | 0.85 | 1.50 | 0.22 / 0.40 | 2.4e-8 |  | PASS |
| act1-a19-5-linen-screen | act1-extras | A19_5_linen_screen | 0.14 | 0.26 | 0.56 | 1.08 | 0.14 / 0.26 | 2.1e-8 |  | PASS |
| act1-a19-6-tall-ward-window | act1-extras | A19_6_tall_ward_window | 0.12 | 0.27 | 0.54 | 0.60 | 0.12 / 0.27 | 2.9e-8 |  | PASS |
| act1-a20-1-sleeper-young-woman | act1-extras | A20_1_sleeper_young_woman | 1.07 | 0.26 | 0.53 | 0.84 | 1.07 / 0.26 | 2.3e-8 |  | PASS |
| act1-a20-2-sleeper-old-man | act1-extras | A20_2_sleeper_old_man | 0.64 | 0.31 | 0.68 | 2.56 | 0.54 / 0.31 | 2.2e-8 |  | PASS |
| act1-a20-3-sleeper-fisherman | act1-extras | A20_3_sleeper_fisherman | 7.46 | 0.29 | 0.62 | 1.28 | 6.01 / 0.29 | 2.2e-8 |  | PASS |
| act1-a20-4-sleeper-farm-woman | act1-extras | A20_4_sleeper_farm_woman | 1.22 | 0.25 | 0.52 | 1.04 | 1.32 / 0.25 | 2.2e-8 |  | PASS |
| act1-a20-5-irrigation-channel | act1-extras | A20_5_irrigation_channel | 1.44 | 0.29 | 0.57 | 1.40 | 1.44 / 0.29 | 1.6e-8 |  | PASS |
| act1-a20-6-harvest-table | act1-extras | A20_6_harvest_table | 0.28 | 0.27 | 0.68 | 1.46 | 0.28 / 0.27 | 3.2e-8 |  | PASS |
| act1-a01-1-stilt-cottage | act1-kit | A01_1_stilt_cottage | 0.14 | 0.24 | 0.58 | 2.59 | 0.14 / 0.24 | 2.6e-8 |  | PASS |
| act1-a01-2-walkway | act1-kit | A01_2_walkway | 0.78 | 0.34 | 0.69 | 0.76 | 0.78 / 0.34 | 0.0e+0 |  | PASS |
| act1-a01-3-flint-wall | act1-kit | A01_3_flint_wall | 0.26 | 0.23 | 0.54 | 0.89 | 0.26 / 0.23 | 1.6e-8 |  | PASS |
| act1-a01-4-hurdle-fence | act1-kit | A01_4_hurdle_fence | 0.39 | 0.28 | 0.58 | 0.44 | 0.39 / 0.28 | 1.3e-8 |  | PASS |
| act1-a01-5-village-well | act1-kit | A01_5_village_well | 0.85 | 0.17 | 0.73 | 1.27 | 0.85 / 0.17 | 2.4e-8 |  | PASS |
| act1-a01-6-eel-trap-rack | act1-kit | A01_6_eel_trap_rack | 0.27 | 0.22 | 0.54 | 2.93 | 0.27 / 0.22 | 2.0e-8 |  | PASS |
| act1-a02-1-lychgate | act1-kit | A02_1_lychgate | 0.67 | 0.34 | 0.70 | 0.82 | 0.67 / 0.34 | 1.9e-8 |  | PASS |
| act1-a02-1-lychgate-open | act1-kit | A02_1_lychgate | 0.67 | 0.34 | 0.69 | 0.83 | 0.67 / 0.34 | 1.9e-8 |  | APPROX (PASS) |
| act1-a02-2-mortsafe | act1-kit | A02_2_mortsafe | 3.19 | 0.27 | 0.72 | 0.65 | 1.12 / 0.26 | 1.8e-8 |  | PASS |
| act1-a02-3-headstones | act1-kit | A02_3_headstones | 3.20 | 0.00 | 0.38 | 2.42 | 3.20 / 0.00 | 1.5e-8 |  | PASS |
| act1-a02-4-ossuary-tower | act1-kit | A02_4_ossuary_tower | 0.17 | 0.30 | 0.60 | 1.63 | 0.17 / 0.30 | 1.9e-8 |  | PASS |
| act1-a02-5-saint-statue-arch | act1-kit | A02_5_saint_statue_arch | 0.60 | 0.35 | 0.61 | 0.78 | 0.60 / 0.35 | 4.4e-8 |  | PASS |
| act1-a02-6-hand-cart | act1-kit | A02_6_hand_cart | 1.73 | 0.34 | 0.74 | 2.69 | 1.73 / 0.34 | 1.2e-8 |  | PASS |
| act1-a03-4-moss-rock | act1-kit | A03_4_moss_rock | 0.00 | 0.25 | 0.46 | 2.73 | 0.00 / 0.25 | 1.3e-8 |  | PASS |
| act1-a03-5-peat-bank | act1-kit | A03_5_peat_bank | 0.27 | 0.16 | 0.43 | 1.29 | 0.27 / 0.16 | 1.6e-8 |  | PASS |
| act1-a03-6-root-stump | act1-kit | A03_6_root_stump | 0.15 | 0.31 | 0.62 | 1.45 | 0.15 / 0.31 | 1.6e-8 |  | PASS |
| act1-a04-1-old-willow | act1-kit | A04_1_old_willow | 0.45 | 0.33 | 0.85 | 2.06 | 0.45 / 0.33 | 2.2e-8 |  | PASS |
| act1-a04-2-young-willow | act1-kit | A04_2_young_willow | 0.70 | 0.48 | 1.11 | 1.75 | 0.70 / 0.48 | 2.5e-8 |  | PASS |
| act1-a04-3-dead-tree | act1-kit | A04_3_dead_tree | 1.33 | 0.22 | 0.44 | 1.88 | 1.33 / 0.22 | 2.6e-8 |  | PASS |
| act1-a04-5-hollow-trunk | act1-kit | A04_5_hollow_trunk | 0.07 | 0.18 | 0.38 | 2.35 | 0.07 / 0.18 | 2.1e-8 |  | PASS |
| act1-a04-6-willow-roots | act1-kit | A04_6_willow_roots | 2.71 | 0.24 | 0.51 | 2.31 | 2.71 / 0.24 | 1.6e-8 |  | PASS |
| act1-a06-1-causeway | act1-kit | A06_1_causeway | 2.56 | 0.09 | 0.36 | 0.87 | 2.56 / 0.09 | 0.0e+0 |  | PASS |
| act1-a06-1-causeway-open | act1-kit | A06_1_causeway | 2.56 | 0.09 | 0.35 | 0.78 | 2.56 / 0.09 | 0.0e+0 |  | APPROX (PASS) |
| act1-a06-2-marker-stone | act1-kit | A06_2_marker_stone | 0.00 | 0.30 | 0.57 | 2.92 | 0.00 / 0.30 | 2.9e-8 |  | PASS |
| act1-a06-3-stepping-ford | act1-kit | A06_3_stepping_ford | 0.18 | 0.18 | 0.35 | 2.75 | 0.18 / 0.18 | 1.5e-8 |  | PASS |
| act1-a06-4-bog-lure-post | act1-kit | A06_4_bog_lure_post | 0.33 | 0.14 | 0.33 | 6.45 | 0.33 / 0.14 | 3.3e-8 |  | PASS |
| act1-a06-5-fen-punt | act1-kit | A06_5_fen_punt | 0.40 | 0.30 | 0.51 | 0.57 | 0.40 / 0.30 | 1.7e-8 |  | PASS |
| act1-a06-6-bridge-pier | act1-kit | A06_6_bridge_pier | 9.43 | 0.27 | 3.08 | 1.85 | 9.43 / 0.27 | 2.6e-8 |  | PASS |
| act1-a07-1-drowned-cottage | act1-kit | A07_1_drowned_cottage | 0.71 | 0.27 | 0.63 | 1.20 | 0.71 / 0.27 | 2.0e-8 |  | PASS |
| act1-a07-2-weir | act1-kit | A07_2_weir | 0.29 | 0.37 | 0.88 | 0.59 | 0.29 / 0.37 | 2.7e-8 |  | PASS |
| act1-a07-3-gable-wall | act1-kit | A07_3_gable_wall | 0.68 | 0.39 | 0.96 | 0.73 | 0.68 / 0.39 | 2.7e-8 |  | PASS |
| act1-a07-4-roof-platform | act1-kit | A07_4_roof_platform | 0.95 | 0.27 | 0.60 | 1.48 | 0.95 / 0.27 | 1.5e-8 |  | PASS |
| act1-a07-5-plank-raft | act1-kit | A07_5_plank_raft | 1.15 | 0.32 | 0.67 | 1.21 | 1.15 / 0.32 | 1.4e-8 |  | PASS |
| act1-a07-6-roost-pole | act1-kit | A07_6_roost_pole | 4.40 | 0.16 | 0.36 | 5.07 | 4.40 / 0.16 | 3.0e-8 |  | PASS |
| act1-a07-6-roost-pole-trim | act1-kit | A07_6_roost_pole | 4.54 | 0.17 | 0.38 | 5.24 | 4.40 / 0.16 | 6.6e-2 |  | APPROX (PASS) |
| act1-a08-2-drystone-wall | act1-kit | A08_2_drystone_wall | 0.15 | 0.34 | 0.73 | 0.73 | 0.15 / 0.34 | 1.4e-8 |  | PASS |
| act1-a08-2-squeeze-stile | act1-kit | A08_2_squeeze_stile | 0.84 | 0.33 | 0.72 | 1.07 | 0.84 / 0.33 | 1.4e-8 |  | PASS |
| act1-a08-3-farmhouse | act1-kit | A08_3_farmhouse | 0.26 | 0.27 | 0.65 | 1.32 | 0.26 / 0.27 | 1.9e-8 |  | PASS |
| act1-a08-4-hay-rick | act1-kit | A08_4_hay_rick | 4.08 | 0.44 | 0.97 | 0.93 | 4.08 / 0.44 | 2.1e-8 |  | PASS |
| act1-a08-5-field-gate | act1-kit | A08_5_field_gate | 0.86 | 0.29 | 0.60 | 1.40 | 0.86 / 0.29 | 2.4e-8 |  | PASS |
| act1-a08-6-poppy-rack | act1-kit | A08_6_poppy_rack | 0.00 | 0.24 | 0.52 | 3.21 | 0.00 / 0.24 | 2.4e-8 |  | PASS |
| act1-a11-1-cloister-bay | act1-kit | A11_1_cloister_bay | 6.60 | 0.33 | 1.02 | 1.69 | 6.60 / 0.33 | 1.7e-8 |  | PASS |
| act1-a11-2-hospice-bed | act1-kit | A11_2_hospice_bed | 0.52 | 0.45 | 0.72 | 0.79 | 0.35 / 0.41 | 2.2e-8 |  | PASS |
| act1-a11-3-refectory-table | act1-kit | A11_3_refectory_table | 3.81 | 0.26 | 0.54 | 1.01 | 3.81 / 0.26 | 2.2e-8 |  | PASS |
| act1-a11-4-gate-tower | act1-kit | A11_4_gate_tower | 0.74 | 0.11 | 1.28 | 0.70 | 0.74 / 0.11 | 2.3e-8 |  | PASS |
| act1-a11-5-kitchen-hearth | act1-kit | A11_5_kitchen_hearth | 0.08 | 0.20 | 0.69 | 1.20 | 0.08 / 0.20 | 2.7e-8 |  | PASS |
| act1-a11-6-candle-stand | act1-kit | A11_6_candle_stand | 0.27 | 0.20 | 0.36 | 0.59 | 0.11 / 0.20 | 4.8e-8 |  | PASS |
| act1-a13-1-bed-furrow | act1-kit | A13_1_bed_furrow | 0.15 | 0.32 | 0.58 | 0.69 | 0.15 / 0.32 | 2.0e-8 |  | PASS |
| act1-a13-2-canopy-frame | act1-kit | A13_2_canopy_frame | 0.55 | 0.25 | 0.50 | 1.30 | 0.55 / 0.25 | 2.4e-8 |  | PASS |
| act1-a13-3-night-light-jar | act1-kit | A13_3_night_light_jar | 0.98 | 0.48 | 0.87 | 0.74 | 0.98 / 0.48 | 2.3e-8 |  | PASS |
| act1-a13-4-bell-post | act1-kit | A13_4_bell_post | 0.19 | 0.17 | 0.37 | 4.30 | 0.20 / 0.17 | 2.5e-8 |  | PASS |
| act1-a13-4-bell-post-trim | act1-kit | A13_4_bell_post | 2.58 | 0.18 | 0.40 | 4.45 | 0.20 / 0.17 | 4.9e-2 |  | APPROX (PASS) |
| act1-a13-5-root-wall-bay | act1-kit | A13_5_root_wall_bay | 0.59 | 0.23 | 0.69 | 1.81 | 0.59 / 0.23 | 1.7e-8 |  | PASS |
| act1-a13-6-poppy-furrow | act1-kit | A13_6_poppy_furrow | 1.06 | 0.21 | 0.51 | 1.59 | 1.06 / 0.21 | 2.4e-8 |  | PASS |
| act1-a14-1-crib-frame | act1-kit | A14_1_crib_frame | 0.16 | 0.26 | 0.62 | 0.89 | 0.16 / 0.24 | 1.4e-8 |  | PASS |
| act1-a14-2-curtain-pair | act1-kit | A14_2_curtain_pair | 0.24 | 0.29 | 0.54 | 1.72 | 0.24 / 0.29 | 3.5e-8 |  | PASS |
| act1-a14-3-milk-night-light | act1-kit | A14_3_milk_night_light | 0.49 | 0.39 | 0.71 | 0.48 | 0.49 / 0.39 | 5.0e-8 | sym | PASS |
| act1-a14-4-bone-mobile | act1-kit | A14_4_bone_mobile | 0.20 | 0.09 | 0.31 | 3.51 | 0.20 / 0.09 | 2.9e-8 |  | PASS |
| act1-a14-5-quilted-platform | act1-kit | A14_5_quilted_platform | 0.18 | 0.39 | 0.73 | 0.54 | 0.18 / 0.29 | 1.6e-8 | sym | PASS |
| act1-a14-6-rocker-runners | act1-kit | A14_6_rocker_runners | 0.36 | 0.34 | 0.53 | 1.07 | 0.36 / 0.34 | 1.7e-8 |  | PASS |
| act1-a21-1-barrow-door | act1-kit | A21_1_barrow_door | 0.10 | 0.33 | 0.63 | 1.97 | 0.10 / 0.33 | 2.5e-8 |  | PASS |
| act1-a21-2-flint-retaining-wall | act1-kit | A21_2_flint_retaining_wall | 0.13 | 0.27 | 0.52 | 1.89 | 0.13 / 0.27 | 0.0e+0 |  | PASS |
| act1-a21-3-peat-stack | act1-kit | A21_3_peat_stack | 0.24 | 0.31 | 0.62 | 1.54 | 0.38 / 0.31 | 1.4e-8 |  | PASS |
| act1-a21-4-vigil-chair | act1-kit | A21_4_vigil_chair | 2.58 | 0.57 | 1.11 | 2.27 | 2.68 / 0.57 | 4.3e-8 |  | PASS |
| act1-a21-5-leaning-stones | act1-kit | A21_5_leaning_stones | 0.00 | 0.36 | 0.72 | 0.93 | 0.00 / 0.36 | 2.7e-8 |  | PASS |
| act1-a21-5-leaning-stones-wide | act1-kit | A21_5_leaning_stones | 6.73 | 3.58 | 6.41 | 3.40 | 0.00 / 0.36 | 6.7e-2 |  | APPROX (FAIL) |
| act1-a21-6-bog-grave | act1-kit | A21_6_bog_grave | 0.68 | 0.25 | 0.63 | 0.69 | 1.57 / 0.25 | 1.9e-8 |  | PASS |
| act1-a22-1-worn-shoes | act1-kit | A22_1_worn_shoes | 6.87 | 0.34 | 0.68 | 3.09 | 0.00 / 0.32 | 1.1e-8 |  | PASS |
| act1-a22-2-toll-post | act1-kit | A22_2_toll_post | 0.96 | 0.38 | 0.80 | 3.83 | 0.96 / 0.38 | 3.5e-8 |  | PASS |
| act1-a22-3-wicker-cradle | act1-kit | A22_3_wicker_cradle | 3.10 | 0.23 | 0.60 | 1.33 | 3.10 / 0.23 | 0.0e+0 |  | PASS |
| act1-a22-4-harvester-cairn | act1-kit | A22_4_harvester_cairn | 0.27 | 0.20 | 0.49 | 1.31 | 0.27 / 0.20 | 2.7e-8 |  | PASS |
| act1-a22-5-crook-and-coat | act1-kit | A22_5_crook_and_coat | 0.71 | 0.31 | 0.61 | 1.63 | 0.45 / 0.29 | 2.5e-8 |  | PASS |
| act1-a22-6-straw-doll | act1-kit | A22_6_straw_doll | 3.77 | 0.34 | 0.82 | 5.74 | 3.77 / 0.34 | 2.7e-8 |  | PASS |
| act1-a23-1-abandoned-reaping | act1-kit | A23_1_abandoned_reaping | 2.13 | 0.22 | 0.56 | 2.52 | 2.13 / 0.22 | 1.4e-8 |  | PASS |
| act1-a23-2-ribbon-thorn | act1-kit | A23_2_ribbon_thorn | 0.85 | 0.23 | 0.69 | 2.25 | 0.85 / 0.23 | 2.3e-8 |  | PASS |
| act1-a23-3-garth-flower-bed | act1-kit | A23_3_garth_flower_bed | 1.10 | 0.29 | 0.86 | 0.60 | 0.80 / 0.21 | 1.3e-8 |  | PASS |
| act1-a23-4-potted-flowers | act1-kit | A23_4_potted_flowers | 0.78 | 0.34 | 0.76 | 1.46 | 0.78 / 0.34 | 2.6e-8 |  | PASS |
| act1-a23-5-walled-flower-bed | act1-kit | A23_5_walled_flower_bed | 2.39 | 0.25 | 0.55 | 0.83 | 2.36 / 0.25 | 1.4e-8 |  | PASS |
| act1-a23-6-drying-line | act1-kit | A23_6_drying_line | 0.21 | 0.21 | 0.39 | 0.36 | 0.21 / 0.21 | 2.6e-8 |  | PASS |
| act1-a24-1-kitchen-table | act1-kit | A24_1_kitchen_table | 0.14 | 0.32 | 0.62 | 0.66 | 0.14 / 0.32 | 1.7e-8 |  | PASS |
| act1-a24-2-bread-rack | act1-kit | A24_2_bread_rack | 0.32 | 0.38 | 0.82 | 0.46 | 0.30 / 0.38 | 2.7e-8 | sym | PASS |
| act1-a24-3-linen-folding-table | act1-kit | A24_3_linen_folding_table | 6.24 | 0.17 | 0.87 | 0.55 | 6.24 / 0.17 | 1.7e-8 |  | PASS |
| act1-a24-4-turned-down-coverlet | act1-kit | A24_4_turned_down_coverlet | 0.08 | 0.22 | 0.43 | 1.62 | 0.08 / 0.22 | 2.0e-8 |  | PASS |
| act1-a24-5-turned-down-quilt | act1-kit | A24_5_turned_down_quilt | 0.20 | 0.23 | 0.45 | 1.26 | 0.20 / 0.22 | 1.5e-8 |  | PASS |
| act1-a24-6-linen-pillow | act1-kit | A24_6_linen_pillow | 0.33 | 0.32 | 0.57 | 1.73 | 0.33 / 0.32 | 1.5e-8 |  | PASS |
| act1-a25-1-root-rib-arch | act1-kit | A25_1_root_rib_arch | 2.77 | 0.16 | 0.40 | 1.91 | 2.77 / 0.16 | 2.0e-8 |  | PASS |
| act1-a25-1-root-rib-arch-slim | act1-kit | A25_1_root_rib_arch | 18.27 | 0.33 | 5.27 | 2.24 | 2.77 / 0.16 | 2.0e-1 |  | APPROX (FAIL) |
| act1-a25-2-plank-crossing | act1-kit | A25_2_plank_crossing | 0.34 | 0.30 | 0.57 | 0.61 | 0.33 / 0.30 | 2.4e-8 |  | PASS |
| act1-a25-3-root-fall | act1-kit | A25_3_root_fall | 14.89 | 0.17 | 0.42 | 2.22 | 14.89 / 0.17 | 1.6e-8 |  | PASS |
| act1-a25-4-harvest-basket | act1-kit | A25_4_harvest_basket | 0.94 | 0.41 | 0.94 | 0.97 | 0.25 / 0.42 | 2.0e-8 |  | PASS |
| act1-a25-5-tending-kit | act1-kit | A25_5_tending_kit | 0.22 | 0.37 | 0.71 | 5.18 | 0.48 / 0.37 | 2.3e-8 |  | PASS |
| act1-a25-6-tamsin-lantern | act1-kit | A25_6_tamsin_lantern | 0.19 | 0.13 | 0.34 | 2.81 | 0.19 / 0.13 | 0.0e+0 |  | PASS |
| biome-prop-riverbank-stones | props | riverbank_stones | 0.34 | 0.34 | 0.58 | 2.29 | 0.34 / 0.34 | 0.0e+0 |  | PASS |
| biome-prop-mushrooms | props | mushroom_cluster | 0.35 | 0.35 | 0.68 | 2.57 | 0.35 / 0.35 | 2.6e-8 |  | PASS |
| biome-prop-stump | props | mossy_stump | 0.38 | 0.26 | 0.49 | 1.68 | 0.38 / 0.26 | 9.7e-9 |  | PASS |
| L_palisade_wall_a | legacy | L_palisade_wall_a | 2.43 | 0.29 | 0.59 | 2.29 | 2.43 / 0.29 | 0.0e+0 |  | PASS |
| L_wooden-fence_run_broken | legacy | L_wooden-fence_run_broken | 0.00 | 0.20 | 0.36 | 2.89 | 0.00 / 0.20 | 0.0e+0 |  | PASS |
| L_wooden-fence_broken_pair | legacy | L_wooden-fence_broken_pair | 0.00 | 0.23 | 0.42 | 4.03 | 0.00 / 0.23 | 0.0e+0 |  | PASS |
| L_dead-trees_tall | legacy | L_dead-trees_tall | 3.71 | 0.32 | 0.73 | 5.17 | 3.71 / 0.32 | 0.0e+0 |  | PASS |
| L_moor-rocks_low | legacy | L_moor-rocks_low | 0.00 | 0.26 | 0.51 | 5.27 | 0.00 / 0.26 | 0.0e+0 |  | PASS |
| L_camp-crafts_fishing_net | legacy | L_camp-crafts_fishing_net | 0.72 | 0.18 | 0.38 | 5.18 | 0.72 / 0.18 | 0.0e+0 |  | PASS |
| L_camp-crafts_laundry_line | legacy | L_camp-crafts_laundry_line | 0.00 | 0.14 | 0.29 | 6.43 | 0.00 / 0.14 | 0.0e+0 |  | PASS |
| L_camp-kitchen_water_barrel | legacy | L_camp-kitchen_water_barrel | 0.47 | 0.32 | 0.60 | 6.17 | 0.47 / 0.32 | 0.0e+0 |  | PASS |
| L_camp-storage_sacks | legacy | L_camp-storage_sacks | 0.70 | 0.34 | 0.66 | 2.36 | 0.70 / 0.34 | 0.0e+0 |  | PASS |
| L_camp-animals_wheelbarrow | legacy | L_camp-animals_wheelbarrow | 0.72 | 0.28 | 0.56 | 2.73 | 0.72 / 0.28 | 0.0e+0 |  | PASS |
| L_camp-animals_trough | legacy | L_camp-animals_trough | 0.45 | 0.41 | 0.86 | 0.85 | 0.45 / 0.41 | 0.0e+0 |  | PASS |
| L_camp-clutter_straw | legacy | L_camp-clutter_straw | 0.55 | 0.19 | 0.40 | 0.60 | 0.55 / 0.19 | 0.0e+0 |  | PASS |
| L_shrubs_shrub_05 | legacy | L_shrubs_shrub_05 | 0.00 | 0.19 | 0.38 | 3.95 | 0.00 / 0.19 | 0.0e+0 |  | PASS |
| L_shrubs_shrub_12 | legacy | L_shrubs_shrub_12 | 0.54 | 0.26 | 0.56 | 0.51 | 0.54 / 0.26 | 0.0e+0 |  | PASS |

## Approx variants

- `act1-a02-1-lychgate-open`: cut variant "open": back rail cut out (walk-through passage); the matrix is exact (same vertices as the base model), the faces of the boxes in cutBoxes must be dropped
- `act1-a06-1-causeway-open`: cut variant "open": end posts cut out (the road walks over it); the matrix is exact (same vertices as the base model), the faces of the boxes in cutBoxes must be dropped
- `act1-a07-6-roost-pole-trim`: trim variant: the post is flattened onto the cut plane y = 5.690 m (the optimized model keeps the full post and bar); the matrix is exact for every other vertex
- `act1-a13-4-bell-post-trim`: trim variant: the post is flattened onto the cut plane y = 3.370 m (the optimized model keeps the full post and bar); the matrix is exact for every other vertex
- `act1-a21-5-leaning-stones-wide`: warp variant "wide" (splay): a NON-affine bend of the base model; the matrix is the base model's (no re-centre), the bend is not applied
- `act1-a25-1-root-rib-arch-slim`: warp variant "slim" (squeeze_z): a NON-affine bend of the base model; the matrix is the base model's (no re-centre), the bend is not applied
