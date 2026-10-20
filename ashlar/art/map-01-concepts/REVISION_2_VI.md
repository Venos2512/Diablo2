# Map 01 concept — bản sửa 2 (2026-10-20)

Sửa theo góp ý của người dùng ngày 2026-10-20, áp cho cả 60 sheet quái (30 loại × A/B):

1. Tạo hình bám Diablo hơn (họ Diablo Immortal / Diablo III).
2. Mỗi con có **màu chính, màu phụ và một màu nhấn** rõ ràng. Bảng màu là **đề xuất**, rút từ màu key trong `ASHLAR_QUY_CHUAN_QUAI_VI.md` mục 4.
3. Zombie (U01, U04, U05) rách rưới hơn, cách điệu hơn: dải rách to, khối gọn, không thêm texture nhỏ.
4. Bố cục mới:
   - Bóng người **H** (1H).
   - **Một góc 3/4 cầm vũ khí.**
   - **Ô vũ khí/đạo cụ vẽ riêng**, có ở 20 sheet.
   - **Bốn góc LEFT/RIGHT/FRONT/BACK ở T-pose, tay không**. Quái không dạng người dùng tư thế đứng trung tính, chân/cánh/đuôi tách khỏi thân.
5. Đúng tỉ lệ so với H. Mỗi sheet có ảnh khung tỉ lệ `_brief/templates_r2/<ID>.png`: bóng người đúng 1H, đường nền, vạch chiều cao, thước dài, nhãn. Với con nhỏ, khung có thêm khối định vị mờ. Astra vẽ đè lên khung, nên các vạch đo còn lại trong ảnh để đọc kích thước.

## File

- Ảnh mới cạnh ảnh cũ, không ghi đè:
  - `vA|vB/concept_r2.png`: bản chính.
  - `concept_r2b.png`: bản chạy lại; khi có thì bản này là bản chọn.
  - `concept.png` (U01 A: `concept_v3.png`): bản trước khi sửa, vẫn giữ.
- Mỗi ảnh có kèm `*.prompt.txt`, `*.task.txt`, `*.generation.log`, `*.result.txt`.
- Prompt:
  - `_brief/prompts_r2/<ID>.txt`.
  - 9 con nhỏ chạy lại có thêm ràng buộc kích thước pixel: `_brief/prompts_r2/<ID>.r2b.txt`.
