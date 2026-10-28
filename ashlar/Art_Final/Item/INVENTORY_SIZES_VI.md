# ASHLAR — Kích thước ô inventory của icon item

> File này do `ashlar/pipeline/items/split_item_sheets.py` sinh ra, đừng sửa tay. Chạy lại script (kèm `--force`) để cập nhật.

## Quy tắc

- **Footprint = cột × hàng (rộng × cao)** trên lưới inventory kiểu Diablo II. Ví dụ `2×3` là rộng 2 ô, cao 3 ô.
- **Kích thước icon (px) = footprint × 128 px**: `1×1` = 128×128, `2×3` = 256×384, `2×4` = 256×512.
- Icon có **nền trong suốt** (PNG RGBA) và **không có khung độ hiếm**; UI tự ghép khung độ hiếm.
- Phần nào của item nhô ra ngoài khung footprint trên sheet vẫn được giữ; khi đó cả item được thu nhỏ đều cho vừa canvas, nên icon có lề trong suốt.
- Icon cắt từ sheet đã duyệt trong `ashlar/Art_Final/Item/`. Footprint lấy từ layout template đã dùng để gen từng sheet (`ashlar/art/items/_batches/`).
- 275 icon tách nền bằng BEN2 (`--matte ben2`), trường `matte` trong `inventory_sizes.json`; các icon còn lại tách bằng heuristic.

### Footprint theo base gốc (ASHLAR_ITEMS_VI.md §1.3)

Footprint = kích thước gốc của base row (invwidth × invheight). Bảng tham khảo theo D2, đối chiếu lại khi gắn mã BASE; item cũ lệch bảng giữ footprint hiện tại đến lúc đó.

| Base gốc | Footprint |
|---|---|
| bình, cuộn, chìa, nhẫn, amulet, Word, đá, tessera, small charm (tin votive) | 1×1 |
| wand, dagger, tome (sách cuộn, hộp nến), large charm (wax votive) | 1×2 |
| club, hand axe, short staff, javelin, short sword, bó tên, hộp tên nỏ, grand charm (silver votive) | 1×3 |
| long / gnarled staff | 1×4 |
| mace, axe, short bow, light crossbow, large / kite shield, giáp thân | 2×3 |
| spear, war staff, heavy crossbow, gothic shield | 2×4 |
| mũ, găng, ủng, targe, buckler | 2×2 |
| thắt lưng | 2×1 |

## C — Đồ tiêu hao

| ID | Tên | Footprint | Icon | Sheet |
|---|---|---|---|---|
| C04 | Reading Candle — nến đọc đồ (identify) | 1×1 | [C04_reading_candle.png](icons/C04_reading_candle.png) | IT-09_small_goods.png |
| C10 | Thin Draught — ngụm loãng | 1×1 | [C10_thin_draught.png](icons/C10_thin_draught.png) | IT-21_draughts.png |
| C11 | Small Draught — ngụm nhỏ | 1×1 | [C11_small_draught.png](icons/C11_small_draught.png) | IT-21_draughts.png |
| C12 | Draught — ngụm | 1×1 | [C12_draught.png](icons/C12_draught.png) | IT-21_draughts.png |
| C13 | Long Draught — ngụm dài | 1×1 | [C13_long_draught.png](icons/C13_long_draught.png) | IT-21_draughts.png |
| C14 | Deep Draught — ngụm sâu | 1×1 | [C14_deep_draught.png](icons/C14_deep_draught.png) | IT-21_draughts.png |
| C15 | Waking Draught — ngụm tỉnh | 1×1 | [C15_waking_draught.png](icons/C15_waking_draught.png) | IT-21_draughts.png |
| C16 | Great Waking Draught — ngụm tỉnh lớn | 1×1 | [C16_great_waking.png](icons/C16_great_waking.png) | IT-21_draughts.png |
| C17 | Second-wind Draught — ngụm lấy hơi | 1×1 | [C17_second_wind.png](icons/C17_second_wind.png) | IT-21_draughts.png |
| C18 | Brine Wash — nước rửa muối | 1×1 | [C18_brine_wash.png](icons/C18_brine_wash.png) | IT-21_draughts.png |
| C19 | Ember Tea — trà than | 1×1 | [C19_ember_tea.png](icons/C19_ember_tea.png) | IT-21_draughts.png |
| C20 | Lychgate Rubbing — bản rập cổng lychgate | 1×1 | [C20_lychgate_rubbing.png](icons/C20_lychgate_rubbing.png) | IT-22_rubbings_keys_ammo.png |
| C21 | Book of Rubbings — sổ bản rập | 1×2 | [C21_book_of_rubbings.png](icons/C21_book_of_rubbings.png) | IT-22_rubbings_keys_ammo.png |
| C22 | Candle-box — hộp nến | 1×2 | [C22_candle_box.png](icons/C22_candle_box.png) | IT-22_rubbings_keys_ammo.png |
| C23 | Arrow Sheaf — bó tên | 1×3 | [C23_arrow_sheaf.png](icons/C23_arrow_sheaf.png) | IT-22_rubbings_keys_ammo.png |
| C24 | Quarrel Case — hộp tên nỏ | 1×3 | [C24_quarrel_case.png](icons/C24_quarrel_case.png) | IT-22_rubbings_keys_ammo.png |

## G — Tiền và hàng bán

| ID | Tên | Footprint | Icon | Sheet |
|---|---|---|---|---|
| G01 | Coin — tiền | 1×1 | [G01_coin.png](icons/G01_coin.png) | IT-05_consumables_coin.png |
| G03 | Grave-Goods Bundle — gói đồ tuỳ táng | 2×2 | [G03_grave_goods_bundle.png](icons/G03_grave_goods_bundle.png) | IT-05_consumables_coin.png |

## W — Vũ khí

