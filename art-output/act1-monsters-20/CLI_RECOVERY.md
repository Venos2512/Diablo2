## CLI recovery — authorized by user

The user explicitly requested reusing the same 20 T3 sessions through Codex CLI. This supersedes the earlier stop-on-missing-parent-image_gen requirement: use Codex CLI to access its built-in image_gen. Verified working: codex-cli 0.163.0 with image_generation enabled generated output/imagegen/fallen-bell-thief/concept.png using the account login, without an API key. Do not use the Python/API fallback or procedural drawing.

Each existing session should invoke codex exec --enable image_generation -s workspace-write -C E:/Diablo2 with a unique prompt file piped to stdin and a unique --output-last-message path in its own assigned folder. The CLI helper must use built-in image_gen, copy the actual generated PNG into the assigned folder, inspect it, and record actual prompt + honest QA. Preserve skill instructions. No extra T3 sessions and no spawning agents. No git changes beyond new assigned output files.

Designs should be original reinterpretations of Act I families, visibly different from original monsters through silhouette, equipment and role story, retaining family readability. Use the Bell Thief image as an example of degree of redesign, not as a design to copy to all monsters.


