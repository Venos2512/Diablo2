# Blender MCP operations

Measured on 2026-10-22 with Blender 5.2.2 LTS, server blender-mcp 2.0.0 and addon protocol 14. Raw numbers are in
`E:\tmp_rig_research\probe\probe.json` and `ashlar/3d/rig-anim/RIG_SKILL_WORKFLOW.md` §2.

## Setup and session start

- Server: repo `.mcp.json` → `uvx blender-mcp@2.0.0`, `BLENDER_PORT=9876`, telemetry disabled by environment variables. With
  telemetry off, trajectory upload is off too. The tools appear only in a session started after `.mcp.json` changed.
- Addon: `%APPDATA%\Blender Foundation\Blender\5.2\scripts\addons\blender_mcp.py`, protocol 14. Server 2.0.0 expects 14; protocol 13
  was the old 1.8 file, kept as `.bak-v1.8-protocol13`. If `get_addon_status` reports the addon is outdated, copy the bundled
  `blender_mcp/bundled/addon.py` from the uv cache over it.
- Start Blender minimized so it does not cover the user's screen:

  ```powershell
  Start-Process -FilePath 'E:\SteamLibrary\steamapps\common\Blender\blender.exe' `
    -ArgumentList '<file.blend>','--addons','blender_mcp' -WindowStyle Minimized -PassThru
  ```

  - Keep the returned PID in `session.json`.
  - The addon auto-starts its socket. The port is ready after about 2 s.
  - Use `--factory-startup` only for probes, because it also drops the user's preferences.
- One rig session = one Blender = one port = one asset. A parallel session needs its own port, and therefore its own MCP config.
  Never drive a Blender another thread is using.

## Tools (server 2.0.0, as loaded in a session on 2026-10-23)

| Tool | Use |
| --- | --- |
| `mcp__blender__get_addon_status` | S0: expect `up_to_date: true`, protocol 14, `telemetry_consent: false` |
| `mcp__blender__get_scene_info` | Inventory. `fields` can add `topology` (non-manifold and boundary edges, loose vertices) and `weights` (vertices no deform bone moves, deform bones without a group): a quick health check before and after each step |
| `mcp__blender__execute_blender_code` | Run code. stdout is returned; errors come back with a traceback |
| `mcp__blender__look` | Images. `mode='angles'` auto-frames `target` objects from up to 6 `views` (`front`, `back`, `left`, `right`, `top`, `three_quarter` or `[x,y,z]` directions; the ARPG camera ≈ `[0,-1,1.2]`). `mode='frames'` gives an animation strip. `shading`: `solid`, `material`, `xray` (bones in front), `wireframe`. Settings are restored afterwards. Keep `max_size` ≈ 700 for checks |
| `generate_3d`, `search_assets`, `import_asset`, `record_trajectory_feedback`, `disable_telemetry` | do not use |

`look` with `mode='angles'` replaces most hand-made view setup for QA checks. Use `blender -b` renders only for the fixed, labelled QA
sheets that must be reproducible.

The addon also has `drain_human_activity` and `bpy_api_lookup` commands, but no MCP tool exposes them; the server only uses the first
for telemetry. Replace them as follows:
- **User edits:** take a state snapshot, then diff (below).
- **API lookup:** run `print([p.identifier for p in bpy.types.EditBone.bl_rna.properties])` or
  `bpy.ops.armature.calculate_roll.get_rna_type()` inside `execute_blender_code`.

## Timing (measured)

| Operation | Time |
| --- | --- |
| `get_scene_info`, trivial `execute_code` | 9–43 ms |
| numpy on 200k×3 inside Blender | 13–60 ms |
| glTF import, D01 (6.5k vertices) | 0.24 s |
| Viewport capture, Solid | 0.1 s |
| Viewport capture, first Material preview | 17 s (shader compile) |
| Server/addon socket timeout | **180 s** |

## Rules that come from failures

- **A call that runs past 180 s hangs Blender.**
  - The client gives up, but Blender keeps running the code ("Not Responding"), and every later call also times out.
  - There is no cancel. The only fix is to kill the PID and reopen the last snapshot.
  - Keep each call under 20 s, and split loops across calls.
- **Blender's bundled numpy 2.3.4 has no fast BLAS.** A 1000² matmul takes 2.2 s and a 3000² one takes 157 s.
  - Never solve linear systems, run dense distance matrices or inpaint weights inside Blender.
  - Export arrays to `.npz`, run `E:\tools\rigkit-env\Scripts\python.exe -I solver.py in.npz out.npz` (1000² in 0.0085 s; sparse
    10k solve 0.3 s; libigl, scipy and trimesh available), then load the result back.
- **Long Blender-side jobs** (render 17 poses × 4 views, ROM export, full rebuild): run `blender -b --factory-startup -P script.py --
  args` in the background with Bash, then reload the file in the GUI.

## Call pattern

```python
import sys, importlib, json
p = r"E:\Diablo2\.agents\skills\blender-mcp-rigging\scripts"
if p not in sys.path:
    sys.path.insert(0, p)
import rigkit.skeleton as m
importlib.reload(m)
print(json.dumps(m.build(recipe_path=r"...\rig_recipe.json", step="S4")))
```

- Print one small JSON object. Write anything large (arrays, per-vertex data, images) to files under `rig/checks/` or `rig/_work/`.
- Use `bpy.context.temp_override(area=..., region=...)` for view operators. A background or minimized window has no implicit
  context.
- Never rely on the undo stack. Before each writing step, save a copy:
  `bpy.ops.wm.save_as_mainfile(filepath=snap, copy=True)` to `rig/_snapshots/<step>_<n>.blend`.

## Viewport shots

- Batch QA: use Solid or Workbench with a matcap or flat light (fast). Use Material preview only for user-facing shots, and warm it up
  once.
- Before capturing, set the view through `temp_override`:
  - view axis (`FRONT`, `RIGHT`, `BACK`, `TOP`) or an explicit `region_3d.view_matrix` for the ARPG camera;
  - `view_selected`;
  - overlay bones in X-ray when needed.
- Opus must open and inspect every QA image it cites. Note the view, the pose and what is visible.

## User edits through the GUI (snapshot and diff)

1. Before handing control over, record:
   - the world positions of every `lm_*` empty;
   - a per-group hash of the vertex weights, keyed by welded position;
   - pose bone transforms.
2. Bring the Blender window up only when the user is going to edit. Tell them which objects to touch (`lm_*` empties, weight paint
   on a named group).
3. Afterwards, read the state again and diff it. Write the changes to `landmarks_override.json` or `weights_override.json`.
4. Re-run the dependent steps: S4 onward for landmarks, S6 enforcement onward for weights.
5. Never overwrite unrecorded user edits. If the diff is non-empty at the start of any step, record it first.

## Recovery

- Hang: kill the PID, restart Blender minimized, open the latest snapshot, and redo only the step that hung, split into smaller
  calls.
- Addon not answering after an exception: `get_addon_status`. If the socket is gone, restart Blender.
- Lost session state: rebuild from GLB + `rig_recipe.json` with `blender -b` (the recipe is the source of truth, not the open
  file).