| ID | Tên | Footprint | Icon | Sheet |
|---|---|---|---|---|
| W01 | Iron Candle-Stand — giá nến sắt làm chùy | 1×3 | [W01_iron_candle_stand.png](icons/W01_iron_candle_stand.png) | IT-20_starting_kit.png |
| W02 | Winged Mace — chùy cánh | 2×3 | [W02_winged_mace.png](icons/W02_winged_mace.png) | IT-06_brannoc_weapons.png |
| W03 | Carrying Pole — đòn khiêng (thiết kế cũ Bier-Pole, base §2.16) | 2×4 | [W03_carrying_pole.png](icons/W03_carrying_pole.png) | IT-06_brannoc_weapons.png |
| W04 | Bell-rope Cosh — dùi cui dây chuông | 1×3 | [W04_bell_rope_cosh.png](icons/W04_bell_rope_cosh.png) | IT-20_starting_kit.png |
| W05 | Knotted Scourge — roi xích | 2×3 | [W05_knotted_scourge.png](icons/W05_knotted_scourge.png) | IT-12_ansel_crane_weapons.png |
| W06 | Sexton's Bone-Hook — móc xương của người giữ mộ | 1×2 | [W06_bone_hook.png](icons/W06_bone_hook.png) | IT-20_starting_kit.png |
| W07 | Bone-Wand — đũa xương | 1×2 | [W07_bone_wand.png](icons/W07_bone_wand.png) | IT-16_late_class_gear.png |
| W08 | Reed Sickle — liềm cắt sậy | 1×3 | [W08_reed_sickle.png](icons/W08_reed_sickle.png) | IT-06_brannoc_weapons.png |
| W10 | Driftwood Staff — gậy gỗ trôi dạt | 2×4 | [W10_driftwood_staff.png](icons/W10_driftwood_staff.png) | IT-16_late_class_gear.png |
| W12 | Exhumer's Spade — xẻng Exhumer | 2×4 | [W12_exhumers_spade.png](icons/W12_exhumers_spade.png) | IT-12_ansel_crane_weapons.png |
| W13 | Exhumer's Crossbow — nỏ Exhumer | 2×4 | [W13_exhumers_crossbow.png](icons/W13_exhumers_crossbow.png) | IT-12_ansel_crane_weapons.png |
| W14 | Votive Torch — đuốc lễ | 1×3 | [W14_votive_torch.png](icons/W14_votive_torch.png) | IT-01_prologue_weapons.png |
| W15 | Pyre-Staff — gậy giàn thiêu | 2×4 | [W15_pyre_staff.png](icons/W15_pyre_staff.png) | IT-16_late_class_gear.png |
| W16 | Fen-Axe — rìu lửa đá (thiết kế cũ Flint Hand-Axe, base §2.16) | 2×3 | [W16_fen_axe.png](icons/W16_fen_axe.png) | IT-06_brannoc_weapons.png |
| W17 | Grave-watch Crossbow — nỏ canh mộ | 2×3 | [W17_grave_watch_crossbow.png](icons/W17_grave_watch_crossbow.png) | IT-20_starting_kit.png |
| W18 | Salt-rod — que muối | 1×2 | [W18_salt_rod.png](icons/W18_salt_rod.png) | IT-20_starting_kit.png |
| W19 | Hatchet | 1×3 | [W19_hatchet.png](icons/W19_hatchet.png) | IT-29_axes_clubs.png |
| W20 | Felling Axe | 2×3 | [W20_felling_axe.png](icons/W20_felling_axe.png) | IT-29_axes_clubs.png |
| W21 | Wright's Axe | 2×3 | [W21_wrights_axe.png](icons/W21_wrights_axe.png) | IT-29_axes_clubs.png |
| W22 | Twin-bit Axe | 2×3 | [W22_twin_bit_axe.png](icons/W22_twin_bit_axe.png) | IT-29_axes_clubs.png |
| W23 | Knobstick | 1×3 | [W23_knobstick.png](icons/W23_knobstick.png) | IT-29_axes_clubs.png |
| W24 | Verger's Mace | 1×3 | [W24_vergers_mace.png](icons/W24_vergers_mace.png) | IT-29_axes_clubs.png |
| W25 | Hobnail Cosh | 1×3 | [W25_hobnail_cosh.png](icons/W25_hobnail_cosh.png) | IT-29_axes_clubs.png |
| W26 | Candle-iron | 2×3 | [W26_candle_iron.png](icons/W26_candle_iron.png) | IT-30_maces_swords.png |
| W27 | Thornhead Mace | 2×3 | [W27_thornhead_mace.png](icons/W27_thornhead_mace.png) | IT-30_maces_swords.png |
| W28 | Beadle's Mace | 1×3 | [W28_beadles_mace.png](icons/W28_beadles_mace.png) | IT-30_maces_swords.png |
| W29 | Hanger | 1×3 | [W29_hanger.png](icons/W29_hanger.png) | IT-30_maces_swords.png |
| W30 | Reed-cutter | 1×3 | [W30_reed_cutter.png](icons/W30_reed_cutter.png) | IT-30_maces_swords.png |
| W31 | Watchman's Sword | 1×3 | [W31_watchmans_sword.png](icons/W31_watchmans_sword.png) | IT-30_maces_swords.png |
| W32 | Double-grip Sword | 1×4 | [W32_double_grip_sword.png](icons/W32_double_grip_sword.png) | IT-31_long_swords_knives.png |
| W33 | Flint Sword | 2×3 | [W33_flint_sword.png](icons/W33_flint_sword.png) | IT-31_long_swords_knives.png |
| W34 | Hedger's Blade | 1×3 | [W34_hedgers_blade.png](icons/W34_hedgers_blade.png) | IT-30_maces_swords.png |
| W35 | Barrow Sword | 2×3 | [W35_barrow_sword.png](icons/W35_barrow_sword.png) | IT-31_long_swords_knives.png |
| W36 | Lych-knife | 1×2 | [W36_lych_knife.png](icons/W36_lych_knife.png) | IT-31_long_swords_knives.png |
| W37 | Reaping Hook | 1×2 | [W37_reaping_hook.png](icons/W37_reaping_hook.png) | IT-31_long_swords_knives.png |
| W38 | Ash Pole | 2×4 | [W38_ash_pole.png](icons/W38_ash_pole.png) | IT-32_poles_staves_wands.png |
| W39 | Churchyard Scythe | 2×4 | [W39_churchyard_scythe.png](icons/W39_churchyard_scythe.png) | IT-32_poles_staves_wands.png |
| W40 | Walking Staff | 1×3 | [W40_walking_staff.png](icons/W40_walking_staff.png) | IT-32_poles_staves_wands.png |
| W41 | Torch-staff | 1×4 | [W41_torch_staff.png](icons/W41_torch_staff.png) | IT-32_poles_staves_wands.png |
| W42 | Bog-oak Staff | 1×4 | [W42_bog_oak_staff.png](icons/W42_bog_oak_staff.png) | IT-32_poles_staves_wands.png |
| W43 | Willow Wand | 1×2 | [W43_willow_wand.png](icons/W43_willow_wand.png) | IT-32_poles_staves_wands.png |
| W44 | Driftwood Wand | 1×2 | [W44_driftwood_wand.png](icons/W44_driftwood_wand.png) | IT-32_poles_staves_wands.png |
| W45 | Poacher's Crossbow | 2×3 | [W45_poachers_crossbow.png](icons/W45_poachers_crossbow.png) | IT-33_bows_crossbows.png |
| W46 | Watch Crossbow | 2×3 | [W46_watch_crossbow.png](icons/W46_watch_crossbow.png) | IT-33_bows_crossbows.png |
| W47 | Fowler's Bow | 2×3 | [W47_fowlers_bow.png](icons/W47_fowlers_bow.png) | IT-33_bows_crossbows.png |
| W48 | Reed Bow | 2×3 | [W48_reed_bow.png](icons/W48_reed_bow.png) | IT-33_bows_crossbows.png |
| W49 | Yew Bow | 2×4 | [W49_yew_bow.png](icons/W49_yew_bow.png) | IT-33_bows_crossbows.png |
| W50 | Horn Bow | 2×3 | [W50_horn_bow.png](icons/W50_horn_bow.png) | IT-33_bows_crossbows.png |
| W51 | Eel Gig | 1×3 | [W51_eel_gig.png](icons/W51_eel_gig.png) | IT-34_spears_tin_votives.png |
| W52 | Boar Spear | 2×4 | [W52_boar_spear.png](icons/W52_boar_spear.png) | IT-34_spears_tin_votives.png |
| W53 | Eel Fork | 2×4 | [W53_eel_fork.png](icons/W53_eel_fork.png) | IT-34_spears_tin_votives.png |
| W54 | Weighted Gig | 2×3 | [W54_weighted_gig.png](icons/W54_weighted_gig.png) | IT-34_spears_tin_votives.png |
| W55 | Throwing Stake | 2×3 | [W55_throwing_stake.png](icons/W55_throwing_stake.png) | IT-34_spears_tin_votives.png |
| W56 | Punch-knife | 1×3 | [W56_punch_knife.png](icons/W56_punch_knife.png) | IT-35_claws_brine_flasks.png |
| W57 | Cuff-blade | 1×3 | [W57_cuff_blade.png](icons/W57_cuff_blade.png) | IT-35_claws_brine_flasks.png |
| W58 | Bill-hooks | 2×3 | [W58_bill_hooks.png](icons/W58_bill_hooks.png) | IT-35_claws_brine_flasks.png |
| W59 | Lead Knuckles | 2×3 | [W59_lead_knuckles.png](icons/W59_lead_knuckles.png) | IT-35_claws_brine_flasks.png |
| W60 | Throwing Nails | 1×2 | [W60_throwing_nails.png](icons/W60_throwing_nails.png) | IT-31_long_swords_knives.png |
| W61 | Throwing Hatchet | 1×2 | [W61_throwing_hatchet.png](icons/W61_throwing_hatchet.png) | IT-31_long_swords_knives.png |
| W62 | Mortsafe Spikes | 1×2 | [W62_mortsafe_spikes.png](icons/W62_mortsafe_spikes.png) | IT-31_long_swords_knives.png |

