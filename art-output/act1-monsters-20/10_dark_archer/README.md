# Widow Bow Rogue — Dark Archer concept

## Deliverable and method

- Final: concept.png, one actual AI-generated concept sheet.
- Method: authorized local Codex CLI recovery (`codex exec --enable image_generation`) using its built-in image_gen tool (image_gen__imagegen) and account login, opaque background. No scripts/image_gen.py, direct API fallback, procedural drawing, web images, delegated agents, or extra T3 threads.
- Two generation calls: initial generation and one correction retry. Retry 1 is the selected final. The generated PNG was copied without resizing, repainting, or other image modification.
- Selected generation source: C:/Users/HLC_2021/.codex/generated_images/01a14ac7-0550-7592-958e-edabec25c042/exec-76877496-f52b-4c87-aa55-ada645778a99.png
- Initial unselected source: C:/Users/HLC_2021/.codex/generated_images/01a14ac7-0550-7592-958e-edabec25c042/exec-f407426c-e670-4acc-81a7-acf72d151ce8.png
- Exact prompts: prompt.txt begins with the unchanged supplied initial prompt. The section "RETRY 1: exact complete prompt" contains the complete selected generation prompt, including its appended correction requirements. Section markers were not sent to image_gen.
- Both local references were inspected with view_image before generation: asset_01_cart_turnaround.png for separated sheet composition, and _refs/ref_v3_bonfire.png for material/style continuity. They were visually consulted; no image paths were passed as image-generation inputs. The bonfire scene was not reproduced.
- Read project BRIEF.md, CLI_RECOVERY.md, continuity chapters 00, 06 and 12, and BRIEF_NATURE_PROPS.md. The user's explicit authorization to access built-in generation through local Codex CLI governed execution; the outer T3 session itself lacked image_gen.

## Actual sheet order

Top row, left to right: neutral grey adult human scale silhouette; near-front bow-ready view; side-oriented view; rear view; slightly elevated front three-quarter view.

Bottom row, left to right: full-draw attack; solid black bow-ready silhouette; smaller elevated three-quarter view.

## Original reinterpretation

Canonical inspiration is the human Corrupt Rogue / Dark Archer family and its ranged combat role. This design reimagines her as a former monastery funeral escort: asymmetric burgundy mourning wool, a stiff weathered shoulder flap, patched leather and trousers, wrapped boots, a low hip quiver and a repaired wooden bow. Pale skin, tense posture and an unsmiling face retain restrained human corruption. No canonical sprite or scene was used as a source asset.

## Visual QA

Inspected the actual generated output and called view_image on the source and copied final.

- One sheet, two rows, one adult human monster design with repeated views and one additional neutral human scale reference. Full bodies and bows fit within the final canvas; no labels, watermark, border, logo, environment, gore, glowing eyes, sword or shield.
- Cold muted grey leather and burgundy wool read against dark grey. Stave bows, strings, arrows and a readable full-draw attack are present. Anatomy is broadly credible at concept-sheet scale.
- The correction removed the initial generation's cropped upper bow tip and changed the dedicated black silhouette from full draw to bow-ready.
- Deviations: front and side turnarounds are slightly rotated rather than strict orthographic views. The upper game view is shallower than the specified 50–60 degrees. The small figure is roughly 180 pixels tall rather than 75 pixels.
- Background appears close to the requested dark neutral grey, but has subtle tonal variation/contact shading rather than a certified uniform #3A3A3A fill.
- Clothing has more folds, tears, seams and surface detail than the requested broad low-detail treatment. Hair is somewhat longer than a tight crop; quiver is more cylindrical than flattened; the iron splice is not strongly distinguished from bindings.
- Bow construction and nocking should receive a dedicated model/rig review: string and arrow intersections are small, and their mechanical coherence cannot be certified from this concept. The black silhouette's quiver/stance does not perfectly match all colored views. Fine equipment and shoulder consistency are approximate.
- Human reference is comparable to the main views and does not dwarf the monster. The crouch is modest; these are visual targets rather than measured 1.8 m orthographic drawings.
- Accepted as a concept handoff with the deviations above; not a fully compliant orthographic model sheet or engine-ready sprite. No further retry for these retained variations.

## File verification

- PNG exists: 1,621,147 bytes.
- IHDR dimensions: 1672 × 941 pixels, approximately 16:9 (not mathematically exact).
- PNG signature: 89 50 4E 47 0D 0A 1A 0A.
- SHA-256: 8D0E63231D1954727306905C349350538E58C62A86752EEE42FFAF43460CA083.
- Only the assigned Dark Archer folder received project writes. No commits or pushes.
