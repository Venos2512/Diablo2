# P02_hush_herald_censer

Hand-held item of [P02_hush_herald](../../monsters/P02_hush_herald/) (approved concept group `ashlar-chot`), built separately because the
monster's T-pose leaves it out (REMOVE in the monster's `design.txt`). Item: brass censer ball with cut-out stars, top ring and a long chain.

Source image (2026-10-22): no Astra image. Codex/Astra was at its usage limit (until 2026-10-27 15:40), so
`prop_input.png` is cut from the concept's WEAPON/PROP column (`concept.png`, box x0 y0 x1 y1 = 615 430 800 627): guide lines filled from
the rows around them, ground shadow and labels removed, item centred on a 1024² canvas in the concept's grey.
Route: single-image Smart Mesh (Generate 100, 4 variants) -> Smart UV -> Texture 4K with the same image -> PBR -> GLB
(operator glue `E:\tmp_tripo_all\ops\p1s.sh` / `p2s.sh`). Variant 0 chosen; see `tripo.log`, `_shots/`.
Notes: the chain is solid chunky links that lie on the ground beside the censer as in the concept; for a hanging censer cut or re-rig the chain in the engine. No smoke.
Not done: socket/attachment point, rig, in-game scale (GLB source is 1 m tall/long on its largest axis).
