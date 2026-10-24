# THE DYING GODS — ACT I

Exactly 34 original monsters across six families, as specified by the user. roster.json preserves individual anatomy and ordered palettes (dominant, secondary, accent). assignments.json maps them once to the same existing 20 sessions. This NEW batch brief supersedes all earlier D2 monster assignments and reinterpretations for these deliverables; preserve earlier images.

## Family rules
- Redbound / Hồng Phược (7): đỏ huyết, xương trắng, hình thể gù và tay dài. Red approximately 65–75% of BODY surface, distinguish specified red shades. Bone contrasts against Weeping Fields dark grass. No generic grey-skinned goblins, borrowed Bell Thief or prior redesigns.
- Restless / Xác Không Yên (6): tông lạnh, thịt chết, xương cũ và vải mục. Natural desaturated colors, silhouette/motion distinguish units.
- Blightbeasts / Dã Thú Dịch Bệnh (6): màu động vật tự nhiên giảm bão hòa, xương và da bệnh lộ ra. Correct animal species, restrained disease, no gratuitous gore.
- Rootborn / Sinh Vật Rễ Máu (5): gỗ đen, xanh rêu, gai khô và thần huyết đỏ bên trong. Strong dark wood masses, controlled red sap/core/veins. Bloodbloom has dominant red petals; do not force invented red glow on Thornling. No neon.
- Forsworn / Kẻ Phản Thệ (5): humans in practical clothes, old armor, dark iron and leather. Materials show profession/class, no flashy colors, demon mutations or sexualized costumes.
- Consecrated / Kẻ Được Thánh Hóa (5): ritual black, white wax, ivory bone, old sacred gold, blood red accents. Dangerous solemn end-of-Act mood. Increase black/ivory contrast; honor individual exceptions such as ivory-robed Acolyte. No clean chrome.

## Color
65% dominant / 25% secondary / 10% accent is a MATERIAL starting guideline, not compulsory pixel ratios/background coverage. Redbound body-red 65–75% takes priority. User provided color NAMES, not numeric HEX. Proposed swatches must be labeled concept interpretations, never user-specified HEX. Natural subdued colors still visibly distinct; do not make everything grey. Check in neutral lighting. Any VFX/glow remains localized.

## Sheets
One monster = ONE actual AI PNG, approximately 16:9: large full-body elevated three-quarter game view and smaller consistent front, side, rear views. Same anatomy/equipment/materials in every view. Plain neutral dark-grey background, soft neutral-cool upper-left lighting, contact shadows. No scenery/HUD/text/labels/logo/watermark. Grounded Diablo II-inspired dark fantasy, semi-realistic broad shapes, low-to-moderate detail, readable game-scale silhouettes; original art, no copied sprites. Exact user species, signature features and equipment take precedence over older variant designs. Attack function may be suggested with restrained cues; no separate explosion/gore sheet needed.

## Execution and delivery
Read imagegen skill. Use VERIFIED Codex CLI builtin image_gen (outer T3 catalog missing image_gen is not a blocker):
Get-Content -LiteralPath '<unique-cli-task-file>' -Raw -Encoding UTF8 | codex exec --enable image_generation -s workspace-write -C E:/Diablo2 -o '<unique-cli-result-file>' -
Write full task/prompt to file; require CLI to use actual image_gen, inspect PNG and copy from generated_images. No API/Python fallback, API key, code drawing or placeholders. Separate prompt and image per monster; work assigned monsters sequentially. No duplicate jobs/new T3 sessions/spawned agents/commits/pushes/unrelated edits.

Output: E:/Diablo2/legacy/art-output/dying-gods-act1/<monster-id>/concept.png, prompt.txt, README.md with actual generation method, source path, proposed swatches, honest QA; unique CLI task/result within same folder. Never overwrite old image; use versioned sibling if occupied. Check correct anatomy, signature feature, palette/family, consistency, no crop/text. At most one corrective generation for a major failure. Do not claim measured color percentages from visual inspection. Complete only once actual PNG is saved and inspected. Queue after earlier work if still active.

