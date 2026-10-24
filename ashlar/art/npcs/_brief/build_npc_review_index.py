#!/usr/bin/env python3
"""Build the local NPC concept review gallery (no images are created or modified).

Writes, next to this script's parent folder (ashlar/art/npcs/):
  manifest.json   - master list of 51 NPC entries, 2 selected concepts each
  index.html      - standalone gallery (manifest embedded inline, so file:// works)
and _brief/inline-preview.html - four-image compare for T3 html_preview/html_render.

Run:  python _brief/build_npc_review_index.py          (build + validate)
      python _brief/build_npc_review_index.py --check  (validate only, no writes)

Selected variants come from the per-NPC QA.txt / _brief inventories. Entries the
parent was still delivering (N18, N19) are marked status=pending until concept_A/B and
QA.txt exist on disk; re-run to refresh. Selected file names for them are then re-checked by hand.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent  # ashlar/art/npcs
ABS_ROOT = "E:/Diablo2/ashlar/art/npcs"

LY, LYS = "Lychgate (Act I hub)", "Lychgate side figures (Act I)"
LC, NA = "Lowcourse (Act II hub)", "Namakhar (Act III hub)"
VE, WR = "Vesnagrad (Act IV hub)", "Wrackhaven (Act V hub)"
ST = "Story figures"

# (id, folder, name, primary act, all acts, group, role, A file, B file, caveats)
D = "concept_A.png", "concept_B.png"
NPCS = [
    ("N01", "N01_gennet-barrow", "Gennet Barrow", "I", "P, I, IV, V", LY, "Sexton, keeper of lore, mentor",
     "concept_A_r2.png", "concept_B_r2.png",
     ["Coat (A) vs cap and apron (B) are costume proposals.", "A keeps a few broad metal brush planes."]),
    ("N02", "N02_brannoc-the-mortsmith", "Brannoc the Mortsmith", "I", "I", LY, "Smith", *D,
     ["Hair/beard alternative is a proposal; canon gives no age.", "A has low-contrast brush variation on apron and skin."]),
    ("N03", "N03_edda", "Edda", "I", "I", LY, "Brannoc's wife, asleep two years", "concept_A_r2.png", "concept_B_r2.png",
     ["Middle-aged adult look is a proposal (canon gives no age).", "Fully covered; two different beds."]),
    ("N04", "N04_osric-dunmore", "Captain Osric Dunmore", "I", "I", LY, "Military leader, one-armed veteran", *D,
     ["Which arm is missing is not canon: left absent / right present is a design proposal.",
      "B has more broad mottled paint on the leather than A."]),
    ("N05", "N05_nell-coppercoin", "Nell Coppercoin", "I", "I", LY, "Trader (comic vendor)", *D,
     ["Exact ten-ring count is not verifiable from one view; check in production turnaround.",
      "Costume, hair and goods selection are proposals."]),
    ("N06", "N06_tamsin-reed", "Tamsin Reed", "I", "I, V", LY, "Guide; companion from end of Act I", *D,
     ["B bowstring is not clearly legible behind the shoulder; resolve in turnaround if B is picked.",
      "Teenage, fully covered practical clothing; one view, not model-ready."]),
    ("N07", "N07_fen-reed", "Fen Reed", "I", "I, V", LY, "Tamsin's brother, sleeping boy", *D,
     ["Child concept (user exception 2026-10-23): sleeping, fully covered, dignified.",
      "No rig or multi-view consistency claim."]),
    ("N08", "N08_odo-pell", "Verger Odo Pell", "I", "P, I", LY, "Spiritual leader, a coward", "concept_A.png", "concept_B_r2.png",
     ["A reused from earlier work; B is a second attempt (first rejected for mottling).",
      "Wetness is only a smooth dark hem band, not droplets."]),
    ("N09", "N09_counting-child", "Counting Children", "I", "I", LYS, "Lore group (village children by the ossuary)", *D,
     ["A and B are two representatives (boy/girl) of an unnamed group, not two canonical characters.",
      "Child concepts; exact age and costume are proposals."]),
    ("N10", "N10_ferryman", "The Ferryman of Rook's Weir", "I", "I", LYS, "Side quest: The Ferryman's Toll", "concept_A_r2.png", "concept_B_v2.png",
     ["Pole top margin is narrow in both (nothing cropped).", "No barge scenery (studio-only portrait)."]),
    ("N11", "N11_mother-hawise", "Mother Hawise", "I", "I", LYS, "Hospice Mother (civilian form)", *D,
     ["Civilian form only; her Mercy-vessel boss form is not drawn.", "Some low-contrast brush strokes remain."]),
    ("N12", "N12_poppy-sister", "Poppy Sister", "I", "I", LYS, "Hospice order (group representative)", *D,
     ["One representative adult (~35, a proposal) stands for the group.",
      "Needles shown in a sewing/care routine, not combat; embroidery placement is a proposal."]),
    ("N13", "N13_perpetua", "Archsexton Perpetua Vane", "II", "II, V", LC, "Spiritual leader; Act II antagonist", "concept_A_v3.png", "concept_B_v2.png",
     ["Earlier attempts were rejected (A: cross-shaped ash mark; B: cloth texture); these are the retries.",
      "A robe silhouette is somewhat elongated."]),
    ("N14", "N14_ignatia", "Exhumer Ignatia Corr", "II", "II, V", LC, "Military leader, later companion", "concept_A_v2.png", "concept_B.png",
     ["One neutral look; hostile-Act-II vs ally-Act-V states are not drawn separately.",
      "B shows more angular facet strokes than A."]),
    ("N15", "N15_ansel", "Ansel Crane", "II", "II", LC, "Smith (bellfounder)", "concept_A_v2.png", "concept_B.png",
     ["Deaf ear set to anatomical right by design choice (canon silent).", "B bell mould and long apron are optional costume details."]),
    ("N16", "N16_quint", "Pardoner Quint", "II", "II", LC, "Trader", *D,
     ["B has many angular folds.", "No real religious sign used."]),
    ("N17", "N17_saint-in-the-box", "The Saint in the Box", "II", "II", LC, "Gilded talking skull in glass case (part of Quint's stall)", *D,
     ["An object-character, not a person.", "B cradle is drawn as stone-like planes instead of a soft insert."]),
    ("N18", "N18_old-vellum", "Old Vellum", "II", "II", LC, "Keeper of lore; last Odilian astronomer", "concept_A_v2.png", "concept_B.png",
     ["A original was superseded (star chart touched the right edge); A_v2 is selected.",
      "Clouded-eye side and garment details are proposals; canon only says half blind.",
      "Broad painterly marks and facial age creases remain."]),
    ("N19", "N19_ser-hamon", "Ser Hamon of the Pall", "II", "II", LC, "Guide, then companion", "concept_A_v2.png", "concept_B_v2.png",
     ["Originals were superseded for dense scratched metal/wood texture; v2 edits keep face, build and props.",
      "Silver-nail count beyond the nail motif is a proposal (A: six shield studs plus one; B: four).",
      "B coffin top has a smaller grey margin but is fully in frame; minor painted plane variation on armour and rims remains."]),
    ("N20", "N20_wystan", "Wystan", "V", "V (in the Wall)", LC, "Hamon's drowned squire, 14", *D,
     ["Fourteen-year-old impression; wetness is subtle, stronger damp blocking may be needed in production.",
      "Costume variants (A tunic, B tabard + kit bag) are proposals."]),
    ("N21", "N21_nareh", "Nareh", "III", "III, V", NA, "Smuggler, trader, guide", *D,
     ["Missing-finger side differs: A shows it on the anatomical right, B on the left; canon only fixes the count.",
      "B smile is restrained rather than an open laugh. Living form only (salted state not drawn)."]),
    ("N22", "N22_anoush", "Anoush", "III", "III", NA, "Nareh's partner (pre-arrest state)", *D,
     ["Cheek scar side differs: A anatomical right, B left; canon does not fix the side.",
      "Age (~thirties) and props are proposals; B spool has more cord loops than briefed."]),
    ("N23", "N23_zabel", "High Purifier Zabel Dahl", "III", "III", NA, "Ruler of the Salt Synod (human form)", *D,
     ["Human state only; salt-pillar fate is not drawn.", "Face/hair age interpretation and props are proposals."]),
    ("N24", "N24_vardan", "Commander Vardan of the White Watch", "III", "III", NA, "Military leader", *D,
     ["B visor leaves the chin uncovered by design.", "Age, cuts and routine props are proposals."]),
    ("N25", "N25_hovik", "Old Hovik, the saltwright", "III", "III", NA, "Smith (shipwright-turned-smith)", *D,
     ["A shows many faceted brush planes; B beard has finer strands; density preference awaits the user.",
      "A is stockier than B; height is not canon."]),
    ("N26", "N26_inkman", "The Inkman", "III", "III", NA, "Tattooist, keeper of lore", *D,
     ["Tattoos are abstract shapes with no legible writing; the tattoo writing system is unresolved.",
      "Tattoos under clothing cannot be verified in one view."]),
    ("N27", "N27_arsham", "Arsham, the Unblemished", "III", "III", NA, "Living god (Purity vessel), human form", *D,
     ["Blank-face design, no boss or saltrot traits; age 25 is a visual proposal.",
      "Glass and salt-glass crown shapes are proposals."]),
    ("N28", "N28_zorya", "Zorya", "IV", "IV", VE, "Last high Frostwife; spiritual leader", "concept_A.png", "concept_B_v2.png",
     ["A keeps some angular fur strokes; B torch top margin is small.", "Toggles and gold trim in B are proposal details."]),
    ("N29", "N29_frostwife", "The Frostwives", "IV", "IV", VE, "Pyre-priestess group (representative)", *D,
     ["Group representatives; B is more fitted than a ritual elder.", "Veil and floor-length fur cloak follow the Frostwife rule."]),
    ("N30", "N30_radomir", "Prince Radomir the Unforgetting", "IV", "IV", VE, "Ruler; Memory vessel (human form)", *D,
     ["Human form only, no boss traits; gloved left hand.", "B has slight fine cloth surface."]),
    ("N31a", "N31a_ilka", "Ilka", "IV", "IV", VE, "Radomir's preserved family", *D,
     ["Support wires are only discretely suggested at the wrists; explicit attachments are not resolved.",
      "Appearance concept, not a finished preserved-state model; age beyond adulthood is a proposal."]),
    ("N31b", "N31b_yarik", "Yarik", "IV", "IV", VE, "Radomir's preserved family (boy)", *D,
     ["A cuffs hide the wire connection; B wrist supports are visible; attachments unresolved.",
      "Early-adolescent age is a proposal. Appearance concept only."]),
    ("N31c", "N31c_mila", "Mila", "IV", "IV", VE, "Radomir's preserved family (nine-year-old)", *D,
     ["Fine support wires are not visually resolved in either image; attachments left for production turnaround.",
      "Appearance concept only, not an in-game preserved-state model."]),
    ("N31d", "N31d_bozhena", "Bozhena", "IV", "IV", VE, "Radomir's preserved family (teenager)", *D,
     ["Fine support wires are not resolved in these views; add explicit attachments in turnaround.",
      "Exact age and costumes are proposals. Appearance concept only."]),
    ("N32", "N32_stanimir", "Boyar Stanimir", "IV", "IV", VE, "Military leader (marshal)", *D,
     ["Minor decorative metal marks; B cap has visible strokes."]),
    ("N33", "N33_ilya", "Ilya the icesmith", "IV", "IV", VE, "Smith", *D,
     ["B apron is longer than briefed and has faint leather brush marks.", "Hair colour and garment details are proposals."]),
    ("N34", "N34_dragana", "Mother Dragana", "IV", "IV", VE, "Trader (furrier)", *D,
     ["Fur edges are painted strokes, not photographic hair."]),
    ("N35", "N35_lev", "Lev the sledge-driver", "IV", "IV", VE, "Guide", "concept_A_v2.png", "concept_B.png",
     ["A is on a wider landscape canvas so the whole sledge fits; B shows no dog (runners and harness only).",
      "Frostbitten ear is subtle in B."]),
    ("N36", "N36_miron", "Brother Miron", "IV", "IV", VE, "Keeper of lore; runaway Remembrancer", *D,
     ["B looks older and its hem is longer than briefed; monocle crack is subtle at normal scale."]),
    ("N37", "N37_rozenn", "Mother Rozenn", "V", "V", WR, "Spiritual leader; coast's last sexton", *D,
     ["A has small brush strands/water drops; B mitten surface shows wear.", "Deafness is conveyed by a cupped hand in B."]),
    ("N38", "N38_goulven", "Goulven", "V", "V", WR, "Smith (anchor-smith)", *D,
     ["B anchor is large but entirely visible and reads as trade stock, not a weapon."]),
    ("N39", "N39_morvan", "Morvan", "V", "V", WR, "Trader (wrecker turned salvage-seller)", *D,
     ["B has a duplicate pulley in the salvage tray."]),
    ("N40", "N40_maelys", "Maelys", "V", "V", WR, "Guide; fisherwoman", *D,
     ["B shows a tiny candle flame on the pocket candle although the brief said unlit.",
      "A oar top margin is narrow (not cropped); B net is more intricate than briefed."]),
    ("N41", "N41_the_waiting", "The Waiting (by day)", "V", "V", WR, "Townsfolk (group representatives)", *D,
     ["Daytime human form only; no night-monster traits or window scenery.",
      "A is a man, B a woman; hunger is conveyed through thinness only."]),
    ("S01", "S01_severin", "Severin, the Betrothed", "V", "V (letters open every act)", ST, "Main antagonist (human form)", *D,
     ["A cape sits on the anatomical right (not canon); B hem is longer than briefed.",
      "Not a turnaround or rig; broad painterly marks retained."]),
    ("S02a", "S02a_plumb", "The Plumb", "II", "II, IV, V", ST, "Masons' speaker statue", "concept_A_v2.png", "concept_B.png",
     ["Intermediary speaking-statue look; flying-buttress wings are not represented, so not the Mason true form.",
      "A_v2 has slightly denser marks around hands and feet; residual broad stone brush patches."]),
    ("S02b", "S02b_square", "The Square", "II", "II, IV, V", ST, "Masons' speaker statue", *D,
     ["Intermediary statue, not the Mason true form.", "Broad stone brush marks are more pronounced on B."]),
    ("S02c", "S02c_trowel", "The Trowel", "II", "II, IV, V", ST, "Masons' speaker statue", "concept_A_v3.png", "concept_B_v3.png",
     ["Earlier A/B and v2 were rejected for surface density or missing face groove; v3 is selected.",
      "Intermediary statue, not the Mason true form."]),
    ("S02d", "S02d_level", "The Level", "II", "II, IV, V", ST, "Masons' speaker statue", "concept_A_v2.png", "concept_B_v2.png",
     ["A plumb bob hangs below the beam instead of at the requested notch; tool construction to resolve before modelling.",
      "Intermediary statue; B mantle and hem show stronger paint variation."]),
    ("S03", "S03_cassian", "Brother Cassian, the Kneeling Saint", "II", "II", ST, "Devotion vessel, Act II boss (quiet form)", "concept_A_v2.png", "concept_B_v2.png",
     ["Inner crown teeth point inward but their 3D orientation and depth need resolving before modelling.",
      "B has more fractured paint marks on the pale mantle."]),
    ("S04", "S04_ignatias-mother", "Ignatia's mother", "V", "V (in the Wall)", ST, "In-Wall reunion figure", *D,
     ["Standalone appearance study, not the wall reunion scene.", "Ash reads close to grey hair; keep the ash-in-hair note for production."]),
]

PENDING_NOTE = "Pending: parent is still delivering/QA-ing this concept pair (images or QA.txt not final); selected files unverified, file names may change."
SHARED_NOTES = [
    "All entries are appearance concepts: two costume proposals per NPC, selected for user review. None is an approved game model or canon costume; the user choice is still pending.",
    "Selected variants come from each folder's QA.txt and the _brief inventories; rejected earlier attempts (REJECTED, superseded r/v files) are not shown.",
    "N31 Radomir's family: support-wire attachments are not resolved in these views and are left for the production turnaround.",
    "Hypothetical costumes (for example Hamon, Vellum and the Mason statue shapes) are proposals awaiting choice.",
    "Nareh and Anoush: the side of the missing fingers / cheek scar differs between A and B; canon fixes neither side.",
    "Scope follows the roster research: Yann, the letters and monsters are deliberately excluded; the S04 In-Wall figure is Ignatia's mother only.",
]


def build():
    entries = []
    for (nid, folder, name, act, acts, group, role, a, b, cav) in NPCS:
        ea = ROOT / folder / a
        eb = ROOT / folder / b
        pending = not (ea.is_file() and eb.is_file() and (ROOT / folder / "_work" / "QA.txt").is_file())
        entries.append({
            "id": nid,
            "name": name,
            "act": act,
            "acts": acts,
            "group": group,
            "role": role,
            "folder": folder,
            "status": "pending" if pending else "ready",
            "A": f"{folder}/{a}",
            "B": f"{folder}/{b}",
            "promptA": f"{folder}/_work/{a[:-4]}.prompt.txt",
            "promptB": f"{folder}/_work/{b[:-4]}.prompt.txt",
            "qa": f"{folder}/_work/QA.txt",
            "caveats": ([PENDING_NOTE] if pending else []) + cav,
        })
    return {
        "title": "ASHLAR NPC concept review",
        "generated": "2026-10-23",
        "counts": {"npcs": len(entries), "images": 2 * len(entries),
                   "pending": sum(1 for e in entries if e["status"] == "pending")},
        "pendingIds": [e["id"] for e in entries if e["status"] == "pending"],
        "notes": SHARED_NOTES,
        "npcs": entries,
    }


def validate(m):
    errs, pend, ok = [], [], 0
    seen = set()
    ids = set()
    for e in m["npcs"]:
        if e["id"] in ids:
            errs.append(f"duplicate id {e['id']}")
        ids.add(e["id"])
        for k in ("A", "B"):
            p = e[k]
            if p in seen:
                errs.append(f"duplicate image path {p}")
            seen.add(p)
            if "REJECTED" in p:
                errs.append(f"rejected file selected: {p}")
        if e["status"] == "pending":
            pend.append(e["id"] + ": missing " + ", ".join(e[k] for k in ("A", "B", "qa") if not (ROOT / e[k]).is_file()))
            continue
        for k in ("A", "B", "promptA", "promptB", "qa"):
            if not (ROOT / e[k]).is_file():
                errs.append(f"{e['id']} missing {k}: {e[k]}")
        ok += 1
    return errs, pend, ok, len(seen)


INDEX_HTML = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ASHLAR NPC concept review</title>
<style>
:root{--bg:#17161a;--panel:#211f25;--panel2:#2a2830;--line:#3a3742;--fg:#ece8df;--mut:#a39e94;--acc:#d9a441;--warn:#e0a458;--img:#4a4743}
*{box-sizing:border-box}
html{scroll-padding-top:150px}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--acc)}
header{padding:20px 16px 8px;max-width:1280px;margin:0 auto}
h1{margin:0 0 4px;font-size:1.5rem}
.sub{color:var(--mut);margin:0}
.bar{position:sticky;top:0;z-index:5;background:rgba(23,22,26,.96);border-bottom:1px solid var(--line);padding:10px 16px}
.bar-in{max-width:1280px;margin:0 auto;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.bar input[type=search],.bar select{background:var(--panel);color:var(--fg);border:1px solid var(--line);border-radius:6px;padding:8px 10px;font:inherit;min-width:0}
.bar input[type=search]{flex:1 1 220px}
.bar select{flex:0 1 230px}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{background:var(--panel);color:var(--fg);border:1px solid var(--line);border-radius:999px;padding:6px 12px;font:inherit;cursor:pointer}
.chip[aria-pressed=true]{background:var(--acc);color:#1a1405;border-color:var(--acc);font-weight:600}
.chip:focus-visible,.bar input:focus-visible,.bar select:focus-visible,a:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
.count{color:var(--mut);margin-left:auto;white-space:nowrap}
details.notes{max-width:1280px;margin:8px auto 0;padding:0 16px}
details.notes summary{cursor:pointer;color:var(--mut)}
details.notes ul{margin:8px 0 0;padding-left:20px;color:var(--mut)}
main{max-width:1280px;margin:0 auto;padding:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,560px),1fr));gap:16px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px;min-width:0}
.card h2{margin:0;font-size:1.1rem;display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}
.id{color:var(--acc);font-variant-numeric:tabular-nums;font-weight:600}
.meta{color:var(--mut);font-size:.85rem;margin:2px 0 10px}
.badge{display:inline-block;border:1px solid var(--warn);color:var(--warn);border-radius:4px;padding:0 6px;font-size:.75rem}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:8px}
figure{margin:0;min-width:0}
figcaption{font-size:.8rem;color:var(--mut);margin-bottom:4px;overflow-wrap:anywhere}
figcaption b{color:var(--fg)}
.frame{display:flex;align-items:center;justify-content:center;aspect-ratio:2/3;background:var(--img);border-radius:6px;overflow:hidden;position:relative}
.frame a{display:flex;width:100%;height:100%;align-items:center;justify-content:center}
.frame img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block}
.frame .miss{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:8px;color:var(--mut);font-size:.8rem}
ul.cav{margin:10px 0 0;padding-left:18px;font-size:.85rem;color:#d4cfc4}
ul.cav li+li{margin-top:3px}
.links{margin-top:8px;font-size:.8rem;color:var(--mut);display:flex;flex-wrap:wrap;gap:4px 12px}
#empty{max-width:1280px;margin:24px auto;padding:0 16px;color:var(--mut)}
@media (max-width:640px){.bar{position:static}html{scroll-padding-top:0}}
@media (max-width:520px){header{padding-top:14px}h1{font-size:1.25rem}.card{padding:10px}.pair{gap:6px}.count{margin-left:0;width:100%}.chip{padding:6px 10px}}
</style>
</head>
<body>
<header>
<h1>ASHLAR NPC concept review</h1>
<p class="sub" id="sum"></p>
</header>
<div class="bar"><div class="bar-in">
<input type="search" id="q" placeholder="Search name, id, role, caveat…" aria-label="Search NPCs" autocomplete="off">
<div class="chips" id="chips" role="group" aria-label="Filter by act"></div>
<select id="grp" aria-label="Filter by hub or group"></select>
<span class="count" id="cnt" aria-live="polite"></span>
</div></div>
<details class="notes"><summary>Read first: what these are</summary><ul id="notes"></ul></details>
<main id="grid"></main>
<p id="empty" hidden>No NPC matches that search and filter.</p>
<script type="application/json" id="manifest">__MANIFEST__</script>
<script>
(function(){
var M=JSON.parse(document.getElementById('manifest').textContent);
var N=M.npcs, state={q:'',act:'all',grp:'all'};
function norm(s){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;}
function file(p){return p.split('/').pop();}
N.forEach(function(n){n._s=norm([n.id,n.name,n.role,n.group,'act '+n.acts,n.caveats.join(' '),file(n.A),file(n.B),n.status].join(' '));});
document.getElementById('sum').textContent=M.counts.npcs+' NPCs · '+M.counts.images+' selected concepts (A/B)'+(M.counts.pending?' · '+M.counts.pending+' pending ('+M.pendingIds.join(', ')+')':'')+' · generated '+M.generated+' · click an image to open the original';
var nl=document.getElementById('notes');M.notes.forEach(function(t){nl.appendChild(el('li',null,t));});

var acts=['all','I','II','III','IV','V'], chips=document.getElementById('chips');
acts.forEach(function(a){
  var b=el('button','chip',a==='all'?'All acts':'Act '+a);b.type='button';b.dataset.act=a;b.setAttribute('aria-pressed',a==='all');
  b.onclick=function(){state.act=a;sync();render();};chips.appendChild(b);
});
var sel=document.getElementById('grp'),gs=[];
N.forEach(function(n){if(gs.indexOf(n.group)<0)gs.push(n.group);});
sel.appendChild(new Option('All hubs and groups','all'));
gs.forEach(function(g){sel.appendChild(new Option(g,g));});
sel.onchange=function(){state.grp=sel.value;render();};
document.getElementById('q').addEventListener('input',function(e){state.q=norm(e.target.value.trim());render();});
function sync(){Array.prototype.forEach.call(chips.children,function(b){b.setAttribute('aria-pressed',b.dataset.act===state.act);});}

function fig(n,k){
  var f=el('figure'),c=el('figcaption');c.appendChild(el('b',null,k));c.appendChild(document.createTextNode(' · '+file(n[k])));f.appendChild(c);
  var fr=el('div','frame'),a=el('a');a.href=n[k];a.target='_blank';a.rel='noopener';a.title='Open original '+file(n[k]);
  a.setAttribute('aria-label',n.name+' concept '+k+', open original');
  var im=new Image();im.loading='lazy';im.decoding='async';im.alt=n.name+' – concept '+k;im.src=n[k];
  im.onerror=function(){im.remove();a.removeAttribute('href');fr.appendChild(el('div','miss',n.status==='pending'?'Not delivered yet':'Image failed to load'));};
  a.appendChild(im);fr.appendChild(a);f.appendChild(fr);return f;
}
function card(n){
  var c=el('article','card');c.id=n.id;
  var h=el('h2');h.appendChild(el('span','id',n.id));h.appendChild(document.createTextNode(n.name));
  if(n.status==='pending')h.appendChild(el('span','badge','pending'));
  c.appendChild(h);
  c.appendChild(el('p','meta','Act '+n.acts+' · '+n.group+' · '+n.role));
  var p=el('div','pair');p.appendChild(fig(n,'A'));p.appendChild(fig(n,'B'));c.appendChild(p);
  if(n.caveats.length){var u=el('ul','cav');n.caveats.forEach(function(t){u.appendChild(el('li',null,t));});c.appendChild(u);}
  var l=el('div','links');
  [['QA notes',n.qa],['Prompt A',n.promptA],['Prompt B',n.promptB]].forEach(function(x){
    if(n.status==='pending'&&x[0]!=='Prompt A'&&x[0]!=='Prompt B')return;
    var a=el('a',null,x[0]);a.href=x[1];a.target='_blank';a.rel='noopener';l.appendChild(a);});
  c.appendChild(l);return c;
}
var grid=document.getElementById('grid'),cards={};
N.forEach(function(n){cards[n.id]=card(n);grid.appendChild(cards[n.id]);});
function render(){
  var shown=0;
  N.forEach(function(n){
    var ok=(state.act==='all'||n.act===state.act)&&(state.grp==='all'||n.group===state.grp)&&(!state.q||state.q.split(/\s+/).every(function(w){return n._s.indexOf(w)>=0;}));
    cards[n.id].hidden=!ok;if(ok)shown++;
  });
  document.getElementById('cnt').textContent=shown+' of '+N.length+' NPCs ('+shown*2+' images)';
  document.getElementById('empty').hidden=shown>0;
}
render();
window.__npcGallery={state:state,render:render,cards:cards};
})();
</script>
</body>
</html>
"""