## O — Class item và tay phụ

| ID | Tên | Footprint | Icon | Sheet |
|---|---|---|---|---|
| O01 | Old Coffin-lid — nắp quan tài cũ | 2×2 | [O01_old_coffin_lid.png](icons/O01_old_coffin_lid.png) | IT-20_starting_kit.png |
| O02 | Pall Coffin-Lid — khiên nắp quan tài | 2×4 | [O02_pall_coffin_lid.png](icons/O02_pall_coffin_lid.png) | IT-07_shields_heavy.png |
| O03 | Branding Iron — sắt nung | 1×3 | [O03_branding_iron.png](icons/O03_branding_iron.png) | IT-02_class_offhands.png |
| O04 | Bone Box — hòm thánh tích (thiết kế cũ Reliquary, base §2.16) | 2×2 | [O04_bone_box.png](icons/O04_bone_box.png) | IT-02_class_offhands.png |
| O05 | Brine-Flask — bình nước biển | 2×2 | [O05_brine_flask.png](icons/O05_brine_flask.png) | IT-02_class_offhands.png |
| O06 | Hooded Lantern — đèn có chụp | 2×2 | [O06_hooded_lantern.png](icons/O06_hooded_lantern.png) | IT-02_class_offhands.png |
| O07 | Mortsafe-Grille Shield — khiên song sắt chắn mộ | 2×3 | [O07_mortsafe_grille_shield.png](icons/O07_mortsafe_grille_shield.png) | IT-07_shields_heavy.png |
| O08 | Pickling Jar | 1×2 | [O08_pickling_jar.png](icons/O08_pickling_jar.png) | IT-35_claws_brine_flasks.png |
| O09 | Sea-flask | 1×2 | [O09_sea_flask.png](icons/O09_sea_flask.png) | IT-35_claws_brine_flasks.png |
| O10 | Peat-smoked Jar | 1×2 | [O10_peat_smoked_jar.png](icons/O10_peat_smoked_jar.png) | IT-35_claws_brine_flasks.png |
| O11 | Tin Reliquary | 2×2 | [O11_tin_reliquary.png](icons/O11_tin_reliquary.png) | IT-38_lids_reliquary_shields.png |
| O12 | Pine Lid | 2×2 | [O12_pine_lid.png](icons/O12_pine_lid.png) | IT-38_lids_reliquary_shields.png |
| O13 | Elm Lid | 2×2 | [O13_elm_lid.png](icons/O13_elm_lid.png) | IT-38_lids_reliquary_shields.png |
| O14 | Board Shield | 2×2 | [O14_board_shield.png](icons/O14_board_shield.png) | IT-38_lids_reliquary_shields.png |
| O15 | Wicker Shield | 2×2 | [O15_wicker_shield.png](icons/O15_wicker_shield.png) | IT-38_lids_reliquary_shields.png |
| O16 | Door-shield | 2×3 | [O16_door_shield.png](icons/O16_door_shield.png) | IT-38_lids_reliquary_shields.png |
| O17 | Nail Shield | 2×3 | [O17_nail_shield.png](icons/O17_nail_shield.png) | IT-39_shields_gloves_boots.png |
| O18 | Mantlet | 2×3 | [O18_mantlet.png](icons/O18_mantlet.png) | IT-39_shields_gloves_boots.png |

## A — Giáp

