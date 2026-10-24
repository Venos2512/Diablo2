# Writes three Codex CLI tasks (3 tiles each) for the natural D2R-style grass set: six grass patterns that get mixed
# into one larger tile, plus sparse grass/dirt, bare soil and damp ground for the dirt / mud splat layers.
# Reference image 1: the user's D2R gameplay screenshot (_refs/ref_d2r_grass.png).
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = 'E:/Diablo2/legacy/art-output/terrain-grass-d2r'

COMMON = (
    "seamless tileable texture, strictly orthographic top-down view straight down at the ground, painterly-realistic style of the "
    "attached Diablo II Resurrected screenshot (natural lush Act I grass), low detail: soft readable clumps and gentle value changes, "
    "no fine noisy grain, flat even neutral daylight albedo-like lighting (do NOT copy the screenshot's blue night tint or its "
    "spell light), no cast shadows, no light gradient, no vignette, no perspective, no horizon, no characters, no monsters, "
    "no blood, no effects, no items, no text, nothing large or special touching the edges, even density and even average "
    "brightness over the whole tile, about 3.5 metres of ground in the frame"
)

TILES = [
    ('grass_lush', "dense lush natural grass in fresh medium green, long soft blades lying in mixed directions, slightly lighter yellow-green tips, gentle darker hollows"),
    ('grass_deep', "dense deep green grass with darker blue-green clumps and soft shadows between tufts, rich and slightly darker than average"),
    ('grass_sunlit', "lighter yellow-green grass with sun-bleached tips mixed with fresh green, soft long blades, natural meadow"),
    ('grass_short', "shorter even grass in natural medium green, a little trampled, tiny bits of dark soil and a few fallen leaves peeking through"),
    ('grass_wild', "wild uneven grass: tall blades flattened in soft swirls, a few broad-leaf weeds and small clover patches, medium green"),
    ('grass_mossy', "grass mixed with soft moss and low ground plants, green with darker olive patches, a few tiny pale flowers"),
    ('grass_dirt', "brown earth with natural green grass tufts and patches covering about 40 percent, grass thinning out into soil, small pebbles"),
    ('soil', "bare brown forest-edge soil with a few small stones, dry grass bits and fallen leaves, natural, no green patches"),
    ('damp', "damp dark ground: dark wet soil and flattened dark green grass, two or three small shallow puddles that read dark grey-blue, natural"),
]

if __name__ == '__main__':
    for n in range(3):
        part = TILES[n * 3:n * 3 + 3]
        lines = [
            "Use your built-in image generation tool to create THREE separate square 1:1 images (one image generation call per image). "
            "Do not draw with code, do not use procedural generation, do not run codex. If image generation is not available, stop and say so.",
            "Reference image 1 is a Diablo II Resurrected gameplay screenshot: match its grass - natural, lush, green, painterly-realistic, "
            "the way blades and clumps read from the game camera - but draw ground ONLY, seen straight from above.",
        ]
        for i, (name, prompt) in enumerate(part, 1):
            lines.append(f"Image {i}: save as {OUT}/{name}.png - prompt: {prompt}, {COMMON}.")
        lines.append("Copy each image to its path right after it is generated (PNG). Do not touch any other file. "
                     "At the end, list the saved paths and, for each, one line on how seamless it looks.")
        with open(os.path.join(HERE, f'part{n + 1}.task.txt'), 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines) + '\n')
    print('3 tasks')