PREVIEW_HTML = """<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
html,body{background:transparent;margin:0}
body{color:var(--foreground);font-family:var(--font-sans)}
.row{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:16px}
.name{font-weight:600;margin:0 0 6px;color:var(--foreground)}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:8px}
figure{margin:0;min-width:0}
.fr{display:flex;align-items:center;justify-content:center;aspect-ratio:2/3;border:1px solid var(--border);border-radius:var(--radius)}
.fr img{max-width:100%;max-height:100%;object-fit:contain;display:block}
figcaption{font-size:12px;margin-top:4px;color:var(--foreground);opacity:.75}
</style></head><body>
<div class="row">
<section><p class="name">Gennet Barrow</p><div class="pair">
<figure><div class="fr"><img alt="Gennet Barrow concept A" src="__GA__"></div><figcaption>A</figcaption></figure>
<figure><div class="fr"><img alt="Gennet Barrow concept B" src="__GB__"></div><figcaption>B</figcaption></figure>
</div></section>
<section><p class="name">Zorya</p><div class="pair">
<figure><div class="fr"><img alt="Zorya concept A" src="__ZA__"></div><figcaption>A</figcaption></figure>
<figure><div class="fr"><img alt="Zorya concept B" src="__ZB__"></div><figcaption>B</figcaption></figure>
</div></section>
</div>
</body></html>
"""


def main():
    m = build()
    errs, pend, ok, uniq = validate(m)
    print(f"entries={len(m['npcs'])} unique_image_paths={uniq} ready_checked={ok} pending={len(pend)}")
    for p in pend:
        print("  PENDING (not on disk, not checked):", p)
    for e in errs:
        print("  ERROR:", e)
    if "--check" in sys.argv:
        return 1 if errs else 0
    (ROOT / "manifest.json").write_text(json.dumps(m, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    inline = json.dumps(m, ensure_ascii=True, separators=(",", ":")).replace("</", "<\\/")
    (ROOT / "index.html").write_text(INDEX_HTML.replace("__MANIFEST__", inline), encoding="utf-8")
    by = {e["id"]: e for e in m["npcs"]}
    pv = PREVIEW_HTML
    for tok, nid, k in (("__GA__", "N01", "A"), ("__GB__", "N01", "B"), ("__ZA__", "N28", "A"), ("__ZB__", "N28", "B")):
        pv = pv.replace(tok, f"{ABS_ROOT}/{by[nid][k]}")
    (ROOT / "_brief" / "inline-preview.html").write_text(pv, encoding="utf-8")
    print("wrote manifest.json, index.html, _brief/inline-preview.html")
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main())