| ID | Tên | Footprint | Icon | Sheet |
|---|---|---|---|---|
| A02 | Sexton's Coat — áo khoác của Gennet (thiết kế cũ Gennet's Coat, base §2.16) | 2×3 | [A02_sextons_coat.png](icons/A02_sextons_coat.png) | IT-03_starting_armour.png |
| A03 | Riveted Jack — áo brigandine vá (thiết kế cũ Patched Brigandine, base §2.16) | 2×3 | [A03_riveted_jack.png](icons/A03_riveted_jack.png) | IT-08_lychgate_armour.png |
| A04 | Oilcloth Coat — áo vải dầu (thiết kế cũ Oilskin Coat, base §2.16) | 2×3 | [A04_oilcloth_coat.png](icons/A04_oilcloth_coat.png) | IT-08_lychgate_armour.png |
| A05 | Pall Cuirass — giáp ngực dòng Pall | 2×3 | [A05_pall_cuirass.png](icons/A05_pall_cuirass.png) | IT-13_pall_exhumer_armour.png |
| A06 | Sexton's Cowl — mũ trùm người giữ mộ | 2×2 | [A06_sextons_cowl.png](icons/A06_sextons_cowl.png) | IT-08_lychgate_armour.png |
| A07 | Wide-Brim Hat — mũ rộng vành | 2×2 | [A07_wide_brim_hat.png](icons/A07_wide_brim_hat.png) | IT-13_pall_exhumer_armour.png |
| A08 | Ash-Veil — mạng tro | 2×3 | [A08_ash_veil.png](icons/A08_ash_veil.png) | IT-16_late_class_gear.png |
| A09 | Pall Great-Helm — mũ trụ dòng Pall | 2×2 | [A09_pall_great_helm.png](icons/A09_pall_great_helm.png) | IT-13_pall_exhumer_armour.png |
| A10 | Work Gloves — găng đào mộ (thiết kế cũ Gravedigger's Gloves, base §2.16) | 2×2 | [A10_work_gloves.png](icons/A10_work_gloves.png) | IT-03_starting_armour.png |
| A11 | Nailed Gauntlet — găng sắt đóng đinh | 2×2 | [A11_nailed_gauntlet.png](icons/A11_nailed_gauntlet.png) | IT-07_shields_heavy.png |
| A12 | Peat Boots — ủng thợ cắt than bùn (thiết kế cũ Peat-Cutter's Boots, base §2.16) | 2×2 | [A12_peat_boots.png](icons/A12_peat_boots.png) | IT-03_starting_armour.png |
| A13 | Iron-Shod Sabatons — giày sắt | 2×2 | [A13_iron_shod_sabatons.png](icons/A13_iron_shod_sabatons.png) | IT-07_shields_heavy.png |
| A14 | Sexton's Belt — thắt lưng đồ nghề (thiết kế cũ Sexton's Tool Belt, base §2.16) | 2×1 | [A14_sextons_belt.png](icons/A14_sextons_belt.png) | IT-08_lychgate_armour.png |
| A15 | Cord Belt — dây mười nút (thiết kế cũ Ten-Knot Cord, base §2.16) | 2×1 | [A15_cord_belt.png](icons/A15_cord_belt.png) | IT-13_pall_exhumer_armour.png |
| A16 | Tanner's Jerkin | 2×3 | [A16_tanners_jerkin.png](icons/A16_tanners_jerkin.png) | IT-36_body_armour.png |
| A17 | Fen Byrnie | 2×3 | [A17_fen_byrnie.png](icons/A17_fen_byrnie.png) | IT-36_body_armour.png |
| A18 | Iron-patched Hauberk | 2×3 | [A18_iron_patched_hauberk.png](icons/A18_iron_patched_hauberk.png) | IT-36_body_armour.png |
| A19 | Grave-chain Shirt | 2×3 | [A19_grave_chain_shirt.png](icons/A19_grave_chain_shirt.png) | IT-36_body_armour.png |
| A20 | Leather Cap | 2×2 | [A20_leather_cap.png](icons/A20_leather_cap.png) | IT-36_body_armour.png |
| A21 | Boar-tusk Cap | 2×2 | [A21_boar_tusk_cap.png](icons/A21_boar_tusk_cap.png) | IT-36_body_armour.png |
| A22 | Kettle Cap | 2×2 | [A22_kettle_cap.png](icons/A22_kettle_cap.png) | IT-37_helms_veils.png |
| A23 | Tusked Helm | 2×2 | [A23_tusked_helm.png](icons/A23_tusked_helm.png) | IT-37_helms_veils.png |
| A24 | Kettle Helm | 2×2 | [A24_kettle_helm.png](icons/A24_kettle_helm.png) | IT-37_helms_veils.png |
| A25 | Barred Helm | 2×2 | [A25_barred_helm.png](icons/A25_barred_helm.png) | IT-37_helms_veils.png |
| A26 | Ash-veil | 2×2 | [A26_ash_veil.png](icons/A26_ash_veil.png) | IT-37_helms_veils.png |
| A27 | Grey Veil | 2×2 | [A27_grey_veil.png](icons/A27_grey_veil.png) | IT-37_helms_veils.png |
| A28 | Hedger's Gloves | 2×2 | [A28_hedgers_gloves.png](icons/A28_hedgers_gloves.png) | IT-39_shields_gloves_boots.png |
| A29 | Ringed Gloves | 2×2 | [A29_ringed_gloves.png](icons/A29_ringed_gloves.png) | IT-39_shields_gloves_boots.png |
| A30 | Clogs | 2×2 | [A30_clogs.png](icons/A30_clogs.png) | IT-39_shields_gloves_boots.png |
| A31 | Ringed Boots | 2×2 | [A31_ringed_boots.png](icons/A31_ringed_boots.png) | IT-39_shields_gloves_boots.png |
| A32 | Rope Belt | 2×1 | [A32_rope_belt.png](icons/A32_rope_belt.png) | IT-36_body_armour.png |

## J — Trang sức

| ID | Tên | Footprint | Icon | Sheet |
|---|---|---|---|---|
| J01 | Severin's Promise — Lời hứa của Severin | 1×1 | [J01_severins_promise.png](icons/J01_severins_promise.png) | IT-04_relics_act1.png |
| J02 | Bone Ring — nhẫn xương | 1×1 | [J02_bone_ring.png](icons/J02_bone_ring.png) | IT-09_small_goods.png |
| J03 | Mason's-Mark Signet — nhẫn ấn dấu thợ đá | 1×1 | [J03_masons_signet.png](icons/J03_masons_signet.png) | IT-17_rings_materials.png |
| J04 | Wedge Pendant — mặt dây Wedge | 1×1 | [J04_wedge_pendant.png](icons/J04_wedge_pendant.png) | IT-14_sepulcra_small_goods.png |
| J05 | Cracked Wedge — Wedge nứt Odilian | 1×1 | [J05_cracked_wedge.png](icons/J05_cracked_wedge.png) | IT-14_sepulcra_small_goods.png |
| J06 | Bell-Bronze Pendant — mặt đồng chuông | 1×1 | [J06_bell_bronze_pendant.png](icons/J06_bell_bronze_pendant.png) | IT-14_sepulcra_small_goods.png |
| J07 | Salt-Glass Ring — nhẫn kính muối | 1×1 | [J07_salt_glass_ring.png](icons/J07_salt_glass_ring.png) | IT-17_rings_materials.png |
| J08 | Flint Ring — nhẫn đá lửa | 1×1 | [J08_flint_ring.png](icons/J08_flint_ring.png) | IT-28_dolmoor_jewellery.png |
| J09 | Peat-Wood Ring — nhẫn gỗ than bùn | 1×1 | [J09_peat_wood_ring.png](icons/J09_peat_wood_ring.png) | IT-28_dolmoor_jewellery.png |
| J10 | Hammered Iron Ring — nhẫn sắt gò | 1×1 | [J10_hammered_iron_ring.png](icons/J10_hammered_iron_ring.png) | IT-28_dolmoor_jewellery.png |
| J11 | Flint Pendant — mặt dây đá lửa | 1×1 | [J11_flint_pendant.png](icons/J11_flint_pendant.png) | IT-28_dolmoor_jewellery.png |
| J12 | Bog-Oak Amulet — amulet sồi đầm lầy | 1×1 | [J12_bog_oak_amulet.png](icons/J12_bog_oak_amulet.png) | IT-28_dolmoor_jewellery.png |
| J13 | Caged Flint Amulet — amulet lồng đá lửa | 1×1 | [J13_caged_flint_amulet.png](icons/J13_caged_flint_amulet.png) | IT-28_dolmoor_jewellery.png |

## R — Relic

| ID | Tên | Footprint | Icon | Sheet |
|---|---|---|---|---|
| R01 | Osric's Lantern — đèn của Osric | 1×2 | [R01_osrics_lantern.png](icons/R01_osrics_lantern.png) | IT-04_relics_act1.png |
| R02 | The Tongueless Bell — Chuông không lưỡi | 2×2 | [R02_the_tongueless_bell.png](icons/R02_the_tongueless_bell.png) | IT-15_act2_relics_quest.png |
| R03 | The Inkman's Mark — dấu của Inkman | 1×2 | [R03_the_inkmans_mark.png](icons/R03_the_inkmans_mark.png) | IT-18_act3_quest.png |
| R04 | Silver Coffin-Nail — đinh quan tài bạc | 1×2 | [R04_silver_coffin_nail.png](icons/R04_silver_coffin_nail.png) | IT-19_act4_5_epilogue.png |

## Q — Quest item

| ID | Tên | Footprint | Icon | Sheet |
|---|---|---|---|---|
| Q01 | The Book of Laid Names — Sổ Tên Người Nằm | 2×2 | [Q01_book_of_laid_names.png](icons/Q01_book_of_laid_names.png) | IT-04_relics_act1.png |
| Q02 | Oldest Volume of the Book — tập cổ nhất | 2×2 | [Q02_oldest_volume.png](icons/Q02_oldest_volume.png) | IT-10_act1_quest.png |
| Q03 | Edda's Broth Bowl — bát nước dùng của Edda | 2×2 | [Q03_eddas_broth_bowl.png](icons/Q03_eddas_broth_bowl.png) | IT-10_act1_quest.png |
| Q04 | The Ferryman's Tin — hộp xu của người lái đò | 2×2 | [Q04_ferrymans_tin.png](icons/Q04_ferrymans_tin.png) | IT-04_relics_act1.png |
| Q05 | Cup of Poppy Tea — chén trà anh túc | 2×2 | [Q05_cup_of_poppy_tea.png](icons/Q05_cup_of_poppy_tea.png) | IT-10_act1_quest.png |
| Q06 | Shroud Bill of Sale — biên lai mua vải liệm | 1×1 | [Q06_shroud_bill_of_sale.png](icons/Q06_shroud_bill_of_sale.png) | IT-18_act3_quest.png |
| Q08 | The Unedited Testament — Kinh văn chưa sửa | 2×2 | [Q08_unedited_testament.png](icons/Q08_unedited_testament.png) | IT-15_act2_relics_quest.png |
| Q09 | On the Term — báo cáo về kỳ hạn | 1×2 | [Q09_on_the_term.png](icons/Q09_on_the_term.png) | IT-15_act2_relics_quest.png |
| Q10 | The Iron Halo — Vương miện sắt | 2×2 | [Q10_the_iron_halo.png](icons/Q10_the_iron_halo.png) | IT-15_act2_relics_quest.png |
| Q11 | Ignatia's Broken Seal — ấn Exhumer bẻ đôi | 1×2 | [Q11_ignatias_broken_seal.png](icons/Q11_ignatias_broken_seal.png) | IT-15_act2_relics_quest.png |
| Q12 | Nareh's Contraband — "tội lỗi" lậu | 2×2 | [Q12_narehs_contraband.png](icons/Q12_narehs_contraband.png) | IT-18_act3_quest.png |
| Q13 | The Chipped Cup — chén mẻ của Nareh | 1×1 | [Q13_the_chipped_cup.png](icons/Q13_the_chipped_cup.png) | IT-18_act3_quest.png |
| Q14 | Whispering-Crystal — đá thì thầm | 1×1 | [Q14_whispering_crystal.png](icons/Q14_whispering_crystal.png) | IT-18_act3_quest.png |
| Q15 | The Salt Crown — vương miện muối | 2×2 | [Q15_the_salt_crown.png](icons/Q15_the_salt_crown.png) | IT-18_act3_quest.png |
| Q16 | Mila's Music Box — hộp nhạc của Mila | 2×2 | [Q16_milas_music_box.png](icons/Q16_milas_music_box.png) | IT-19_act4_5_epilogue.png |
| Q17 | The Living Flower — bông hoa sống | 1×2 | [Q17_the_living_flower.png](icons/Q17_the_living_flower.png) | IT-19_act4_5_epilogue.png |
| Q18 | Severin's Letter — thư của Severin | 1×1 | [Q18_severins_letter.png](icons/Q18_severins_letter.png) | IT-19_act4_5_epilogue.png |
| Q19 | Maelys's Candle Stub — mẩu nến của Maelys | 1×1 | [Q19_maelyss_candle.png](icons/Q19_maelyss_candle.png) | IT-19_act4_5_epilogue.png |
| Q20 | The Pear — quả lê | 1×1 | [Q20_the_pear.png](icons/Q20_the_pear.png) | IT-19_act4_5_epilogue.png |

## K — Chìa khoá

| ID | Tên | Footprint | Icon | Sheet |
|---|---|---|---|---|
| K01 | Ossuary Grille Key — chìa song sắt ossuary | 1×2 | [K01_ossuary_grille_key.png](icons/K01_ossuary_grille_key.png) | IT-11_keys.png |
| K02 | Barrow Vault Key — chìa hầm nhà Barrow | 1×2 | [K02_barrow_vault_key.png](icons/K02_barrow_vault_key.png) | IT-11_keys.png |
| K03 | Gentle House Gate Key — chìa cổng Gentle House | 1×2 | [K03_gentle_house_gate_key.png](icons/K03_gentle_house_gate_key.png) | IT-11_keys.png |
| K04 | Chancery Ledger Key — chìa phòng sổ Chancery | 1×2 | [K04_chancery_ledger_key.png](icons/K04_chancery_ledger_key.png) | IT-14_sepulcra_small_goods.png |
| K05 | Bell-Pit Key — chìa hầm chuông | 1×2 | [K05_bell_pit_key.png](icons/K05_bell_pit_key.png) | IT-14_sepulcra_small_goods.png |
| K06 | Sexton's Key — chìa người giữ mộ | 1×1 | [K06_sextons_key.png](icons/K06_sextons_key.png) | IT-22_rubbings_keys_ammo.png |

## E — Word (rune)

| ID | Tên | Footprint | Icon | Sheet |
|---|---|---|---|---|
| E01 | LIGHT | 1×1 | [E01_light.png](icons/E01_light.png) | IT-23_words_lead.png |
| E03 | REST | 1×1 | [E03_rest.png](icons/E03_rest.png) | IT-23_words_lead.png |
| E04 | LOW | 1×1 | [E04_low.png](icons/E04_low.png) | IT-23_words_lead.png |
| E05 | WAITS | 1×1 | [E05_waits.png](icons/E05_waits.png) | IT-23_words_lead.png |
| E06 | NO | 1×1 | [E06_no.png](icons/E06_no.png) | IT-23_words_lead.png |
| E07 | SALT | 1×1 | [E07_salt.png](icons/E07_salt.png) | IT-23_words_lead.png |
| E08 | ASH | 1×1 | [E08_ash.png](icons/E08_ash.png) | IT-23_words_lead.png |

## S — Đá

| ID | Tên | Footprint | Icon | Sheet |
|---|---|---|---|---|
| S01 | Crumbled Jet | 1×1 | [S01_crumbled_jet.png](icons/S01_crumbled_jet.png) | IT-24_stones_crumbled.png |
| S02 | Crumbled Rimestone | 1×1 | [S02_crumbled_rimestone.png](icons/S02_crumbled_rimestone.png) | IT-24_stones_crumbled.png |
| S03 | Crumbled Sea-Glass | 1×1 | [S03_crumbled_sea_glass.png](icons/S03_crumbled_sea_glass.png) | IT-24_stones_crumbled.png |
| S04 | Crumbled Kilnstone | 1×1 | [S04_crumbled_kilnstone.png](icons/S04_crumbled_kilnstone.png) | IT-24_stones_crumbled.png |
| S05 | Crumbled Lych-Quartz | 1×1 | [S05_crumbled_lych_quartz.png](icons/S05_crumbled_lych_quartz.png) | IT-24_stones_crumbled.png |
| S06 | Crumbled Thunder-Egg | 1×1 | [S06_crumbled_thunder_egg.png](icons/S06_crumbled_thunder_egg.png) | IT-24_stones_crumbled.png |
| S07 | Crumbled Knucklebone | 1×1 | [S07_crumbled_knucklebone.png](icons/S07_crumbled_knucklebone.png) | IT-24_stones_crumbled.png |
| S08 | Rough Jet | 1×1 | [S08_rough_jet.png](icons/S08_rough_jet.png) | IT-25_stones_rough.png |
| S09 | Rough Rimestone | 1×1 | [S09_rough_rimestone.png](icons/S09_rough_rimestone.png) | IT-25_stones_rough.png |
| S10 | Rough Sea-Glass | 1×1 | [S10_rough_sea_glass.png](icons/S10_rough_sea_glass.png) | IT-25_stones_rough.png |
| S11 | Rough Kilnstone | 1×1 | [S11_rough_kilnstone.png](icons/S11_rough_kilnstone.png) | IT-25_stones_rough.png |
| S12 | Rough Lych-Quartz | 1×1 | [S12_rough_lych_quartz.png](icons/S12_rough_lych_quartz.png) | IT-25_stones_rough.png |
| S13 | Rough Thunder-Egg | 1×1 | [S13_rough_thunder_egg.png](icons/S13_rough_thunder_egg.png) | IT-25_stones_rough.png |
| S14 | Rough Knucklebone | 1×1 | [S14_rough_knucklebone.png](icons/S14_rough_knucklebone.png) | IT-25_stones_rough.png |

## T — Tessera

| ID | Tên | Footprint | Icon | Sheet |
|---|---|---|---|---|
| T01 | Tessera (jewel) | 1×1 | [T01_tessera.png](icons/T01_tessera.png) | IT-24_stones_crumbled.png |

## V — Votive

| ID | Tên | Footprint | Icon | Sheet |
|---|---|---|---|---|
| V01 | Wax Heart Votive | 1×2 | [V01_wax_heart.png](icons/V01_wax_heart.png) | IT-26_votives.png |
| V02 | Wax Eye Votive | 1×2 | [V02_wax_eye.png](icons/V02_wax_eye.png) | IT-26_votives.png |
| V03 | Wax Lung Votive | 1×2 | [V03_wax_lung.png](icons/V03_wax_lung.png) | IT-26_votives.png |
| V04 | Wax Foot Votive | 1×2 | [V04_wax_foot.png](icons/V04_wax_foot.png) | IT-26_votives.png |
| V05 | Silver Heart Votive | 1×3 | [V05_silver_heart.png](icons/V05_silver_heart.png) | IT-26_votives.png |
| V06 | Silver Eye Votive | 1×3 | [V06_silver_eye.png](icons/V06_silver_eye.png) | IT-26_votives.png |
| V07 | Silver Lung Votive | 1×3 | [V07_silver_lung.png](icons/V07_silver_lung.png) | IT-26_votives.png |
| V08 | Silver Foot Votive | 1×3 | [V08_silver_foot.png](icons/V08_silver_foot.png) | IT-26_votives.png |
| V09 | Tin Heart Votive | 1×1 | [V09_tin_heart.png](icons/V09_tin_heart.png) | IT-34_spears_tin_votives.png |
| V10 | Tin Eye Votive | 1×1 | [V10_tin_eye.png](icons/V10_tin_eye.png) | IT-34_spears_tin_votives.png |
| V11 | Tin Lung Votive | 1×1 | [V11_tin_lung.png](icons/V11_tin_lung.png) | IT-34_spears_tin_votives.png |
| V12 | Tin Foot Votive | 1×1 | [V12_tin_foot.png](icons/V12_tin_foot.png) | IT-34_spears_tin_votives.png |

## H — Hallowed

| ID | Tên | Footprint | Icon | Sheet |
|---|---|---|---|---|
| H01 | The Bride's Veil | 2×2 | [H01_the_brides_veil.png](icons/H01_the_brides_veil.png) | IT-27_hallowed.png |
| H02 | Joss's Halo | 2×2 | [H02_josss_halo.png](icons/H02_josss_halo.png) | IT-27_hallowed.png |
| H03 | A Shard of the Kind Mirror | 1×3 | [H03_kind_mirror_shard.png](icons/H03_kind_mirror_shard.png) | IT-27_hallowed.png |
| H04 | The Glass Stag's Antler | 1×3 | [H04_glass_stags_antler.png](icons/H04_glass_stags_antler.png) | IT-27_hallowed.png |
| H05 | A Coal From the Ember-Pot | 1×1 | [H05_coal_from_the_ember_pot.png](icons/H05_coal_from_the_ember_pot.png) | IT-27_hallowed.png |
| H06 | Mortar-Day Ash | 2×2 | [H06_mortar_day_ash.png](icons/H06_mortar_day_ash.png) | IT-27_hallowed.png |
| H07 | The Night-Watch Hanger | 1×3 | [H07_the_night_watch_hanger.png](icons/H07_the_night_watch_hanger.png) | IT-40_hallowed_small_weapons.png |
| H08 | Grave-board | 2×2 | [H08_grave_board.png](icons/H08_grave_board.png) | IT-44_hallowed_poles_shields.png |
| H09 | Bog-oak Knot | 1×3 | [H09_bog_oak_knot.png](icons/H09_bog_oak_knot.png) | IT-40_hallowed_small_weapons.png |
| H10 | Magpie | 1×2 | [H10_magpie.png](icons/H10_magpie.png) | IT-40_hallowed_small_weapons.png |
| H11 | Gristle | 1×3 | [H11_gristle.png](icons/H11_gristle.png) | IT-40_hallowed_small_weapons.png |
| H12 | The Millennial Taper | 1×2 | [H12_the_millennial_taper.png](icons/H12_the_millennial_taper.png) | IT-40_hallowed_small_weapons.png |
| H13 | The Tolling Iron | 1×3 | [H13_the_tolling_iron.png](icons/H13_the_tolling_iron.png) | IT-40_hallowed_small_weapons.png |
| H14 | The Coffin-Nailer | 1×3 | [H14_the_coffin_nailer.png](icons/H14_the_coffin_nailer.png) | IT-40_hallowed_small_weapons.png |
| H15 | The Pyre-walker's Staff | 1×3 | [H15_the_pyre_walkers_staff.png](icons/H15_the_pyre_walkers_staff.png) | IT-40_hallowed_small_weapons.png |
| H16 | The Corpse-washer's Gloves | 2×2 | [H16_the_corpse_washers_gloves.png](icons/H16_the_corpse_washers_gloves.png) | IT-45_hallowed_heads_hands_feet.png |
| H17 | Hearth-clogs | 2×2 | [H17_hearth_clogs.png](icons/H17_hearth_clogs.png) | IT-45_hallowed_heads_hands_feet.png |
| H18 | Fen-moon | 1×3 | [H18_fen_moon.png](icons/H18_fen_moon.png) | IT-40_hallowed_small_weapons.png |
| H19 | The Crow-scarer | 2×3 | [H19_the_crow_scarer.png](icons/H19_the_crow_scarer.png) | IT-43_hallowed_axes_bows.png |
| H20 | The Mourner's Coat | 2×3 | [H20_the_mourners_coat.png](icons/H20_the_mourners_coat.png) | IT-42_hallowed_armour.png |
| H21 | The Wake-cord | 2×1 | [H21_the_wake_cord.png](icons/H21_the_wake_cord.png) | IT-42_hallowed_armour.png |
| H22 | The Coffin-nail Ring | 1×1 | [H22_the_coffin_nail_ring.png](icons/H22_the_coffin_nail_ring.png) | IT-40_hallowed_small_weapons.png |
| H23 | Ice in the Ruts | 2×3 | [H23_ice_in_the_ruts.png](icons/H23_ice_in_the_ruts.png) | IT-43_hallowed_axes_bows.png |
| H24 | The Burning Stake | 2×4 | [H24_the_burning_stake.png](icons/H24_the_burning_stake.png) | IT-44_hallowed_poles_shields.png |
| H25 | The Running Bier | 2×4 | [H25_the_running_bier.png](icons/H25_the_running_bier.png) | IT-44_hallowed_poles_shields.png |
| H26 | The Last Spadeful | 2×3 | [H26_the_last_spadeful.png](icons/H26_the_last_spadeful.png) | IT-43_hallowed_axes_bows.png |
| H27 | The Great Candle-iron | 2×3 | [H27_the_great_candle_iron.png](icons/H27_the_great_candle_iron.png) | IT-43_hallowed_axes_bows.png |
| H28 | Marsh-gall | 1×4 | [H28_marsh_gall.png](icons/H28_marsh_gall.png) | IT-41_hallowed_blades_wands.png |
| H29 | Rook-shot | 2×3 | [H29_rook_shot.png](icons/H29_rook_shot.png) | IT-43_hallowed_axes_bows.png |
| H30 | Dusk-ward | 2×2 | [H30_dusk_ward.png](icons/H30_dusk_ward.png) | IT-45_hallowed_heads_hands_feet.png |
| H31 | Thornfist | 2×2 | [H31_thornfist.png](icons/H31_thornfist.png) | IT-45_hallowed_heads_hands_feet.png |
| H32 | The Bog-runner's Boots | 2×2 | [H32_the_bog_runners_boots.png](icons/H32_the_bog_runners_boots.png) | IT-45_hallowed_heads_hands_feet.png |
| H33 | The Gap-finder | 1×3 | [H33_the_gap_finder.png](icons/H33_the_gap_finder.png) | IT-41_hallowed_blades_wands.png |
| H34 | Poppy-reaper | 1×2 | [H34_poppy_reaper.png](icons/H34_poppy_reaper.png) | IT-41_hallowed_blades_wands.png |
| H35 | Lampless | 1×4 | [H35_lampless.png](icons/H35_lampless.png) | IT-41_hallowed_blades_wands.png |
| H36 | The Eel-Reeve's Fork | 2×4 | [H36_the_eel_reeves_fork.png](icons/H36_the_eel_reeves_fork.png) | IT-44_hallowed_poles_shields.png |
| H37 | The Fire-carrier's Coat | 2×3 | [H37_the_fire_carriers_coat.png](icons/H37_the_fire_carriers_coat.png) | IT-42_hallowed_armour.png |
| H38 | The Fen-adder Cord | 2×1 | [H38_the_fen_adder_cord.png](icons/H38_the_fen_adder_cord.png) | IT-42_hallowed_armour.png |
| H39 | First Frost | 1×3 | [H39_first_frost.png](icons/H39_first_frost.png) | IT-41_hallowed_blades_wands.png |
| H40 | The Snipe-bow | 2×3 | [H40_the_snipe_bow.png](icons/H40_the_snipe_bow.png) | IT-43_hallowed_axes_bows.png |
| H41 | The Weir-gate | 2×3 | [H41_the_weir_gate.png](icons/H41_the_weir_gate.png) | IT-44_hallowed_poles_shields.png |
| H42 | Red Shavings | 2×3 | [H42_red_shavings.png](icons/H42_red_shavings.png) | IT-43_hallowed_axes_bows.png |
| H43 | Wreck-wood | 1×2 | [H43_wreck_wood.png](icons/H43_wreck_wood.png) | IT-41_hallowed_blades_wands.png |
| H44 | Make-Way | 2×4 | [H44_make_way.png](icons/H44_make_way.png) | IT-44_hallowed_poles_shields.png |
| H45 | The Steeple-cap | 2×2 | [H45_the_steeple_cap.png](icons/H45_the_steeple_cap.png) | IT-45_hallowed_heads_hands_feet.png |
| H46 | The Deserter's Jerkin | 2×3 | [H46_the_deserters_jerkin.png](icons/H46_the_deserters_jerkin.png) | IT-42_hallowed_armour.png |
| H47 | Marsh-light | 2×3 | [H47_marsh_light.png](icons/H47_marsh_light.png) | IT-42_hallowed_armour.png |

## X — Coursed (set)

| ID | Tên | Footprint | Icon | Sheet |
|---|---|---|---|---|
| X01 | The Fowlers' Fleece | 2×3 | [X01_the_fowlers_fleece.png](icons/X01_the_fowlers_fleece.png) | IT-46_coursed_fowlers_wrights_diggers.png |
| X02 | The Fowlers' Belt | 2×1 | [X02_the_fowlers_belt.png](icons/X02_the_fowlers_belt.png) | IT-46_coursed_fowlers_wrights_diggers.png |
| X03 | The Wrights' Boots | 2×2 | [X03_the_wrights_boots.png](icons/X03_the_wrights_boots.png) | IT-46_coursed_fowlers_wrights_diggers.png |
| X04 | The Wrights' Shield | 2×2 | [X04_the_wrights_shield.png](icons/X04_the_wrights_shield.png) | IT-46_coursed_fowlers_wrights_diggers.png |
| X05 | The Wrights' Apron | 2×1 | [X05_the_wrights_apron.png](icons/X05_the_wrights_apron.png) | IT-46_coursed_fowlers_wrights_diggers.png |
| X06 | The Diggers' Lamp-cap | 2×2 | [X06_the_diggers_lamp_cap.png](icons/X06_the_diggers_lamp_cap.png) | IT-46_coursed_fowlers_wrights_diggers.png |
| X07 | The Diggers' Spade | 2×3 | [X07_the_diggers_spade.png](icons/X07_the_diggers_spade.png) | IT-46_coursed_fowlers_wrights_diggers.png |
| X08 | The Watchmen's Shield | 2×2 | [X08_the_watchmens_shield.png](icons/X08_the_watchmens_shield.png) | IT-47_coursed_watch_clerks_sisters_knights.png |
| X09 | The Watchmen's Grip | 2×2 | [X09_the_watchmens_grip.png](icons/X09_the_watchmens_grip.png) | IT-47_coursed_watch_clerks_sisters_knights.png |
| X10 | The Clerks' Cap | 2×2 | [X10_the_clerks_cap.png](icons/X10_the_clerks_cap.png) | IT-47_coursed_watch_clerks_sisters_knights.png |
| X11 | The Sisters' Gloves | 2×2 | [X11_the_sisters_gloves.png](icons/X11_the_sisters_gloves.png) | IT-47_coursed_watch_clerks_sisters_knights.png |
| X12 | The Sisters' Girdle | 2×1 | [X12_the_sisters_girdle.png](icons/X12_the_sisters_girdle.png) | IT-47_coursed_watch_clerks_sisters_knights.png |
| X13 | The Knights' Sword | 2×3 | [X13_the_knights_sword.png](icons/X13_the_knights_sword.png) | IT-47_coursed_watch_clerks_sisters_knights.png |
| X14 | The Knights' Helm | 2×2 | [X14_the_knights_helm.png](icons/X14_the_knights_helm.png) | IT-47_coursed_watch_clerks_sisters_knights.png |
| X15 | The Ringers' Door | 2×3 | [X15_the_ringers_door.png](icons/X15_the_ringers_door.png) | IT-48_coursed_ringers_choir.png |
| X16 | The Ringers' Medal | 1×1 | [X16_the_ringers_medal.png](icons/X16_the_ringers_medal.png) | IT-48_coursed_ringers_choir.png |
| X17 | The Ringers' Clapper | 1×3 | [X17_the_ringers_clapper.png](icons/X17_the_ringers_clapper.png) | IT-48_coursed_ringers_choir.png |
| X18 | The Choir's Mail | 2×3 | [X18_the_choirs_mail.png](icons/X18_the_choirs_mail.png) | IT-48_coursed_ringers_choir.png |
| X19 | The Choir's Pitch-pipe | 1×1 | [X19_the_choirs_pitch_pipe.png](icons/X19_the_choirs_pitch_pipe.png) | IT-48_coursed_ringers_choir.png |
| X20 | The Choir's Ring | 1×1 | [X20_the_choirs_ring.png](icons/X20_the_choirs_ring.png) | IT-48_coursed_ringers_choir.png |
| X21 | The Saints' Blade | 1×3 | [X21_the_saints_blade.png](icons/X21_the_saints_blade.png) | IT-49_coursed_saints_decoymen.png |
| X22 | The Saints' Byrnie | 2×3 | [X22_the_saints_byrnie.png](icons/X22_the_saints_byrnie.png) | IT-49_coursed_saints_decoymen.png |
| X23 | The Saints' Ring | 1×1 | [X23_the_saints_ring.png](icons/X23_the_saints_ring.png) | IT-49_coursed_saints_decoymen.png |
| X24 | The Saints' Locket | 1×1 | [X24_the_saints_locket.png](icons/X24_the_saints_locket.png) | IT-49_coursed_saints_decoymen.png |
| X25 | The Decoy-men's Coat | 2×3 | [X25_the_decoy_mens_coat.png](icons/X25_the_decoy_mens_coat.png) | IT-49_coursed_saints_decoymen.png |
| X26 | The Decoy-men's Whistle | 1×1 | [X26_the_decoy_mens_whistle.png](icons/X26_the_decoy_mens_whistle.png) | IT-49_coursed_saints_decoymen.png |

## Ghi chú

### Item trong danh mục chưa có icon

- E02 (chờ bảng tên §8): chưa vẽ trong sheet nào
- E33 NEVER: chưa vẽ trong sheet nào

### Footprint khác bảng base gốc của §1.3

- A08 Ash-Veil: 2×3, quy tắc loại «mũ» cho 2×2; người dùng chọn footprint này (quyết định 26/10/2026) vì sheet vẽ một tấm màn dài, không theo cỡ mũ. Đây là ghi chú, không phải lỗi.

### Item chưa có dòng base trong bảng §1.3

A16 (2×3), A17 (2×3), A18 (2×3), A19 (2×3), A20 (2×2), A21 (2×2), A22 (2×2), A23 (2×2), A24 (2×2), A25 (2×2), A26 (2×2), A27 (2×2), A28 (2×2), A29 (2×2), A30 (2×2), A31 (2×2), A32 (2×1), C10 (1×1), C11 (1×1), C12 (1×1), C13 (1×1), C14 (1×1), C15 (1×1), C16 (1×1), C17 (1×1), C18 (1×1), C19 (1×1), C20 (1×1), C21 (1×2), C22 (1×2), C23 (1×3), C24 (1×3), E01 (1×1), E03 (1×1), E04 (1×1), E05 (1×1), E06 (1×1), E07 (1×1), E08 (1×1), H01 (2×2), H02 (2×2), H03 (1×3), H04 (1×3), H05 (1×1), H06 (2×2), H07 (1×3), H08 (2×2), H09 (1×3), H10 (1×2), H11 (1×3), H12 (1×2), H13 (1×3), H14 (1×3), H15 (1×3), H16 (2×2), H17 (2×2), H18 (1×3), H19 (2×3), H20 (2×3), H21 (2×1), H22 (1×1), H23 (2×3), H24 (2×4), H25 (2×4), H26 (2×3), H27 (2×3), H28 (1×4), H29 (2×3), H30 (2×2), H31 (2×2), H32 (2×2), H33 (1×3), H34 (1×2), H35 (1×4), H36 (2×4), H37 (2×3), H38 (2×1), H39 (1×3), H40 (2×3), H41 (2×3), H42 (2×3), H43 (1×2), H44 (2×4), H45 (2×2), H46 (2×3), H47 (2×3), J08 (1×1), J09 (1×1), J10 (1×1), J11 (1×1), J12 (1×1), J13 (1×1), K06 (1×1), O06 (2×2), O08 (1×2), O09 (1×2), O10 (1×2), O11 (2×2), O12 (2×2), O13 (2×2), O14 (2×2), O15 (2×2), O16 (2×3), O17 (2×3), O18 (2×3), Q03 (2×2), Q04 (2×2), Q05 (2×2), Q06 (1×1), Q08 (2×2), Q09 (1×2), Q10 (2×2), Q11 (1×2), Q12 (2×2), Q13 (1×1), Q14 (1×1), Q15 (2×2), Q16 (2×2), Q17 (1×2), Q18 (1×1), Q19 (1×1), Q20 (1×1), R02 (2×2), R03 (1×2), R04 (1×2), S01 (1×1), S02 (1×1), S03 (1×1), S04 (1×1), S05 (1×1), S06 (1×1), S07 (1×1), S08 (1×1), S09 (1×1), S10 (1×1), S11 (1×1), S12 (1×1), S13 (1×1), S14 (1×1), T01 (1×1), V01 (1×2), V02 (1×2), V03 (1×2), V04 (1×2), V05 (1×3), V06 (1×3), V07 (1×3), V08 (1×3), V09 (1×1), V10 (1×1), V11 (1×1), V12 (1×1), W17 (2×3), W18 (1×2), W19 (1×3), W20 (2×3), W21 (2×3), W22 (2×3), W23 (1×3), W24 (1×3), W25 (1×3), W26 (2×3), W27 (2×3), W28 (1×3), W29 (1×3), W30 (1×3), W31 (1×3), W32 (1×4), W33 (2×3), W34 (1×3), W35 (2×3), W36 (1×2), W37 (1×2), W38 (2×4), W39 (2×4), W40 (1×3), W41 (1×4), W42 (1×4), W43 (1×2), W44 (1×2), W45 (2×3), W46 (2×3), W47 (2×3), W48 (2×3), W49 (2×4), W50 (2×3), W51 (1×3), W52 (2×4), W53 (2×4), W54 (2×3), W55 (2×3), W56 (1×3), W57 (1×3), W58 (2×3), W59 (2×3), W60 (1×2), W61 (1×2), W62 (1×2), X01 (2×3), X02 (2×1), X03 (2×2), X04 (2×2), X05 (2×1), X06 (2×2), X07 (2×3), X08 (2×2), X09 (2×2), X10 (2×2), X11 (2×2), X12 (2×1), X13 (2×3), X14 (2×2), X15 (2×3), X16 (1×1), X17 (1×3), X18 (2×3), X19 (1×1), X20 (1×1), X21 (1×3), X22 (2×3), X23 (1×1), X24 (1×1), X25 (2×3), X26 (1×1).
