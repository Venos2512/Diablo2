#!/usr/bin/env python3
"""Build normal/manifest.json: one Codex (gpt-6-astra image_gen) normal-map job per terrain-biomes-v1 albedo.

Each job attaches albedo1024/{id}.png as the edit target and asks for the matching OpenGL tangent-space
normal map with the same layout. Run tools/generate_textures.py --manifest normal/manifest.json to generate;
raw outputs land in normal/textures/{id}.png.
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
BASE = HERE.parent

# per texture: (English material name, features that must stay in place, relief brief)
R = {
    "BIO01_peat": ("wet peat soil", "peat patch, moss island and reed mark",
        "mostly low, gently undulating soft mud; the grey-olive moss islands are slightly raised soft cushions with "
        "rounded edges; the few reed marks are shallow flattened grooves; very gentle overall strength"),
    "BIO02_meadow": ("low moor grass", "grass clump and earth gap",
        "the olive grass clumps are low raised soft rounded mounds with lumpy clustered tops; the dark earth gaps "
        "between them are recessed and smooth; soft, gentle strength"),
    "BIO03_flint": ("flint paving in peat mortar", "paving stone, mortar gap, loose chip and moss stain",
        "the grey flint paving stones are raised slabs with worn rounded edges and gently domed, slightly uneven "
        "chipped tops; the dark brown peat mortar between them is clearly recessed and softly lumpy; small loose "
        "stones in the mortar are small rounded bumps; moss stains are nearly flat"),
    "BIO04_ossuary": ("ossuary mortar with bone-coloured stone", "bone-coloured inclusion, mortar patch and joint",
        "the compressed bone-coloured stone inclusions sit almost flush, only slightly raised with soft rounded "
        "edges; the umber mortar is softly lumpy hand-patched masonry; joints are shallow soft grooves; low overall "
        "strength"),
    "BIO04_garden": ("cultivated garden earth", "loam clod and furrow",
        "soft cultivated earth: broad rounded loam clods slightly raised, soft crumbly lower furrows between them; "
        "gentle strength"),
    "BIO05_lime": ("clean limewashed floor", "floor area and joint line",
        "an almost flat smooth limewashed floor: the faint joints are thin, very shallow soft grooves, plus a faint "
        "broad undulation; very low strength, mostly flat #8080FF"),
    "BIO06_flint_spoil": ("chalk spoil with flint fragments", "chalk sediment area and flint fragment",
        "packed chalky sediment with soft low bumps; the dark flint fragments are slightly raised flat angular chips "
        "with soft bevels; low to moderate strength"),
    "BIO06_salt_mine": ("salt mine floor", "salt rock plane and seam",
        "broad compressed salt rock planes, very slightly faceted at different tilts; the coloured seams are shallow "
        "soft grooves; low strength"),
    "BIO07_limestone": ("sooty limestone paving", "paving block, mortar seam and soot patch",
        "the handcut limestone paving blocks are raised with slightly rounded worn edges and gently uneven tops; the "
        "lime mortar seams are recessed; soot patches are colour only and have no relief"),
    "BIO08_nave": ("cathedral nave slabs", "stone slab and joint",
        "the elongated stone slabs have flat, slightly worn tops and softly rounded edges; the narrow joints are "
        "recessed grooves; soot darkening is colour only and has no relief"),
    "BIO09_ash_snow": ("ash-grey snow over stone", "snow and ash mass and dark stone exposure",
        "the smooth rounded pale snow and ash drifts are softly raised pillowy masses; the dark slate exposures are "
        "lower hollows between them with slightly angular rock; soft overall strength"),
    "BIO10_salt_crust": ("cracked salt crust", "salt crust polygon and fissure",
        "large salt crust polygons whose borders are gently lifted, rounded raised rims, with slightly dished flat "
        "centres; the thin grey fissures are narrow recessed cracks; low to moderate strength"),
    "BIO11_white_hulk": ("white lime plaster floor", "plaster area and joint line",
        "very smooth lime plaster, almost flat; the faint structural joint lines are shallow soft grooves; very low "
        "strength, mostly flat #8080FF"),
    "BIO12_dark_planks": ("old ship floorboards", "floorboard, seam, repair patch and peg",
        "wide parallel wooden boards with flat tops and slightly rounded long edges; deep narrow recessed seams "
        "between boards; sparse broad soft grain grooves running along each board; pegs are small round shallow "
        "bumps; repair patches follow the board shapes"),
    "BIO13_salt_glass": ("seamless salt glass", "milky cloud variation",
        "one continuous, almost perfectly flat polished surface: nearly uniform #8080FF with only an extremely faint, "
        "very broad soft undulation; no seams, cracks, bumps or edges"),
    "BIO14_blue_ice": ("blue glacial ice and snow", "ice plane, snow island and fissure",
        "the soft blue snow islands are gently raised rounded pillowy mounds; the dark glacial ice is lower, smooth "
        "and flat with a few broad facets; the long fissures are thin recessed cracks"),
    "BIO15_pyre_ash": ("packed cold pyre ash", "ash mass and charcoal shape",
        "packed soft ash with low broad rounded undulations; the flattened charcoal shapes are slightly raised flat "
        "chunks with soft broken edges; gentle strength"),
    "BIO16_blackwood": ("blackened timber planks", "plank, joint, grain line and frost smudge",
        "massive parallel timber planks with flat tops and slightly rounded edges; the joints are deep narrow "
        "recessed seams; restrained broad carved grain grooves run along each plank; frost smudges are colour only "
        "and have no relief"),
    "BIO17_varnished": ("varnished floorboards", "floorboard and joint",
        "carefully fitted boards with smooth flat varnished tops and slightly rounded edges; tight narrow recessed "
        "seams; very faint broad grain; low strength"),
    "BIO18_wet_slate": ("harbour slate paving", "slate paving stone, joint and stain",
        "large uneven slate paving stones, raised, with flat slightly layered and chipped tops and worn softened "
        "edges; the joints are recessed; damp stains are colour only and have no relief"),
    "BIO19_coastal_rock": ("black coastal rock", "rock plane, strata step and fissure",
        "broad weathered walkable rock planes with low angular stratified steps and facets; the shallow fissures are "
        "recessed; moderate strength while the ground still reads as walkable and level overall"),
    "BIO20_wet_sand": ("wet tidal sand", "ripple band and silt patch",
        "compacted wet sand with broad, very subtle, smooth shallow ripples following the visible bands; silt "
        "patches are flat; low strength"),
    "BIO21_sunken_floor": ("sunken chapel slabs", "stone slab, joint and algae stain",
        "large chapel stone slabs, raised, with softly worn rounded edges and gently uneven tops; the joints are "
        "recessed; algae stains are colour only and have no relief"),
    "BIO22_abbey": ("patched abbey slabs", "floor slab, mortar repair, joint and wax smudge",
        "large old floor slabs, raised, with worn rounded edges and slightly uneven tops; the mortar repairs and "
        "joints are recessed and lumpy; the pale wax smudges are slightly raised soft blobs"),
    "BIO23_course": ("stone blocks and mortar", "stone block and mortar seam",
        "massive hand-worked stone blocks, raised, with rounded hand-shaped edges and gently domed, slightly "
        "chiselled tops; the soft warm mortar seams are clearly recessed; moderate strength"),
    "BIO24_keystone": ("precise mason stone blocks", "stone block, joint and chisel plane",
        "precisely cut stone blocks with flat tops and crisp but slightly softened edges; narrow straight recessed "
        "joints; restrained broad chisel facets on the block tops"),
    "BIO26_dream": ("dream garden grass and earth", "grass mass, earth area and leaf tuft",
        "the soft straw-gold grass masses are low raised rounded mounds; the cream earth between them is lower and "
        "smooth; the leaf-shaped tufts are small soft bumps; gentle strength"),
    "BIO27_cradle": ("pale chalk and bone floor", "mineral floor area and faint seam",
        "a smooth matte chalk floor, almost flat; the faint organic seams are very shallow soft grooves; very low "
        "strength, mostly flat #8080FF"),
    "BIO27_vault": ("bone slabs in soot stone", "bone-toned slab, dark stone gap and tallow stain",
        "heavy bone-toned slabs slightly raised above the soot-dark stone, with worn rounded edges and uneven tops; "
        "the dark stone between them is recessed; tallow stains are colour only and have no relief"),
    "BIO27_salt": ("pale salt crystal floor", "crystal plane and boundary",
        "broad flat crystal planes, each slightly tilted differently, meeting at soft shallow ridges and grooves "
        "along the faint boundaries; low strength"),
    "BIO27_deep": ("frosted deep ice floor", "ice plane and cloudy inclusion",
        "large smooth flat glass-ice planes with a very broad gentle undulation; the cloudy inclusions are inside "
        "the ice and have no relief; very low strength, mostly flat #8080FF"),
}

TPL = (
    "Use case: texture edit, material map derivation. The attached image is the EDIT TARGET: a seamless square "
    "stylized hand-painted terrain base-color texture ({material}) for the ASHLAR top-down ARPG. "
    "Task: transform this exact image into its matching tangent-space NORMAL MAP, using the attached image as the "
    "edit input (num_last_images_to_include 1). Keep the exact same composition, framing and scale: every {features} "
    "stays at exactly the same position, size and outline, so the normal map overlays the attached texture pixel for "
    "pixel. Do not move, add, remove, redraw, zoom, crop, rotate, mirror or rearrange anything; only replace the "
    "colours with surface-direction colours. "
    "Relief: {relief}. "
    "Encoding: standard OpenGL tangent-space normal map (Y+ up, as used by three.js, Unity and Blender). Flat level "
    "areas are #8080FF (RGB 128,128,255). Red encodes X: slopes facing the right edge of the image are pinker, slopes "
    "facing the left edge are more cyan. Green encodes Y: slopes facing the top edge of the image are greener, slopes "
    "facing the bottom edge are more violet. So raised shapes look lit from the upper right and recesses look lit "
    "from the lower left. Blue stays high everywhere. Only these lavender-blue normal map colours: no albedo colours, "
    "no greyscale, no baked lighting, cast shadows, ambient occlusion, highlights, specular, glow or outlines. "
    "Style: soft broad stylized relief that suits low-detail hand-painted terrain: rounded bevels, gentle slopes, "
    "moderate strength; no fine grain noise, pixel speckle, sharp embossed rims or photoreal micro detail. "
    "Tiling: it must repeat seamlessly on all four edges exactly like the source; no border, frame, vignette, label, "
    "text, watermark or swatch grid. Square, full bleed."
)


def main():
    src = json.loads((BASE / "manifest.json").read_text(encoding="utf-8"))
    ids = [j["id"] for j in src]
    if set(ids) != set(R):
        raise SystemExit(f"relief table out of sync with manifest: {sorted(set(ids) ^ set(R))}")
    out = []
    for j in src:
        i = j["id"]
        material, features, relief = R[i]
        ref = BASE / "albedo1024" / f"{i}.png"
        if not ref.is_file():
            raise SystemExit(f"missing albedo {ref}")
        out.append({
            "id": i, "biome_id": j["biome_id"], "name_vi": j["name_vi"], "material": j["material"],
            "map": "normal", "albedo": f"albedo1024/{i}.png",
            "prompt": TPL.format(material=material, features=features, relief=relief),
            "reference": ref.as_posix(),
        })
    (HERE / "manifest.json").write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{len(out)} jobs -> {HERE / 'manifest.json'}")


if __name__ == "__main__":
    main()
