# V2 — new creatures, Diablo II source color mood

User: reuse the same 20 sessions and generate additional different creatures while retaining the color mood of the corresponding original Diablo II monster. One new concept per existing session, 20 new sheets total. Keep prior concept.png untouched.

## Priority
Color reference is the ORIGINAL Diablo II family, not the previous generated PNG or uniform project grey. Inspect relevant original reference/sprite assets under legacy/bestiary/assets and data under legacy/bestiary/src before defining the palette; record exact reference path and which family/variant it represents. If no exact original image is available, use a documented family palette approximation and explicitly disclose it, never claim an extracted canonical palette. Preserve distinguishing hue relationships, saturation and worn material mood. Original Fallen should retain a recognizable dirty red/orange flesh mood; do not turn all monsters grey. Skeleton dirty ivory, rusty materials and real spell color cues remain meaningful. Keep Act I restrained lighting, no neon/bloom.

Create a visibly different creature through anatomy, locomotion, head silhouette and body proportions. Not a reskin, gear swap or a second pose of the previous monster. Specific redesign assignments are in variant-designs.json. Original art, grounded dark fantasy, restrained horror.

## Delivery
Use verified Codex CLI built-in image_gen route from CLI_RECOVERY.md, not API fallback, no API key needed for this route. Read imagegen skill. Write unique CLI prompt/task/result files only in your assigned /variants/v2/ folder. Generate one actual 16:9 PNG sheet (large 3/4 game view and smaller front/side/rear views; no text or logo). Save concept.png, prompt.txt and README.md with honest QA and palette-source evidence in /variants/v2/. Never overwrite originals. If destination exists, select next unused v3/v4 folder. Do not open additional T3 sessions, spawn agents, commit or push. If earlier run is active, finish it before this queued followup.

