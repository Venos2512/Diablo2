# U03_charnel_bowman_bow

Hand-held item of [U03_charnel_bowman](../../monsters/U03_charnel_bowman/) (approved concept group `ashlar-chot`), built separately because the
monster's T-pose leaves it out (REMOVE in the monster's `design.txt`). Item: long yew bow with string and cord wraps.

Source image (2026-10-22): no Astra image. Codex/Astra was at its usage limit (until 2026-10-27 15:40), so
`prop_input.png` is cut from the concept's WEAPON/PROP column (`concept.png`, box x0 y0 x1 y1 = 690 140 765 614): guide lines filled from
the rows around them, ground shadow and labels removed, item centred on a 1024² canvas in the concept's grey.
Route: single-image Smart Mesh (Generate 100, 4 variants) -> Smart UV -> Texture 4K with the same image -> PBR -> GLB
(operator glue `E:\tmp_tripo_all\ops\p1s.sh` / `p2s.sh`). Variant 0 chosen; see `tripo.log`, `_shots/`.
Notes: the string is a very thin strip; check it at game scale.
Not done: socket/attachment point, rig, in-game scale (GLB source is 1 m tall/long on its largest axis).
