import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import make_item_templates as m

ITEMS = [{"label": "A", "w": 2, "h": 3}, {"label": "B", "w": 1, "h": 3},
         {"label": "C", "w": 2, "h": 4}, {"label": "D", "w": 1, "h": 1}]


def spec(**k):
    return {"canvas": [2172, 724], "cell": 118, "title": "T", "items": ITEMS, **k}


def test_layout_rules():
    f = m.layout(spec())
    rects = [i["rect"] for i in f["items"]]
    assert f["cell"] == 118
    assert all(r[3] == f["baseline"] for r in rects)
    for r in rects:
        assert r[0] >= 0 and r[1] >= 0 and r[2] <= 2172 and r[3] <= 724
    for a, b in zip(rects, rects[1:]):
        assert b[0] - a[2] >= f["cell"] // 2
    assert abs(rects[0][0] - (2172 - rects[-1][2])) <= 1  # centred


def test_auto_shrink():
    f = m.layout(spec(canvas=[700, 724]))
    assert f["cell"] < 118
    assert f["items"][-1]["rect"][2] <= 700 and f["items"][0]["rect"][0] >= 0


def test_build_json_matches(tmp_path):
    p = tmp_path / "s.json"
    p.write_text(json.dumps(spec()))
    f = m.build(p, tmp_path / "o")
    assert (tmp_path / "o.png").exists()
    assert json.loads((tmp_path / "o.json").read_text()) == f
    for it, src in zip(f["items"], ITEMS):
        r = it["rect"]
        assert (r[2] - r[0], r[3] - r[1]) == (src["w"] * f["cell"], src["h"] * f["cell"])