- Tạo bằng `codex exec` (gpt-6-astra, image_gen có sẵn), 10 phiên song song. Codex home đặt ở `E:\map01-batch\home` vì ổ C: đầy. Runner nằm ngoài repo, ở `E:\map01-batch\`.

## Bản chọn và bảng màu (đề xuất)

| Quái | A | B | Màu chính | Màu phụ | Màu nhấn |
|---|---|---|---|---|---|
| U01 SHAMBLER | `monsters/U01_shambler/vA/concept_r2.png` | `monsters/U01_shambler/vB/concept_r2.png` | dirty grave-linen grey #8C8577 (the tattered shroud rags) | rotten peat brown #4A3526 (under-wraps, leg wraps, mud) | không (quy tắc Prologue) |
| U02 CHARNEL DEAD | `monsters/U02_charnel_dead/vA/concept_r2b.png` | `monsters/U02_charnel_dead/vB/concept_r2.png` | aged bone ivory #D8CCB0 (the skeleton) | rotted dark-brown coffin wood and leather #4A3526 with dull iron #5A5F66 fittings | không (quy tắc Prologue) |
| U03 CHARNEL BOWMAN | `monsters/U03_charnel_bowman/vA/concept_r2.png` | `monsters/U03_charnel_bowman/vB/concept_r2.png` | aged bone ivory #D8CCB0 (the skeleton) | dark yew-wood and leather brown #5A4A36 (bow, quiver, straps, hood rag) | poppy red #B3262A (fletching and one arm band) |
| U04 CHARNEL GHOUL | `monsters/U04_charnel_ghoul/vA/concept_r2.png` | `monsters/U04_charnel_ghoul/vB/concept_r2.png` | corpse grey-olive flesh #6E6A5C | stained pale burial linen #B8AE96 (the shredded smock) | poppy red #B3262A (inside of the gaping mouth and one rag tie) |
| U05 THE SWOLLEN | `monsters/U05_the_swollen/vA/concept_r2.png` | `monsters/U05_the_swollen/vB/concept_r2.png` | drowned blue-green corpse skin #5E6B5A (the bloated body) | dark peat-brown rags #3B3127 | poppy red #B3262A (coarse stitches across the drum-tight belly) |
| W01 MORTAR-RAT | `monsters/W01_mortar_rat/vA/concept_r2.png` | `monsters/W01_mortar_rat/vB/concept_r2b.png` | mortar-grey hairless skin #A39F93 | dark slate brown #4F4840 (paws, snout, tail, skin folds) | không (quy tắc Prologue) |
| W02 GIBBET-CROW | `monsters/W02_gibbet_crow/vA/concept_r2b.png` | `monsters/W02_gibbet_crow/vB/concept_r2b.png` | tar-black feathers #17151A | raw bald pink-red head and neck skin #A8686A | pale bone beak and claws #D8CCB0 |
| W03 HUSH-WOLF | `monsters/W03_hush_wolf/vA/concept_r2.png` | `monsters/W03_hush_wolf/vB/concept_r2.png` | dusty brown fur #6B5D4B | torn pale grey-green nightshirt #A9B1A6 | small poppy-red embroidered collar #B3262A |
| W04 MIRE-SUCKER | `monsters/W04_mire_sucker/vA/concept_r2b.png` | `monsters/W04_mire_sucker/vB/concept_r2b.png` | dark peat-brown chitin #4A3526 | swollen blood-red belly #B3262A | smoky translucent grey wings #A9B1A6 |
| W05 CORPSE-CANDLE | `monsters/W05_corpse_candle/vA/concept_r2.png` | `monsters/W05_corpse_candle/vB/concept_r2.png` | pale cold blue-white flame #D8E7EF | dim grey face #A9B1A6 | deeper icy-blue core #6E8FA8 |
| W06 WILLOW-HULK | `monsters/W06_willow_hulk/vA/concept_r2.png` | `monsters/W06_willow_hulk/vB/concept_r2.png` | dark wet willow-root brown #4A3526 | drooping olive willow fronds #6E7B45 | bone-ivory skull and pale rope noose #D8CCB0 |
| W07 SHROUD-SPINNER | `monsters/W07_shroud_spinner/vA/concept_r2.png` | `monsters/W07_shroud_spinner/vB/concept_r2.png` | ash-grey chitin #6F6A62 | shroud-silk ivory #D8CCB0 (wrapped bundles and silk) | cluster of milky yellow eyes #C9B458 |
| F01 BODY-SNATCHER | `monsters/F01_body_snatcher/vA/concept_r2b.png` | `monsters/F01_body_snatcher/vB/concept_r2.png` | soot black-brown coat #1F1D22 | burlap sack and rope #6B5F4E | poppy-red cord #B3262A |
| F02 POPPY NURSE | `monsters/F02_poppy_nurse/vA/concept_r2.png` | `monsters/F02_poppy_nurse/vB/concept_r2.png` | white wimple and apron linen #E8E1D0 | dark charcoal-brown habit #3F3A34 | poppy-red embroidery #B3262A and silver needle steel #D8D8DC |
| P01 THE SOOTHED | `monsters/P01_the_soothed/vA/concept_r2.png` | `monsters/P01_the_soothed/vB/concept_r2.png` | nightgown linen #E8E1D0 | faded slate-blue quilt or shawl #5F6B7A | poppy-red stitched smile #B3262A (small) |
| P02 HUSH-HERALD | `monsters/P02_hush_herald/vA/concept_r2.png` | `monsters/P02_hush_herald/vB/concept_r2.png` | veil and robe linen #E8E1D0 | deep moss-olive over-robe #4E5A3A | poppy-red closed-eye embroidery #B3262A and a dull brass censer #B59A5B |
| P03 HUSH-MOTHS | `monsters/P03_hush_moths/vA/concept_r2b.png` | `monsters/P03_hush_moths/vB/concept_r2b.png` | soft linen-white wings #E8E1D0 | dusty grey-lilac body and wing powder #8F8796 | small poppy-red eye-spots on the wings #B3262A |
| P04 HIVE-SLEEPER | `monsters/P04_hive_sleeper/vA/concept_r2.png` | `monsters/P04_hive_sleeper/vB/concept_r2.png` | stained nightshirt linen #D9D0BC | sickly grey-green larval bulges #8E9C8A | poppy-red ribbon #B3262A |
| P05 WET-NURSE | `monsters/P05_wet_nurse/vA/concept_r2.png` | `monsters/P05_wet_nurse/vB/concept_r2.png` | dark olive-grey nurse dress #5B6248 | linen apron and swaddling bundles #E8E1D0 | poppy-red ribbons on the bundles #B3262A |
| P06 POPPY-MOUND | `monsters/P06_poppy_mound/vA/concept_r2.png` | `monsters/P06_poppy_mound/vB/concept_r2.png` | linen nightshirts and blankets #E8E1D0 | muted flesh rose #8A6A5A (faces, arms, the mound mass) | bright poppy flowers #B3262A |
| P07 CRADLE-WARDEN | `monsters/P07_cradle_warden/vA/concept_r2.png` | `monsters/P07_cradle_warden/vB/concept_r2.png` | stitched linen #E8E1D0 | dark charcoal straps and weathered bone cage #3F3A34 | poppy-red stitches #B3262A |
| D01 HODLING | `monsters/D01_hodling/vA/concept_r2b.png` | `monsters/D01_hodling/vB/concept_r2.png` | terracotta clay skin #9C4A2C | soot black #2A2224 (horns, hands, feet, loincloth) | kiln-orange crack light #E2622B (cracks only, small) |
| D02 KILN-SHAMAN | `monsters/D02_kiln_shaman/vA/concept_r2.png` | `monsters/D02_kiln_shaman/vB/concept_r2b.png` | soot-black robe and face #2A2426 | terracotta pot and clay skin #9C4A2C | kiln-orange glow #E2622B in the pot mouth and cracks |
| D03 KILN-BULL | `monsters/D03_kiln_bull/vA/concept_r2.png` | `monsters/D03_kiln_bull/vB/concept_r2.png` | terracotta clay plates #9C4A2C | soot-black legs, horns and joints #2A2224 | kiln-orange glowing nostrils and cracks #E2622B |
| D04 TITHE-THIEF | `monsters/D04_tithe_thief/vA/concept_r2.png` | `monsters/D04_tithe_thief/vB/concept_r2b.png` | terracotta clay skin #9C4A2C | burlap sack brown #6B5F4E | stolen gold coins and candlestick #D9A441 |
| B01 SEXTON'S DOG | `monsters/B01_sextons_dog/vA/concept_r2.png` | `monsters/B01_sextons_dog/vB/concept_r2.png` | dark brown fur #4A3526 | iron-grey collar and greying muzzle #5A5F66 | không (quy tắc Prologue) |
| B02 LULLABY MAN | `monsters/B02_lullaby_man/vA/concept_r2.png` | `monsters/B02_lullaby_man/vB/concept_r2.png` | patched linen #E8E1D0 | slate-blue patches and sleeper cocoons #5F7385 | poppy-red stitches #B3262A |
| B03 EMBER-POT | `monsters/B03_ember_pot/vA/concept_r2.png` | `monsters/B03_ember_pot/vB/concept_r2.png` | giant dark-glazed pot #5A2A1E | soot-black shaman with terracotta skin #2A2224 / #9C4A2C | kiln-orange glow #E2622B through the pot cracks and mouth |
| B04 WILLOW BRIDE | `monsters/B04_willow_bride/vA/concept_r2.png` | `monsters/B04_willow_bride/vB/concept_r2.png` | grey drowned wedding dress #8E8A80 | dark root-brown hair-roots #4A3526 | poppy-red flowers #B3262A |
| B05 HOSPICE MOTHER | `monsters/B05_hospice_mother/vA/concept_r2.png` | `monsters/B05_hospice_mother/vB/concept_r2.png` | vast linen veil and gown #E8E1D0 | deep grey-violet inner robes #4B4552 | warm amber night-lamp glow #E0A050 (one small lamp) |

## Còn tồn tại

- **P03 Hush-Moths A/B:** sau 3 lượt vẫn to khoảng 1,7× spec.
  - Lượt thứ 3 bị loại (`concept_r2c_rejected.png`) vì model tự dời vạch đo lên cho khớp hình.
- **B03 Ember-Pot:** pháp sư hơi to, khoảng 1,25× của 0,6H.
- Các con nhỏ chạy lại còn lệch khoảng 1,1–1,3×: W01 B, W04 A/B, D02 A.
- **Góc LEFT/RIGHT ở T-pose:** model hay vẽ tay đưa ra trước thay vì nhìn thẳng đầu tay. Vài sheet có nhãn LEFT/RIGHT đảo hướng mặt, ví dụ U02 A.
  - Khi tách góc cho Tripo, xác định góc theo nội dung (`art-output/tripo-models/Agent.md` bước 3), không theo nhãn.
- **Quái Prologue** (U01, U02, W01, B01) giữ quy tắc không có màu nhấn bão hòa.
- **Đồng xu trên mắt U01** trông như kính tròn vàng. Lỗi này thừa hưởng từ bản pilot đã duyệt.
- **Môi trường E01–E04:** đã có cả `perspective.png` (3/4) và `turnaround.png` (4 góc).
  - Asset lớn (liễu, tháp hài cốt, cổng) vẫn vẽ nhỏ hơn số đo; khi dựng model, lấy kích thước theo spec.
