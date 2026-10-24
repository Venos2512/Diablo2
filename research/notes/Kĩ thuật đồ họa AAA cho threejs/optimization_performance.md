# AAA rendering-performance optimisation (2023–2026): technique notes for a browser isometric ARPG (three.js on WebGL2 / WebGPU)

## Q1. GPU-driven pipelines: indirect/multi-draw, GPU frustum + two-phase Hi-Z occlusion culling, visibility buffer, meshlets and mesh shaders, Nanite-style virtualised geometry, RTX Mega Geometry, D3D12 Work Graphs, bindless

### Takeaway
GPU-driven rendering is now the default architecture in AAA engines from 2024 to 2026. Compute shaders cull instances, clusters and triangles into compacted indirect-draw buffers, usually with two-phase HZB occlusion culling and more and more often a visibility buffer. Shipped examples: UE5 Nanite; Capcom RE ENGINE in Dragon's Dogma 2 (2024) and Monster Hunter Wilds (2025); Ubisoft Anvil "Micropolygon" in Assassin's Creed Shadows (2025); MachineGames' idTech-derived MOTOR in Indiana Jones (2024); and Saber's Swarm Engine in Space Marine 2 (2024), which culls on the GPU but builds draws on the CPU. The newest layers (mesh shaders, software rasterisation built on 64-bit atomics, RTX Mega Geometry, Work Graphs, bindless) need API features that WebGPU does not expose. The original 2015 RedLynx design, however, used only compute culling plus two plain `DrawInstancedIndirect` calls, with no multi-draw-indirect and no bindless. That design maps almost 1:1 onto WebGPU core. WebGL2 is limited to CPU culling plus instancing/multi-draw.

### Cited Findings

#### 1.1 Compute culling → indirect / multi-draw-indirect (foundational 2015; standard in 2024–26)
- (a) Mechanism: the CPU submits one "draw scene" command per viewport, and the GPU decides (sub-)object visibility for n viewports with no CPU/GPU round trip. The Assassin's Creed Unity pipeline runs: coarse CPU frustum cull → GPU instance culling (frustum/occlusion) → cluster-chunk expansion → cluster culling (frustum/occlusion/triangle backface) → index compaction → multi-draw — [Haar & Aaltonen, SIGGRAPH 2015](https://advances.realtimerendering.com/s2015/aaltonenhaar_siggraph2015_combined_final_footer_220dpi.pdf)
- (b) Foundational shipping: Assassin's Creed Unity (2014) used `MultiDrawIndexedInstancedIndirect` with 64-triangle clusters, one sub-draw per instance, and appended the index buffer on the fly. RedLynx's Trials engine rendered each viewport as a single draw call (x2) — [Haar & Aaltonen 2015](https://advances.realtimerendering.com/s2015/aaltonenhaar_siggraph2015_combined_final_footer_220dpi.pdf)
- (b) 2024–25 shipping:
  - Indiana Jones and the Great Circle (Dec 2024): "For the majority of the models and surfaces this is a GPU only path". Surfaces are tested against tighter bounds, draws are set up on the GPU, and compute skinning starts after culling — [MachineGames, REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Indy.pdf)
  - RE ENGINE before meshlets already used Multi-Draw Indirect plus GPU occlusion culling. It split large background meshes into 256-triangle sections for culling — [Capcom, REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Capcom.pdf)
- (b) Hybrid variant (Space Marine 2, 2024):
  - Culling of 100K+ boxes runs in a compute shader: "~0.5ms whole culling process", about 40 MB of GPU memory.
  - The results are read back so the CPU can build draw calls.
  - GPU instancing processing takes ~0.4 ms. The system supports up to 64 cameras and up to 2K unique mesh types, with <1 MB/camera of draw parameters read back on average — [Saber Interactive, REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Saber.pdf)
- (c) Gains (ACU):
  - CPU: "1-2 Orders of magnitude less drawcalls"; about 75% of the previous AC's CPU cost with about 10x the objects.
  - GPU: 20–40% of triangles culled (backface + cluster bounds), but "Only small overall gain: <10% of geometry rendering". 30–80% of shadow triangles culled — [Haar & Aaltonen 2015](https://advances.realtimerendering.com/s2015/aaltonenhaar_siggraph2015_combined_final_footer_220dpi.pdf)
- (c) RedLynx "torture" scene: 250,000 separate moving objects, 1 GB of mesh data (10k+ meshes), Xbox One at 1080p.
  - Total GPU time 2.3 ms. Per phase: object culling + LOD 0.28 / 0.26 ms, cluster culling 0.09 / 0.04 ms, G-buffer draw 1.60 / <0.01 ms; pyramid generation 0.06 ms.
  - CPU time 0.2 ms on a single Jaguar core — [Haar & Aaltonen 2015](https://advances.realtimerendering.com/s2015/aaltonenhaar_siggraph2015_combined_final_footer_220dpi.pdf)
- (c) Practical costs:
  - Indy compacts the indirect buffer after GPU triangle culling to remove empty draws, and predicates whole execute/multi-draw-indirect calls for pipelines with zero draws. This saved "around 0.5ms" in scenes with many pipelines but few visible at a time — [MachineGames REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Indy.pdf)
  - AMD guidance: "Always compact the argument buffer and provide a count buffer if any draws are culled out". The fast path for ExecuteIndirect uses only a draw/dispatch in the command signature. Don't update vertex-buffer bindings through ExecuteIndirect; use vertex pulling — [AMD RDNA Performance Guide](https://gpuopen.com/learn/rdna-performance-guide/)
- (d) Prerequisites:
  - Compute plus indirect draw. Multi-draw-indirect/ExecuteIndirect with count buffers is needed for the "many draws per call" variant.
  - The RedLynx DX11 path ran with "No ExecuteIndirect / MultiDrawIndirect" and "Only two DrawInstancedIndirect calls", using 64-vertex clusters (strips) — [Haar & Aaltonen 2015](https://advances.realtimerendering.com/s2015/aaltonenhaar_siggraph2015_combined_final_footer_220dpi.pdf)
  - Virtual texturing made "All texture data … available at once, using just a single texture binding", so there was "No need to batch by textures!" — [Haar & Aaltonen 2015](https://advances.realtimerendering.com/s2015/aaltonenhaar_siggraph2015_combined_final_footer_220dpi.pdf)
- (e) Web/other implementations:
  - VTK 9.4 ships a WebGPU compute module for "Hierarchical two-pass occlusion culling" — [VTK docs](https://docs.vtk.org/en/latest/release_details/9.4/webgpu-occlusion-culler.html)
  - gfxlite (a JS engine) runs a compute pass that fills an indexed-indirect buffer with only the visible instances. Whether it targets WebGPU was not confirmed — [gfxlite](https://github.com/somepablo/gfxlite)
  - The Khronos Vulkan multi-draw-indirect sample is a porting blueprint: a compute shader writes one `VkDrawIndexedIndirectCommand` per object, tested by bounding sphere — [Khronos Vulkan sample](https://docs.vulkan.org/samples/latest/samples/performance/multi_draw_indirect/README.html)

#### 1.2 Two-phase Hi-Z (HZB) occlusion culling
- (a) Mechanism (Nanite form):
  1. Test instances/clusters against the previous frame's HZB using previous-frame transforms, and draw the survivors.
  2. Build an HZB from that depth.
  3. Re-test the objects rejected in pass 1 and draw the newly visible ones.
  4. Build the complete HZB for next frame — [Karis et al., Nanite, SIGGRAPH 2021](https://advances.realtimerendering.com/s2021/Karis_Nanite_SIGGRAPH_Advances_2021_final.pdf)
- (a) RedLynx variant: "Precise WYSIWYG occlusion" from the depth buffer, with the depth pyramid built from the HTILE min/max buffer. It uses an O(1) `gather4` test and needs no low-poly proxy occlusion pass — [Haar & Aaltonen 2015](https://advances.realtimerendering.com/s2015/aaltonenhaar_siggraph2015_combined_final_footer_220dpi.pdf)
- (b) Shipping:
  - UE5 Nanite — [Nanite 2021](https://advances.realtimerendering.com/s2021/Karis_Nanite_SIGGRAPH_Advances_2021_final.pdf)
  - RE ENGINE meshlet pipeline (DD2 2024, MH Wilds 2025). It culls instances and clusters by AABB, runs HiZ "if possible", and can bias the HiZ LOD (2x2 / 4x4 / 8x8) — [Capcom REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Capcom.pdf)
  - Indy builds its occlusion buffer "from occluders visible last frame": bigger statics, dynamics in cutscenes, and sometimes manually placed blockers — [MachineGames REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Indy.pdf)
  - Space Marine 2 builds its HZB from "Reprojected depth + occluders" (~1K manual low-poly occluders). Occlusion removes 30–50% of objects after frustum culling — [Saber REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Saber.pdf)
- (b) UE 5.7 (Nov 2025) adds experimental `r.Nanite.PrimeHZB`, which rebuilds the HZB after camera cuts using a lower-resolution, lower-detail pre-render. `r.Nanite.Culling.MinLOD` speeds up culling and reduces candidate-cluster memory — [Tom Looman, UE 5.7 performance highlights](https://tomlooman.com/unreal-engine-5-7-performance-highlights/)
- (c) Caveats (low-authority sources):
  - A third-party wgpu BIM viewer ran a same-frame two-pass HiZ. Survivors dropped from 140k to 65k, but "net FPS is flat (savings on color ≈ cost of depth pre-pass)" — [IfcOpenShell commit](https://dev.glassvision.dedyn.io/Glassvision/IfcOpenShell/src/commit/a34c36d22e8357c126ad5a20a02f5afce5314ced)
  - A forum post says a AAA engine reprojects the previous frame's depth with hole-filling heuristics, which "can cause occasional pops" — [gamedev.net thread](https://gamedev.net/forums/topic/714059-hi-z-usefulness-in-deferred-pipelines) (forum source)
- (d) Prerequisites: compute; generating a depth pyramid (compute or mip render passes); indirect draws. Priming depth with last frame's visible set "does require a fully gpu-driven renderer" — [gamedev.net](https://gamedev.net/forums/topic/714059-hi-z-usefulness-in-deferred-pipelines)
- (e) Web:
  - VTK WebGPU two-pass culler (above) — [VTK](https://docs.vtk.org/en/latest/release_details/9.4/webgpu-occlusion-culler.html)
  - nanite-webgpu uses a depth pyramid from the previous frame "with no reprojection and no two-pass" — [nanite-webgpu](https://github.com/Scthe/nanite-webgpu)

#### 1.3 Visibility buffer (+ deferred material pass)
- (a) Mechanism: rasterise only IDs per pixel (instance/cluster/triangle). A later pass reconstructs vertex attributes and barycentrics and runs the material shader. Nanite packs depth into the high bits and a payload of ≤34 bits into the low bits of a 64-bit image `InterlockedMax`: "Without that we wouldn't be able to do fast software rasterization" — [Nanite 2021](https://advances.realtimerendering.com/s2021/Karis_Nanite_SIGGRAPH_Advances_2021_final.pdf). Foundational paper: Burns & Hunt 2013 — [JCGT](https://jcgt.org/published/0002/02/04/paper.pdf)
- (b) Shipping:
  - **UE5 Nanite**: the material pass costs "1 draw per material" — [Nanite 2021](https://advances.realtimerendering.com/s2021/Karis_Nanite_SIGGRAPH_Advances_2021_final.pdf)
  - **RE ENGINE (DD2 / MH Wilds)**:
    - The visibility buffer is written either via 64-bit atomics or as an R32G32Uint render target. The primitive ID uses 7 bits (max 128 triangles per meshlet), plus 24 bits to address CulledMeshletInfo.
    - Shader IDs are bucket-sorted to build indirect args.
    - The G-buffer is produced from the visibility buffer with "about 50 DrawInstanced" (DD2) and "about 60" (MH Wilds) — [Capcom REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Capcom.pdf)
  - **Diablo Immortal (mobile, Vulkan)**:
    - Color0 is R32G32UInt (TriangleID, barycentrics); Depth32F encodes the instance and geometry index.
    - Resolve: one full-screen draw per material, with a depth-equal test so only that material's pixels shade.
    - It was adopted to decouple geometry from shading, so existing assets plug into ray-traced reflections without vertex-format or shader changes — [Android Developers case study](https://developer.android.com/stories/games/diablo-raytracing)
  - **The Forge "Triangle Visibility Buffer 2.0"** (compute-based): prototype May 8 2024 (v1.57) — [The Forge v1.57](https://github.com/ConfettiFX/The-Forge/releases/tag/v1.57). Running on all platforms (Android: Samsung S22 only) by June 2024; programmable MSAA added in March 2025 — [The Forge releases](https://github.com/ConfettiFX/The-Forge/releases)
- (c) Gains/costs:
  - Nanite: the visibility buffer means "No overdraw or pixel quad inefficiencies" for dense meshes, and the material pass is "Not as slow as it seems" — [Nanite 2021](https://advances.realtimerendering.com/s2021/Karis_Nanite_SIGGRAPH_Advances_2021_final.pdf)
  - RedLynx's deferred-texturing "MSAA trick" on Xbox One at 1080p: G-buffer rendering time 3.03 → 2.06 ms (−32%), pixel-shader waves 83,016 → 36,969 — [Haar & Aaltonen 2015](https://advances.realtimerendering.com/s2015/aaltonenhaar_siggraph2015_combined_final_footer_220dpi.pdf)
- (d) Prerequisites: integer render targets (hardware-raster path) or 64-bit image atomics (software-raster path); material/attribute tables (bindless helps).
- (e) Web: WebGPU has no `atomic<u64>`, which nanite-webgpu says "prevents a visibility buffer and race-free depth/attribute writes". Its workaround packs u16 depth plus a 2×u8 octahedral normal into 32 bits ("butchering the precision"), which causes z-fighting and leaks — [nanite-webgpu](https://github.com/Scthe/nanite-webgpu)

#### 1.4 Meshlets and mesh shaders
- (a) Mechanism: pre-split meshes into small clusters (meshlets) with bounds and cones for per-cluster culling. Mesh/amplification shaders, where available, consume these clusters directly without fixed-function vertex fetch.
- (b) **Alan Wake 2** (Oct 2023, Northlight) relied on DX12 Ultimate mesh shaders. GPUs without them (e.g. GTX 10-series) launched the game with a warning and a heavy performance penalty.
  - Patch 1.0.16.1 (March 2024) added a better fallback. Gains measured by Digital Foundry, as reported: ~45% (GTX 1060), ~57% (GTX 1070), ~85% (GTX 1080) in a 1080p forest scene with FSR 2 Quality — [itc.ua (reporting DF)](https://itc.ua/en/news/alan-wake-2-patch-should-improve-performance-with-nvidia-gtx-10-graphics-cards-gtx-1080-ti-may-double-the-number-of-frames/); [Notebookcheck](https://www.notebookcheck.net/Alan-Wake-2-Performance-patch-for-older-GPUs.814134.0.html)
  - Remedy lowered the minimum spec to GTX 1070 / RX 5600 XT (6 GB) for 1080p30 low — [TechPowerUp](https://techpowerup.com/news-tags/Northlight%20Engine)
- (b) **RE ENGINE**:
  - Meshlets of up to 128 vertices / 128 triangles; DD2 and MH Wilds use 128/128.
  - "Large meshes use a single hardware mesh shader or vertex shader"; "Small meshlets use software rasterizer". The "GPU switches between mesh shaders and vertex shaders".
  - DD2 supports meshlets only for static background meshes — [Capcom REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Capcom.pdf)
- (c) Capcom measured the meshlet pipeline off→on in PS5 dev builds:

  | Game | Rendering commands | CPU time | GPU time | VRAM |
  |---|---|---|---|---|
  | Dragon's Dogma 2 | 19,510 → 8,172 | 5.502 → 3.891 ms | 27.05 → 19.90 ms | 6.821 → 5.960 GB |
  | Monster Hunter Wilds | 8,589 → 6,940 | 8.981 → 5.228 ms | 34.212 → 27.605 ms | 5.290 → 5.177 GB |

  Source: [Capcom REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Capcom.pdf)
- (c) Meshlet sizing and culling cost (Capcom, PS5):
  - Cluster culling took 882 µs at v128/t128 vs 1,002 µs at v64/t64. Small meshlets "cause increased file size and cluster culling cost".
  - Splitting each mesh's cluster-culling work across 16 sub-dispatches cut culling from 0.543 to 0.051 ms (visibility pass 1.578 → 1.159 ms).
  - Compressing meshlet attributes (storing a single value when all are equal) saved 35 MB — [Capcom REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Capcom.pdf)
- (d) Prerequisites: mesh shading (DX12 Ultimate / Vulkan mesh shader / PS5 primitive shaders). Nanite notes that "Primitive shaders or mesh shaders can be faster but are still bottlenecked" for micro-triangles — [Nanite 2021](https://advances.realtimerendering.com/s2021/Karis_Nanite_SIGGRAPH_Advances_2021_final.pdf)
- (e) Web: no mesh shaders (per the brief). Cluster/triangle culling can still be emulated with compute + index compaction. Indy's GPU triangle culling builds "a new index list after testing each triangle against the occlusion buffer as well as doing frustum, back face and pixel center culling" (it does not use mesh shaders) — [MachineGames REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Indy.pdf)

#### 1.5 Virtualised geometry / cluster-LOD DAG (Nanite and successors)
- (a) Nanite mechanism:
  - Geometry is split into 128-triangle clusters. Groups of 8–32 clusters are merged, simplified with QEM (boundaries locked) and re-split into a DAG.
  - Each cluster's simplification error is projected to screen pixels. A cluster renders if ParentError > threshold && ClusterError ≤ threshold, so selection runs in parallel with no DAG traversal; culling uses a BVH over ParentError.
  - Clusters are drawn at <1 pixel of error so TAA hides the transitions — [Nanite 2021](https://advances.realtimerendering.com/s2021/Karis_Nanite_SIGGRAPH_Advances_2021_final.pdf)
- (b) Shipping:
  - UE5 Nanite (2022→).
  - Ubisoft's "Micropolygon" virtualised geometry "first shipped in Assassin's Creed Shadows" (March 2025). The GDC 2026 talk "Micropolygon Rendering in Anvil" (Berenguier, Minnetian) covers rasterisation, deferred-material extensions and GPU-driven streaming — [80.lv](https://80.lv/articles/ubisoft-shows-off-micropolygon-rendering-in-anvil-engine); [GDC Vault](https://gdcvault.com/play/1035671/Micropolygon-Rendering-in-Anvil)
  - PCGH's GDC 2025 coverage: in cities ~410 million triangles are processed GPU-side and culled to ~1.7 million; in vegetation areas ~1.5 billion are culled to ~6.8 million — [PC Games Hardware (German)](https://www.pcgameshardware.de/Assassins-Creed-Shadows-Spiel-74683/Specials/GDC-2025-Anvil-Engine-1468846/)
  - Anvil runs three geometry paths side by side: Batch Renderer, GPU Instance Renderer and Micropolygon. "Entity setup determines pipeline" and this "Strongly affect[s] performances" — [Ubisoft, REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Anvil.pdf)
  - UE 5.7 (Nov 2025) "Nanite Foliage" (experimental) combines Nanite Assemblies (instanced parts), Nanite Skinning (instead of World Position Offset) and Nanite Voxels (for distant foliage) — [Tom Looman UE 5.7](https://tomlooman.com/unreal-engine-5-7-performance-highlights/)
- (c) Lumen in the Land of Nanite on PS5, at an average ~2496x1404 temporally upsampled to 4K:
  - Culling and rasterisation of a complete VisBuffer takes ~2.5 ms; the deferred material pass ~2 ms. Nanite rasterises 25M triangles where the UE4 path "would have to rasterize over a billion triangles". The authors call this "Well within budget for a 60hz game".
  - "We can handle a million instances easily". Transforms alone become a limit: 10M × float4x3 = 457 MB — [Nanite 2021](https://advances.realtimerendering.com/s2021/Karis_Nanite_SIGGRAPH_Advances_2021_final.pdf)
- (d) Prerequisites: compute, 64-bit atomics (software raster), persistent-thread work queues, large storage buffers, a streaming system.
- (e) Web and libraries:
  - **nanite-webgpu**:
    - Builds meshlet LOD hierarchies in the browser with WASM builds of meshoptimizer and METIS.
    - Demo scenes reach 1.7B triangles across instances, with "about 98% of triangles software-rasterized".
    - Limits: the 128 MB storage-buffer limit in Chrome, no streaming/eviction, and no shader work queues (one thread per meshlet instead) — [nanite-webgpu](https://github.com/Scthe/nanite-webgpu)
  - **Bevy's experimental meshlet renderer** "does not work on WASM", because virtual geometry uses 64-bit integers and atomics that WebGPU lacked — [Bevy meshlet docs](https://dev-docs.bevyengine.org/bevy/pbr/experimental/meshlet/index.html); [Bevy 0.14](https://bevy.org/news/bevy-0-14/); [HN thread with the Bevy maintainer](https://hn.svelte.dev/item/42974461)
  - **meshoptimizer's `clusterlod.h`** is a single-header, Nanite-style DAG builder: clusters of ≤128 triangles, grouped, simplified with boundaries locked, then re-split. It processed NVIDIA's 1.64B-triangle Zorah scene (18.9B with instancing, a 36.1 GB glTF) in ~2m35s on a 16-core Ryzen 7950X — [zeux.io, Sep 2025](https://zeux.io/2025/09/30/billions-of-triangles-in-minutes/)
  - meshoptimizer v1.0 improved clusterization and partitioning, which raises hierarchical DAG quality — [meshoptimizer v1 notes](https://meshoptimizer.org/v1.html) (release date not verified)

#### 1.6 Software rasterisation of small triangles
- (a) Mechanism: clusters made of tiny triangles are rasterised in a compute shader that writes depth+ID via 64-bit atomics. Larger triangles, and cases such as clipping, go to the hardware rasteriser — [Nanite 2021](https://advances.realtimerendering.com/s2021/Karis_Nanite_SIGGRAPH_Advances_2021_final.pdf)
- (c) Gains:
  - Nanite: "3x faster than hardware on average compared to our fastest primitive shader implementation". Clusters "with edges <32 pixels are SW rasterized" — [Nanite 2021](https://advances.realtimerendering.com/s2021/Karis_Nanite_SIGGRAPH_Advances_2021_final.pdf)
  - Capcom: "Software Rasterizer announced to be 3 times faster. We tested ComputeShader on older hardware, results 2.4 times faster". In a PS5 cascade shadow map, meshlet processing took 0.381 ms software vs 0.824 ms hardware (frustum culling) — [Capcom REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Capcom.pdf)
  - CuRast (2026, CUDA) renders hundreds of millions of triangles 2–5x faster (unique) or up to 12x faster (instanced) than Vulkan. But "Vulkan remains an order of magnitude faster for low-poly meshes" — [CuRast paper](https://arxiv.org/pdf/2604.21749)
- (d) Prerequisites: 64-bit atomics, which WebGPU lacks — [nanite-webgpu](https://github.com/Scthe/nanite-webgpu)

#### 1.7 NVIDIA RTX Mega Geometry (2025)
- (a) Mechanism: builds ray-tracing acceleration structures from GPU-generated clusters of up to 256 triangles, cutting BVH rebuild time and CPU overhead for dense or animated geometry. It runs on RTX 20-series and newer; Blackwell adds a triangle-cluster intersection engine and a cluster compression engine — [Igor'sLAB, GDC 2026 coverage](https://www.igorslab.de/en/the-geforce-platform-in-transition-ai-reconstruction-ray-tracing-and-new-rendering-structures-as-the-basis-for-the-next-generation-of-games-gdc-2026/4); [Tom's Hardware test](https://tomshardware.com/pc-components/gpus/testing-nvidias-rtx-mega-geometry-tech-vram-reducing-tech-a-leap-forward-for-path-traced-rendering)
- (b) Alan Wake 2 was the first shipping game (update 1.2.8) — [Tom's Hardware](https://tomshardware.com/pc-components/gpus/testing-nvidias-rtx-mega-geometry-tech-vram-reducing-tech-a-leap-forward-for-path-traced-rendering); [DSOGaming](https://www.dsogaming.com/?p=185469)
- (c) Measured effects (from search summaries; both pages failed to load in full):
  - One RTX 4090 comparison showed an average 13% VRAM reduction plus an fps gain.
  - NVIDIA estimates +5–20% performance, depending on the scene.
  - Digital Foundry reportedly found a larger effect on RTX 20/30 than on newer cards — [Tom's Hardware](https://tomshardware.com/pc-components/gpus/testing-nvidias-rtx-mega-geometry-tech-vram-reducing-tech-a-leap-forward-for-path-traced-rendering); [Igor'sLAB](https://www.igorslab.de/en/the-geforce-platform-in-transition-ai-reconstruction-ray-tracing-and-new-rendering-structures-as-the-basis-for-the-next-generation-of-games-gdc-2026/4)
- (c) NVIDIA's open-source `vk_lod_clusters` sample can use meshoptimizer's `clusterlod.h` to build cluster LODs for the Zorah scene — [zeux.io 2025](https://zeux.io/2025/09/30/billions-of-triangles-in-minutes/)
- (d)/(e) Needs hardware RT plus NVIDIA cluster extensions. Not applicable to the web, which has no hardware RT.

#### 1.8 D3D12 Work Graphs (+ mesh nodes)
- (a) Mechanism: a GPU-side producer/consumer graph in which shaders launch other shaders without the CPU. Mesh nodes are leaf nodes that dispatch a mesh-shader graphics pipeline, so "draw calls are now an integral part of GPU work graphs" — [AMD GPUOpen](https://gpuopen.com/learn/work_graphs_mesh_nodes/work_graphs_mesh_nodes-intro/)
- (b) Timeline:
  - Work Graphs 1.0 released March 2024 — [Microsoft DirectX blog](https://devblogs.microsoft.com/directx/d3d12-work-graphs/)
  - Mesh nodes preview July 2024, Developer Mode only — [Microsoft DirectX blog](https://devblogs.microsoft.com/directx/d3d12-mesh-nodes-in-work-graphs/)
  - Public preview October 2024 with an AMD day-0 driver. The GPUOpen page, last updated Nov 24 2025, still describes preview status and gives no quantitative performance numbers — [AMD GPUOpen](https://gpuopen.com/learn/work_graphs_mesh_nodes/work_graphs_mesh_nodes-intro/)
  - DSOGaming questioned adoption without console support — [DSOGaming](https://dsogaming.com/?p=178805)
- (c)/(e) No published game gains found. Not available on the web.

#### 1.9 Bindless resources
- (a) Mechanism: shaders index large descriptor tables instead of using per-draw bindings, so one indirect draw can span many materials and textures.
- (b) RE ENGINE meshlet instance records (80 bytes) carry a "PartsTableIndex: (bindless index)". The older RE ENGINE pipeline already rendered instances "where bindless is applied and materials differ" — [Capcom REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Capcom.pdf). RedLynx got the same effect in 2015 through one virtual-texture binding — [Haar & Aaltonen 2015](https://advances.realtimerendering.com/s2015/aaltonenhaar_siggraph2015_combined_final_footer_220dpi.pdf)
- (d)/(e) WebGPU status: not standardised.
  - Kangz's investigation proposes per-binding-type indexing after "they tried hard to support heterogeneous bindless directly in WebGPU but didn't succeed" — [hackmd proposal](https://hackmd.io/PCwnjLyVSqmLfTRSqH0viA)
  - May 2025 GPU Web meeting: bindless "is needed but not yet available"; D3D12 bind-group mutation constraints are discussed — [GPU Web 2025-05-14 minutes](https://github.com/gpuweb/gpuweb/wiki/GPU-Web-2025-05-14)
  - Chromium's `chromium_experimental_resource_table` WGSL extension is experimental, with syntax still under discussion — [Dawn doc](https://dawn.googlesource.com/dawn/+show/e2e04fd6f72a4dd4b41f36da5e81c3cd79dc6992/docs/tint/extensions/chromium_experimental_resource_table.md)
  - Dawn enabled bindless on Vulkan via descriptor indexing, gated on device capabilities — [Dawn commit](https://dawn.googlesource.com/dawn/+/21b6811e20a5629d26f3ac513de056dc8484b0e6%5E%21)

#### 1.10 Engine-packaged GPU-driven paths for ordinary content (Unity 6) and web render bundles
- **Unity 6 GPU Resident Drawer**: draws GameObjects with GPU instancing through BatchRendererGroup. It requires Forward+, compute shader support (not OpenGL ES) and MeshRenderers. Builds take longer because all BRG shader variants are compiled — [Unity 6.3 docs](https://docs.unity3d.com/6000.3/Documentation/Manual/urp/gpu-resident-drawer.html)
- **Unity 6 GPU occlusion culling**: gains are largest with heavy occlusion and occluded objects that have many vertices but a small screen radius. "If occlusion culling doesn't have a big effect on your scene, rendering time might increase" — [Unity 6.2 docs](https://docs.unity3d.com/6000.2/Documentation/Manual/urp/gpu-culling.html)
- **Unity vendor claims**: up to 50% CPU frame-time reduction for GameObjects; Fantasy Kingdom batches 137K → 13K — [Unity 6 beta highlights](https://discussions.unity.com/t/unity-6-beta-2023-3-feature-highlights/936841); [80.lv](https://80.lv/articles/unity-6-a-deep-dive-into-the-update-s-new-features-enhancements/)
- **Babylon.js snapshot rendering** (WebGPU only): drawing one mesh costs roughly 6–10 browser API calls, so tens of thousands of draws per frame are hard to sustain. Snapshot mode wraps these calls in render bundles — [Babylon.js forum](https://forum.babylonjs.com/t/why-webgpu-backend-is-slower/24091). Secondary coverage of Babylon.js 7.0 (March 2024) claims up to ~10x CPU-side speedups for static geometry — [Cinevva summary](https://app.cinevva.com/news/2024-03-28-babylonjs-7)

### Inferences
- **WebGPU feasibility.** Compute culling → `drawIndexedIndirect` per pipeline/material is feasible today. The RedLynx DX11 recipe is the closest proven template, because it needed neither multi-draw-indirect nor bindless: vertex pulling from storage buffers, 64-vertex/triangle clusters, compaction, and two indirect draws per viewport. Without multi-draw-indirect, each material bucket still costs one JS-issued call. CPU cost therefore scales with material count, not object count, so it should be paired with texture arrays/atlases. Those also help with the 16-sampled-textures-per-stage default.
- **WebGL2.** No compute and no indirect draw, so GPU-driven culling is out. CPU culling over a spatial grid is cheap because the isometric frustum covers a small, bounded ground area. Combine it with instancing and `WEBGL_multi_draw` (per-draw `gl_DrawID`) to cut call overhead.
- **Hybrid option.** Saber's model (GPU visibility → async readback → CPU-built draws) could run on WebGPU via `mapAsync`, but it adds about 1–2 frames of latency. For an ARPG camera, CPU frustum culling is probably sufficient.
- **Occlusion culling in an isometric ARPG.** Two-phase HZB and occluders pay off little outdoors, because a top-down camera sees almost everything inside its frustum. It may matter in dungeons with tall walls, but only if walls are not cut away or faded. The wgpu BIM data point shows that halving the survivors can still leave FPS flat.
- **Visibility buffer and software raster.** These pay off with micro-triangles (Nanite and CuRast data). Isometric low/mid-poly content seen from a fixed distance does not have micro-triangles, so they are low priority. A visibility buffer also fights three.js's per-material shader model.
- **Triangle/cluster culling.** Most valuable for shadow passes: ACU culled 30–80% of shadow triangles. That matters for an ARPG with several shadowed spell lights.
- **Future-only items.** Mesh shaders, RTX Mega Geometry, Work Graphs and bindless are useful as a direction of travel, not as 2026 browser features. Bindless and multi-draw-indirect are the ones most likely to reach WebGPU first.

### Gaps
- Frostbite's GPU-driven compute-culling talk (Wihlidal, GDC 2016) could not be retrieved: the EA page returned 404. There are no primary numbers here for Frostbite's triangle-culling filters.
- No primary source was found for an Activision/Call of Duty GPU-driven or visibility-buffer pipeline. Activision's 2025 SIGGRAPH talk was on adaptive voxel-based OIT, listed at [SIGGRAPH 2025 Advances](https://advances.realtimerendering.com/s2025/index.html), and was not read.
- No confirmed shipping game uses Work Graphs or mesh nodes as of the latest source (Nov 2025). Status at Oct 2026 is unverified.
- RTX Mega Geometry numbers come from secondary coverage; the article bodies could not be fetched.
- WebGPU availability of multi-draw-indirect, 64-bit atomics and subgroups as of Oct 2026 could not be verified, because the shared web-search budget ran out mid-research. The nanite-webgpu and Bevy statements reflect 2024–2025.

## Q2. Classic optimisations still in use: batching, instancing, static batching, atlases/arrays, material/state sorting, discrete LOD with dithered cross-fade, HLOD, impostors, PVS/portals, software occlusion culling, hardware occlusion queries, distance/screen-size culling, shadow-caster culling

### Takeaway
Classic techniques are still everywhere in 2024–26 AAA renderers. GPU-driven engines mostly re-implement them on the GPU rather than drop them. The list:
- instancing and batching with per-pipeline sorting;
- discrete LOD with dithered transitions and billboards;
- HLOD proxies;
- hand-authored occluders;
- screen-size culling;
- shadow-caster culling and static shadow caches.

They also have the best payoff-to-feasibility ratio for WebGL2/WebGPU.

### Cited Findings

#### 2.1 Draw-call batching, instancing, static batching
- **Space Marine 2 (Swarm Engine)**:
  - A CPU "draw calls batcher" collects draw requests with a header (material id, prop mask, instancing bucket). It groups and aggregates them and writes instancing payloads directly into mapped buffers, about 30 MB × 2 of CPU instancing payloads.
  - A GPU instancing path, culled in compute, handles static and procedural content. "In 90% of cases static geometry is the best choice".
  - Prefab pieces become individual GPU instances, handling 250K+.
  - Static data for 300K instances is ~5 MB, and ~6 MB for 400K procedural instances, thanks to half floats and 32-bit quaternions — [Saber REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Saber.pdf)
- **Predecessor, World War Z (GDC 2019)**: 30 FPS, Forward+, "2 frames of latency", visibility test in compute, multi-threaded command-list generation — [Saber REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Saber.pdf)
- **RE ENGINE before meshlets**: bindless instancing could cover differing materials but was "Unable to handle differences between geometry and LODs due to CPU limitations". That was the motivation for meshlets — [Capcom REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Capcom.pdf)
- **AMD guidance**: put at least ~10 draws/dispatches per command buffer. Bundles and secondary command buffers mainly help CPU cost and can hurt GPU performance — [AMD RDNA guide](https://gpuopen.com/learn/rdna-performance-guide/)
- See 1.10 for Unity's GPU Resident Drawer and Babylon.js render-bundle snapshots.

#### 2.2 Material / pipeline / state sorting
- **Indy**:
  - With GPU-driven draws, "the order in which pipelines are drawn matters a lot". Alpha-tested pipelines always go last, which gives "a nice perf boost in depth and shadow passes".
  - Alpha-tested draws are coarsely sorted in buckets of 1024 draws within one pipeline (one workgroup) to reduce overdraw — [MachineGames REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Indy.pdf)
- **Saber**: all collected draw-instanced-primitive requests are sorted, then recorded into command buffers — [Saber REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Saber.pdf)
- **Capcom**: the visibility-buffer material pass bucket-sorts by shader ID into indirect arguments — [Capcom REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Capcom.pdf)
- **RedLynx**: "Cluster depth sorting provides gain similar to depth prepass" — [Haar & Aaltonen 2015](https://advances.realtimerendering.com/s2015/aaltonenhaar_siggraph2015_combined_final_footer_220dpi.pdf)

#### 2.3 Texture atlases / arrays / virtual textures as a batching enabler
- RedLynx Trials virtual texturing:
  - 256k² virtual atlas, 128² texel pages, 8k² physical page cache.
  - The cache is a 5-slice texture array (albedo, specular, roughness, normal, etc.) in BC5/BC3.
  - A single binding means "No need to batch by textures!" — [Haar & Aaltonen 2015](https://advances.realtimerendering.com/s2015/aaltonenhaar_siggraph2015_combined_final_footer_220dpi.pdf)
- UE 5.7: virtual-texture space is released after `r.VT.SpaceReleaseFrames` (default 150 frames) — [Tom Looman UE 5.7](https://tomlooman.com/unreal-engine-5-7-performance-highlights/)

#### 2.4 Discrete LOD with dithered cross-fade, billboards, density LOD
- **Space Marine 2**:
  - "Up to 8 LOD levels + billboard per mesh".
  - The per-instance GPU payload carries the "Sign of transition (source or target for LOD)" plus extra opacity for dithered transitions.
  - Scattered debris supports "density reduction during LOD evaluation" — [Saber REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Saber.pdf)
- **Nanite** replaces discrete LOD with per-cluster selection at <1 pixel of error and relies on TAA to hide the switch — [Nanite 2021](https://advances.realtimerendering.com/s2021/Karis_Nanite_SIGGRAPH_Advances_2021_final.pdf)
- **nanite-webgpu** blends its impostors "with dithering by camera position" — [nanite-webgpu](https://github.com/Scthe/nanite-webgpu)

#### 2.5 HLOD (UE World Partition)
- What it does: HLOD Layers merge many static-mesh actors into "a single proxy mesh and Material". The proxies stand in for unloaded World Partition cells and "reduce the number of draw calls per frame" — [Epic docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/world-partition---hierarchical-level-of-detail-in-unreal-engine)
- Layer types: Instancing, Merged Mesh, Simplified Mesh, Approximated Mesh — [Epic docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/world-partition---hierarchical-level-of-detail-in-unreal-engine)
- The German docs say landscape and water components are not currently supported by HLOD actors (may be outdated) — [Epic docs (de)](https://dev.epicgames.com/documentation/de-de/unreal-engine/world-partition---hierarchical-level-of-detail-in-unreal-engine)
- UE 5.7 adds Custom HLOD actors and layers so teams can supply their own distant representations — [Tom Looman UE 5.7](https://tomlooman.com/unreal-engine-5-7-performance-highlights/)

#### 2.6 Impostors (billboard, octahedral, visibility-buffer impostors)
- **Nanite "visibility buffer imposters"** for distant instances store IDs, not colour or G-buffer attributes; they cost "40.5KB per mesh always resident" — [Nanite 2021](https://advances.realtimerendering.com/s2021/Karis_Nanite_SIGGRAPH_Advances_2021_final.pdf)
- **nanite-webgpu** uses 12 views around the up axis, storing diffuse + normals, dither-blended. Top-down views are not handled — [nanite-webgpu](https://github.com/Scthe/nanite-webgpu)
- **Space Marine 2** uses a billboard as the final LOD (see 2.4) — [Saber REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Saber.pdf)
- **Octahedral impostors** (Ryan Brucks, foundational): the post exists at [ShaderBits](https://shaderbits.com/blog/octahedral-impostors), but its text could not be retrieved, so its details are not verified here.

#### 2.7 Precomputed visibility (cells / portals / PVS)
- How it works (Unity built-in occlusion culling): visibility data for cells is baked in the editor and queried on the CPU per camera at runtime, on top of frustum culling — [Unity manual](https://docs.unity3d.com/Manual/OcclusionCulling.html)
- Where it helps: best "in scenes with small, well-defined areas separated by solid GameObjects, such as rooms connected by corridors"; most useful when GPU-bound "due to overdraw" — [Unity manual](https://docs.unity3d.com/Manual/OcclusionCulling.html)
- Limits:
  - "Dynamic GameObjects cannot occlude other GameObjects".
  - The CPU culling cost can offset the savings.
  - Not suitable for geometry generated at runtime.
  - URP/HDRP offer GPU occlusion culling as an alternative — [Unity manual](https://docs.unity3d.com/Manual/OcclusionCulling.html)

#### 2.8 Software occlusion culling and authored occluders
- **Intel Masked Software Occlusion Culling** (HPG 2016): SIMD software rasterisation of occluders into a hierarchical depth mask. Intel's repository describes it as useful for large terrain patches with foreground occluders in open worlds — [Intel article](https://intel.com/content/www/us/en/developer/articles/technical/masked-software-occlusion-culling.html); [HPG 2016 paper page](https://fileadmin.cs.lth.se/graphics/research/papers/2016/culling/)
- **Shipping use**: Intel's GDC 2018 deck lists MOC as "Used in Conqueror's Blade" — [Intel GDC 2018 slides](https://www.slideshare.net/slideshow/masked-occlusion-culling/96551796)
- **Related engines**: a follow-up Intel paper says the Frostbite engine, Umbra and Intel's framework "all rely on software rasterization to create a hierarchical depth buffer". This does not confirm that those engines use MOC itself — [Intel merging paper](https://intel.com/content/dam/develop/external/us/en/documents/merging-masked-occlusion-culling-hierarchical-buffers-faster-rendering.pdf)
- **Authored occluders are still common in 2024–25 GPU-driven engines**:
  - Space Marine 2: ~1K manual low-poly occluders combined with reprojected depth — [Saber REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Saber.pdf)
  - Indy places "extra manual blockers (boxes or planes)" where statics leave holes in the occlusion buffer — [MachineGames REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Indy.pdf)
  - RE ENGINE's older pipeline "Used occluders created by artists" — [Capcom REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Capcom.pdf)

#### 2.9 Distance / screen-size culling
- **Indy** added a tweakable "Fudge factor to throw away small draws (screen space box too small)" for the Gizeh level, where the whole level is loaded at once. It was "sufficient to get into budget without sacrificing too much visual quality" — [MachineGames REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Indy.pdf)
- **UE Virtual Shadow Maps**: `r.Shadow.RadiusThreshold` controls CPU culling of non-Nanite shadow casters by size — [Epic VSM docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/virtual-shadow-maps-in-unreal-engine)
- **Space Marine 2**: density reduction for scattered instances during LOD evaluation — [Saber REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Saber.pdf)

#### 2.10 Shadow-caster culling
- **ACU**: each cascade combines camera-depth reprojection (~70 µs) with shadow-depth reprojection (10 µs) into a depth hierarchy for GPU culling. 30–80% of shadow triangles are culled — [Haar & Aaltonen 2015](https://advances.realtimerendering.com/s2015/aaltonenhaar_siggraph2015_combined_final_footer_220dpi.pdf)
- **RE ENGINE (PS5)**:

  | Setup | Triangles | Time |
  |---|---|---|
  | 3 cascades, async compute: frustum culling only | 13.54M | 6.71 ms |
  | 3 cascades, async compute: + depth reprojection | 7.93M | 4.83 ms |
  | 3 cascades + 1 spot: depth reprojection | 10.65M | 3.19 ms |
  | 3 cascades + 1 spot: + SMI (with artifacts) | 2.71M | 1.91 ms |
  | 3 cascades + 1 spot: + SMI + TPOC | 3.30M | 2.28 ms |

  Source: [Capcom REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Capcom.pdf)
- **UE Virtual Shadow Maps**: only the pages needed by on-screen pixels, found through depth-buffer analysis, are allocated and rendered — [Epic VSM docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/virtual-shadow-maps-in-unreal-engine)
- **Indy** renders shadows into an atlas with a mix of CPU- and GPU-generated draws. "Shadows do not use GPU triangle culling" — [MachineGames REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Indy.pdf)

### Inferences
- **Highest-ROI items for the ARPG.** All of these work on WebGL2:
  - instancing of monsters, props and foliage;
  - pipeline sorting, with alpha-test last;
  - texture arrays/atlases, both for batching and to stay under WebGPU's default of 16 sampled textures per stage;
  - screen-size culling of tiny props, decals and debris.
- **Dungeons.** PVS/portals (a room graph) earn their keep by culling lights, shadow casters and particle emitters, and by deciding which rooms to stream. They matter less for camera occlusion, because the top-down camera already sees everything inside its small frustum.
- **Shadow-caster culling.** When spells spawn shadowed point/spot lights, cull casters against each light's volume, intersected with the camera-visible region. Capcom's and ACU's numbers show this is where triangle counts and milliseconds actually drop.
- **LOD.** With a near-fixed camera height, LOD mostly serves zoom levels and far parts of outdoor maps. Monster LODs (fewer vertices and bones) and billboard/VAT LODs for far crowds are the main uses. Dithered LOD transitions (Saber) are cheap in both APIs.
- **Software occlusion culling (MOC).** Feasible in WASM SIMD, but low value for a top-down camera.

### Gaps
- No 2023–26 AAA data on hardware occlusion queries was found. WebGL2/WebGPU occlusion-query capabilities were not re-verified in this session.
- No list of 2024–26 games using Umbra or PVS was found.
- The octahedral impostor article's details could not be loaded.

## Q3. Memory and streaming: texture streaming/mip budgets, virtual texturing, BC/ASTC, neural texture compression, mesh compression, DirectStorage/GPU decompression, open-world streaming

### Takeaway
Current AAA practice for memory and streaming:
- fixed, pre-sized memory pools with on-demand LOD/MIP streaming (Indiana Jones);
- page-based geometry streaming (Nanite's 128 KB pages);
- aggressive data packing (half floats, quaternions, per-meshlet attribute dedup);
- block-compressed textures everywhere;
- since 2025, neural texture compression (NVIDIA RTX NTC SDK beta, with vendor claims of 80–96% texture-VRAM reduction for a few % of fps);
- GPU decompression (DirectStorage 1.2, first used in Ratchet & Clank PC, 2023).

For the web, block compression (KTX2/Basis), mesh compression (meshopt/Draco), pool discipline and player-centred streaming carry over. NTC and DirectStorage do not.

### Cited Findings

#### 3.1 Fixed pools + on-demand LOD/MIP streaming
- **Indy**: "most data in the game is placed in fixed sized pools. These are allocated up front with a worst case bound. They cannot grow at runtime". Pools are bigger in development builds, and "LODS and MIPS are streamed in on demand". Big drops in its VRAM-over-time graph were "mostly pool size changes and changes to the streaming systems" — [MachineGames REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Indy.pdf)
- **UE 5.7**: `r.Streaming.EnableAssetUpdateAbandons` lets streamable render assets be garbage-collected independently — [Tom Looman UE 5.7](https://tomlooman.com/unreal-engine-5-7-performance-highlights/)

#### 3.2 Virtual texturing / virtual shadow maps
- **RedLynx virtual texturing** (see 2.3): only visible texture data stays in memory, in 128² pages and an 8k² cache — [Haar & Aaltonen 2015](https://advances.realtimerendering.com/s2015/aaltonenhaar_siggraph2015_combined_final_footer_220dpi.pdf)
- **RedLynx virtual shadow mapping**: a 128k² virtual shadow map with 256² pages, where the needed pages are identified from the z-buffer. Measured "Up to 3.5x faster than SDSM in complex 'sparse' scenes", and slightly slower than SDSM/CSM in simple scenes — [Haar & Aaltonen 2015](https://advances.realtimerendering.com/s2015/aaltonenhaar_siggraph2015_combined_final_footer_220dpi.pdf)
- **UE Virtual Shadow Maps**: 16k × 16k virtual resolution per map, with 128×128 pages. A directional light uses a clipmap of 16k levels (levels 6–22, covering 64 cm to ~40 km) — [Epic VSM docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/virtual-shadow-maps-in-unreal-engine)

#### 3.3 Block compression and data packing
- **Indy**: "Packing and compressing data helps a lot … tightly packing structs, ensuring texture formats and vertex formats are compressed" — [MachineGames REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Indy.pdf)
- **RedLynx**: virtual-texture pages are DXT-compressed (BC5/BC3) — [Haar & Aaltonen 2015](https://advances.realtimerendering.com/s2015/aaltonenhaar_siggraph2015_combined_final_footer_220dpi.pdf)
- **Saber**: static instance data uses half floats per component and compressed 32-bit quaternions — [Saber REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Saber.pdf)
- **Capcom**: meshlet attribute compression (one stored value when all are equal) saved 35 MB — [Capcom REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Capcom.pdf)
- **Web equivalents** (well-known spec/project pages, not re-fetched in this session):
  - Basis Universal / KTX2 supercompressed textures that transcode to BC, ETC or ASTC on the client — [basis_universal](https://github.com/BinomialLLC/basis_universal)
  - WebGPU optional features `texture-compression-bc`, `-etc2` and `-astc` — [WebGPU spec](https://www.w3.org/TR/webgpu/)

#### 3.4 Neural texture compression (NVIDIA RTX NTC, 2025)
- (a) Three modes:
  - **Inference on Load**: decompress when the map loads and transcode to BCn. Minimal runtime cost but much smaller VRAM savings.
  - **Inference on Sample**: decode per texel in the shader, about 5 bpp, paired with stochastic texture filtering because the decoder returns one unfiltered texel.
  - **Inference on Feedback**: sampler feedback finds the needed tiles, which are decoded into a sparse BCn texture. Not supported on Vulkan.

  Sources: [RTXNTC GitHub](https://github.com/NVIDIA-RTX/RTXNTC); [DeepWiki summary](https://deepwiki.com/NVIDIA-RTX/RTXNTC); [Tom's Hardware](https://tomshardware.com/pc-components/gpus/benchmarking-nvidias-rtx-neural-texture-compression-tech-that-can-reduce-vram-usage-by-over-80-percent)
- (b) Status:
  - Beta SDK — [Phoronix](https://www.phoronix.com/news/NVIDIA-RTXNTC-0.5-Beta/)
  - In August 2026 NVIDIA announced NTC support on RTX Spark (Windows-on-Arm) systems, claiming "up to seven times" lower VRAM use — [Profesional Review (Spanish)](https://www.profesionalreview.com/2026/08/07/rtx-spark-soporte-neural-texture-compression/amp/)
  - No shipping game was confirmed in these sources.
- (c) Reported numbers (vendor demos):
  - A demo scene drops from 6.5 GB to 970 MB — [TweakTown](https://www.tweaktown.com/news/110886/nvidias-neural-texture-compression-cuts-vram-usage-from-6-5gb-down-to-970mb/index.html)
  - 96% memory reduction at 1440p, with a 5.6% drop in average frame rate (larger at 4K) — [Notebookcheck (Italian)](https://www.notebookcheck.it/La-compressione-neurale-delle-texture-di-Nvidia-RTX-potrebbe-ridurre-l-utilizzo-della-VRAM-del-96-tramite-il-download.959421.0.html)
  - "over 80%" — [Tom's Hardware](https://tomshardware.com/pc-components/gpus/benchmarking-nvidias-rtx-neural-texture-compression-tech-that-can-reduce-vram-usage-by-over-80-percent)
- (d) Prerequisites: RTX-class GPUs; DX12 cooperative vectors or Vulkan for the full benefit (per the coverage above).
- (e) Web: none found.

#### 3.5 Mesh compression
- Nanite on Lumen in the Land of Nanite — [Nanite 2021](https://advances.realtimerendering.com/s2021/Karis_Nanite_SIGGRAPH_Advances_2021_final.pdf):

  | Measure | Value |
  |---|---|
  | Input triangles | 433M (882M Nanite triangles) |
  | Raw data | 25.90 GB |
  | Memory format | 7.67 GB |
  | Compressed disk format | 4.61 GB |
  | Bytes per Nanite triangle | 5.6 |
  | Bytes per input triangle | 11.4 |
  | Disk size per 1M triangles | ~10.9 MB |

- The Nanite disk format applies "domain specific transforms" so that console hardware LZ decompression compresses the data better — [Nanite 2021](https://advances.realtimerendering.com/s2021/Karis_Nanite_SIGGRAPH_Advances_2021_final.pdf)
- Web/glTF equivalents (not re-fetched): EXT_meshopt_compression — [Khronos glTF extension](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_meshopt_compression). KHR_draco_mesh_compression — [Khronos glTF extension](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_draco_mesh_compression)

#### 3.6 Geometry streaming (Nanite pages)
- Nanite fills fixed-size 128 KB pages at cluster granularity (~2 KB per cluster), leaving ~1% slack.
- The root page holding the top of the DAG is always resident, so "we always have something to render".
- The culling traversal emits page requests prioritised by LOD error — [Nanite 2021](https://advances.realtimerendering.com/s2021/Karis_Nanite_SIGGRAPH_Advances_2021_final.pdf)

#### 3.7 DirectStorage / GPU decompression
- Ratchet & Clank: Rift Apart PC (July 2023, Nixxes) uses DirectStorage 1.2 GPU decompression at high settings to stream assets in the background — [TechSpot](https://www.techspot.com/news/99392-ratchet-clank-rift-apart-pc-use-directstorage-12.html); [Nixxes](https://nixxes.com/project/ratchet-clank-rift-apart)
- It still supports SATA SSDs and HDDs — [Lowyat](https://lowyat.net/2023/303751/ratchet-clank-pc-port-no-ssd)

#### 3.8 Open-world streaming and instance caches
- **UE World Partition HLOD** (see 2.5) — [Epic docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/world-partition---hierarchical-level-of-detail-in-unreal-engine)
- **Space Marine 2**: GPU instance generation from up to 16 painted or terrain masks is "amortised", taking <0.5 ms in async compute. It caches instances near the main camera, and more than 200K instances fit in the cache — [Saber REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Saber.pdf)
- **Assassin's Creed Shadows**: "innovations in loading distance and automated adaptive geometry allow distant towns, mountains, and other landmarks to appear seamlessly" — [Ubisoft News, Apr 2026](https://news.ubisoft.com/en-gb/article/6u0kflsdY20YlnZks7rUeG/inside-anvil-the-technology-powering-assassins-creed-shadows)

### Inferences
- **Textures.** KTX2/Basis is the web's equivalent of console BC: BC on desktop, ASTC/ETC2 on mobile.
- **Meshes.** meshopt compression is the web analogue of Nanite's idea of quantising data and transforming it into an LZ-friendly layout. Its decoder is WASM, which fits browser streaming.
- **Not applicable.** NTC needs tensor/cooperative-vector paths, and DirectStorage needs the OS I/O stack. Neither is available in browsers.
- **Fixed pools.** Indy-style pools matter even more in JS. Pre-size GPU buffers for the worst-case monster, particle and light counts to avoid buffer reallocation and GC hitches during fights.
- **Isometric streaming.** A player-centred ring of tiles works because the camera's ground footprint is bounded. Streaming can be predictive along the player's movement direction, and dungeon rooms can be streamed via the room graph.

### Gaps
- No primary benchmark isolating DirectStorage GPU-decompression gains was found.
- No published texture-pool budgets (MB per quality tier) for 2024–26 games were found beyond Indy's qualitative statements.
- KTX2, meshopt and Draco specifics were not re-fetched in this session. The researcher covering three.js should hold current loader details.

## Q4. Shader-compilation stutter: PSO precaching, permutation reduction, warm-up passes, lessons from 2023–2025 PC ports

### Takeaway
Under DX12/Vulkan, creating a pipeline (PSO) is a heavy CPU operation done on demand; Saber measured "~50–100 ms". PC ports from 2022 to 2025 (The Callisto Protocol, Star Wars Jedi: Survivor, Silent Hill f) showed hitches of hundreds of milliseconds. The 2024–26 answer combines five things:
1. Predict the pipeline set at load time: UE5 PSO precaching, Anvil's PSO database, Saber's manual cache.
2. Cut permutations: Saber had ~200k possible pipelines for 2k actually used; a UE 5.7 toggle saves 50k shaders.
3. Fall back to a default material, or skip the draw, when a pipeline is not ready.
4. Track spikes automatically.
5. Deliver precompiled shaders at platform level: Microsoft Advanced Shader Delivery, launched October 2025.

Path of Exile 2, an ARPG, still compiles shaders mid-session.

### Cited Findings

#### 4.1 Magnitude and symptoms
- **Saber**: creating a pipeline state "is CPU heavy operation" and "Can easily take ~50-100 ms". Their approach: create all pipeline states during loading, with "No pipeline creating during gameplay". It is "Only a PC issue" — [Saber REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Saber.pdf)
- **The Callisto Protocol** (UE4, 2022): Digital Foundry blamed missing precompilation. A 400 ms hitch on an i9-12900K became 750 ms on a Ryzen 5 3600 — [Wccftech](https://wccftech.com/the-callisto-protocol-pc-stuttering-is-unbelievably-bad-says-digital-foundry/amp/)
- **Star Wars Jedi: Survivor** (2023): shader and traversal stutter — [PCZone](https://www.pczone.co.uk/?p=12340)
- **Silent Hill f** (2025, UE5): shader-compilation stutter after the opening area, plus traversal stutter. Asynchronous compilation with visibility skipping caused frame-rate dips and objects appearing late, especially on a Ryzen 5 3600 — [Multiplayer.it, reporting DF (Italian)](https://multiplayer.it/notizie/silent-hill-f-pc-promosso-con-riserva-da-digital-foundry.html)

#### 4.2 UE5 PSO precaching
- **When it arrived**: Epic's Feb 4 2025 blog says precaching was introduced in UE 5.2. A 2023 report describes a UE 5.1 version that skips drawing an object whose PSO is not ready rather than stalling, and "will never be able to guarantee" readiness — [Epic tech blog](https://www.unrealengine.com/en-US/tech-blog/game-engines-and-shader-stuttering-unreal-engines-solution-to-the-problem); [DSOGaming](https://www.dsogaming.com/?p=170085)
- **How it works**: when an object loads, its materials, mesh traits and global settings (e.g. quality level) narrow down the candidate PSOs. The result is a superset of what is used, but small enough to compile during loading.
- **Scale**: Fortnite Battle Royale compiles ~30,000 PSOs per match and uses ~10,000, out of millions of combinations.
- **Mid-game fallback**: objects that stream in or spawn mid-game either wait for their PSOs or use an already compiled default material, which typically costs only a few frames — [Epic tech blog](https://www.unrealengine.com/en-US/tech-blog/game-engines-and-shader-stuttering-unreal-engines-solution-to-the-problem)
- **UE 5.7 changes** — [Tom Looman UE 5.7](https://tomlooman.com/unreal-engine-5-7-performance-highlights/):
  - FastGeometry PSO precaching moved from the game thread to async work.
  - `r.128BitBPPSCompilation.Allow=0` "can save 50k shaders / 15 MiB".
  - A `ShaderTypeStats.csv` is dumped on each cook.
  - An asset-registry tag flags material instances that cause permutations.

#### 4.3 Engine-specific PSO caches and spike tooling
- **Anvil (Assassin's Creed Shadows)** — [Ubisoft REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Anvil.pdf):
  - Code-shader PSOs are compiled on demand or added to a PSO warm-up step.
  - A "PSOSpikeTracker" logs every spike above a delta time and "can even trigger a JIRA by code" so the PSO gets added to the warm-up.
  - Data (material) shaders: logging sessions record every material permutation into a PSO DB. All DBs are merged and deduplicated, and the final DB is used "to pre warm all PSOs on the loading screen".
  - "ShaderPermutationRule" excludes permutations that cannot work together or are never invoked.
- **Space Marine 2** — [Saber REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Saber.pdf):
  - Precaching material passes took 2–3 minutes. Moving from Forward+ to deferred shrank material shader binaries.
  - Engine passes were not precomputed: "~200k pipeline permutations for 2k actual used pipelines".
  - The team chose a manual cache: stored in text form, only unreadable pipelines invalidated, collected from shipping builds.
  - "Few months before release we profiled. Quite a lot of stutters!" Lesson: keep the issue in mind, profile regularly and keep stats.
  - Their shader build: ~2 h console compile, ~10 min for one platform, ~5 h for all platforms.

#### 4.4 Platform-level precompiled shader delivery
- **How it works**: shader data is collected into a State Object Database (SODB). It is compiled in the cloud into a Precompiled Shader Database (PSDB), which the Xbox store distributes with the game, so first launch skips on-device compilation.
- **Launch**: October 16 2025 on ROG Xbox Ally / Ally X, with no developer changes needed for already released games. Microsoft's testing of Avowed showed an 85% reduction in initial load time.
- **Wider access**: Agility SDK 1.618 is meant to open it to other storefronts.

Sources: [Microsoft DirectX blog, Aug 2025](https://devblogs.microsoft.com/directx/?p=12295); [Neowin](https://www.neowin.net/news/microsofts-impressive-advanced-shader-delivery-tech-can-speed-up-game-launch-times-by-85/); [Igor'sLAB](https://www.igorslab.de/en/agility-sdk-1-618-microsoft-brings-the-first-real-console-feel-to-the-pc-with-advanced-shader-delivery/); [PCWorld](https://pcworld.com/article/2884033/microsoft-wants-to-soothe-a-big-pain-for-pc-gamers-shaders.html)

#### 4.5 ARPG case: Path of Exile 2 (Early Access, Dec 2024)
- Players report no shader precompilation at game start: shaders compile mid-session, causing dips.
- The in-game performance monitor shows when shaders are compiling and how many are queued. One workaround is to open the F1 overlay after entering a map and wait for the compile bar to finish.
- These are player forum posts. No official GGG statement on a precompile option was found — [PoE forum thread 3701946](https://pathofexile.com/forum/view-thread/3701946); [PoE forum thread 3592350](https://web.poecdn.com/forum/view-thread/3592350); [outof.games guide](https://outof.games/realms/poe2/guides/549-why-is-path-of-exile-2-stuttering-fixes-that-work/)

#### 4.6 Web API hooks (spec pages, not re-fetched)
- WebGL `KHR_parallel_shader_compile` lets programs compile and link without blocking — [Khronos registry](https://registry.khronos.org/webgl/extensions/KHR_parallel_shader_compile/)
- WebGPU `createRenderPipelineAsync` / `createComputePipelineAsync` — [WebGPU spec](https://www.w3.org/TR/webgpu/)

### Inferences
- **Why browsers are at risk too.** Browsers translate GLSL/WGSL to HLSL/MSL/SPIR-V, and then the driver compiles again, so first-use pipeline creation stutters much like a DX12 PSO. The ARPG risk is high: each skill, VFX, elemental variant or monster affix can introduce a new material permutation in the middle of combat.
- **Mitigations:**
  - Precompile all pipelines for the equipped skills, the zone's monster roster and common VFX during loading screens and zone transitions, using async pipeline creation.
  - Keep permutation counts low with uber-shaders that branch on uniforms (Saber/Anvil lesson). Treat VFX shaders as a small fixed set of parameterised materials, not unique shaders per effect.
  - Add a dev-build spike tracker (Anvil pattern) that records which pipeline caused each hitch, and add those pipelines to the warm-up list.
  - When a pipeline is not ready, fall back to a cheap material or skip the draw for a few frames (UE pattern), instead of stalling the frame.

### Gaps
- No primary source was found for id Software's low-permutation approach in Doom Eternal; the web-search budget ran out.
- Steam's Fossilize/pipeline pre-caching on Steam Deck was not researched.
- Browser-level shader caches (Chrome/Dawn/ANGLE disk caches) and how they behave across sessions were not verified.

## Q5. GPU efficiency: FP16, overdraw reduction (depth prepass, low-res particles), bandwidth (render-target formats, framebuffer compression), VRS, async compute, dynamic resolution, temporal amortisation, shadow-map caching, many-light cost control

### Takeaway
The largest documented 2024–25 GPU wins:
- **Dynamic resolution + upscaling**: Indy drops as low as 44% of pixels.
- **VRS in transparency- and particle-heavy scenes**: Indy saved up to 3.5 ms on Series S, about 1.5 ms of it from the blended pass alone.
- **Async-compute overlap**: about 0.4–0.5 ms in idTech8 GI.
- **Temporal amortisation**: only a fraction of probes/caches/shadows updated per frame.
- **Shadow caching**: split static and dynamic shadow content.
- **Bandwidth**: compaction and packing.
- **Fixed-cost stochastic many-light lighting**: MegaLights renders 941 shadowed lights in 5.5 ms on PS5; HypeHype's tile-based variant is built for $99 phones.

Browsers lack VRS and async compute, so low-res off-screen particles, amortisation and a fixed-cost light-sampling scheme carry more of the load there.

### Cited Findings

#### 5.1 FP16
- AMD: "Vega added Rapid Packed Math (RPM) for double rate 16-bit float". Compile with DXC `-enable-16bit-types`, sample/load into 16-bit types, and expect lower VGPR allocation — [AMD RDNA guide](https://gpuopen.com/learn/rdna-performance-guide/)
- HypeHype: mobile devices "have widely adopted double-rate fp16 pipelines" — [HypeHype, SIGGRAPH 2025](https://advances.realtimerendering.com/s2025/content/s2025_stb_lighting_v1.1_notes.pdf)

#### 5.2 Overdraw: depth prepass, ordering, sorting
- **AMD guidance** — [AMD RDNA guide](https://gpuopen.com/learn/rdna-performance-guide/):
  - In passes after a Z prepass, use depth test EQUAL instead of `discard`.
  - Put positions in their own vertex stream to speed up depth-only passes.
  - Use reversed Z.
  - 24-bit depth costs the same as 32-bit on GCN/RDNA.
- **Indy**:
  - Renders the full depth buffer from the culling output, on top of the existing occlusion buffer.
  - Draws alpha-tested pipelines last.
  - Rewrote the icicle/ice-block shaders, originally made for sparse use, "reducing overdraw" — [MachineGames REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Indy.pdf)
- **RedLynx**: cluster depth sorting gives a gain similar to a depth prepass — [Haar & Aaltonen 2015](https://advances.realtimerendering.com/s2015/aaltonenhaar_siggraph2015_combined_final_footer_220dpi.pdf)

#### 5.3 Low-resolution (off-screen) particles (foundational, 2007)
- (a) Mechanism — [GPU Gems 3, ch. 23](https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-23-high-speed-screen-particles):
  - Particles render into a downsampled target. The depth test uses depth downsampled with max-of-4; point sampling causes halos.
  - The result is composited with linear filtering. Alpha stores the product of inverse alphas.
  - A "mixed resolution" fix runs a Sobel filter, writes a stencil mask and re-renders edge pixels at full resolution.
- (c) Results on a GeForce 8800 GTX at 1600×1200 (73-instruction particle shader):
  - Full resolution 25 fps; mixed resolution 4×4 51 fps; low resolution 4×4 61 fps.
  - With only ~3.5M particle pixels, full resolution was faster (64.4 vs 63.3 fps): the technique pays off only when particle fill is large — [GPU Gems 3](https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-23-high-speed-screen-particles)
- **2024 evidence that transparency/particles dominate**: Indy's VRS was "Very useful in scenes with lots of smoke/particles" and gave up to 3.5 ms on Series S, ~1.5 ms of it from the blended pass alone — [MachineGames REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Indy.pdf)

#### 5.4 Bandwidth: formats, framebuffer compression, tile-based GPUs
- **AMD guidance** — [AMD RDNA guide](https://gpuopen.com/learn/rdna-performance-guide/):
  - "Avoid using RGB32 formats". Minimise the bytes a pixel shader writes. Use ≤4x MSAA.
  - "Partial writes will disable compression".
  - Mark resources read-only when possible to help compression. Mipmapped render-target arrays don't get compression.
  - Avoid TYPELESS formats.
- **HypeHype (SIGGRAPH 2025)** — [HypeHype notes](https://advances.realtimerendering.com/s2025/content/s2025_stb_lighting_v1.1_notes.pdf):
  - $99 phones have ~15 GB/s of peak bandwidth and ~250 GFLOP/s, versus ~500 GB/s and 12–17 TFLOP/s on current consoles/PCs.
  - Mobiles are passively cooled, so "Bandwidth usage generates a lot of heat".
  - Mobile GPUs rely on tile-based rendering and framebuffer compression, so the lighting algorithm was implemented in pixel shaders to benefit from both.
- **Diablo Immortal**: on tile-based GPUs, writing ray-tracing hit data to a render target "can trigger on-chip lossless compression", reducing traffic compared with compute-shader output buffers — [Android Developers](https://developer.android.com/stories/games/diablo-raytracing)

#### 5.5 Variable rate shading
- **Gears Tactics**, Tier 1 (per draw): "up to 18.9%" — [Microsoft DirectX blog](https://devblogs.microsoft.com/directx/gears-tactics-vrs/)
- **Gears 5 / Gears Tactics**, Tier 2 (screen-space rate image): "up to 14%" GPU performance "with no perceptible impact to visual quality" — [Microsoft DirectX blog](https://devblogs.microsoft.com/directx/gears-vrs-tier2/)
- **Indy**: generates the shading-rate image after tonemapping, with a depth-aware implementation. It is "Heavily reliant on VRS" and saved up to 3.5 ms on Series S — [MachineGames REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Indy.pdf)

#### 5.6 Async compute
- **idTech8 GI** (DOOM: The Dark Ages, 2025): "Async saved around 0.5ms on Series X and PS5. About 0.4ms on Series S". The team does not think it "would have been able to achieve our performance target without" async — [Tiago Sousa, SIGGRAPH 2025](https://advances.realtimerendering.com/s2025/content/SOUSA_SIGGRAPH_2025_Final.pdf)
- **Indy**: dynamic BLAS builds and TLAS updates run async alongside shadow drawing, and GI probe tracing runs async once the shadow atlas is ready — [MachineGames REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Indy.pdf)
- **Saber**: procedural placement takes <0.5 ms in async compute — [Saber REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Saber.pdf)
- **AMD guidance** — [AMD RDNA guide](https://gpuopen.com/learn/rdna-performance-guide/):
  - Async "performs poorly when executed in parallel with export bound shaders".
  - Good overlap candidates: Z prepass, shadow rendering, post-processing.
  - Small dispatches work better pipelined than async.
  - 64-thread workgroups do better when run async.

#### 5.7 Dynamic resolution + upscaling
- **Indy** — [MachineGames REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Indy.pdf):
  - Targets full resolution and drops only when 60 Hz is missed; the floor is 44% of pixels (1080p→720p, 1800p→1200p, 2160p→1440p).
  - Anisotropic filtering is tied to resolution scale: 4x at 100%, rising to 8x while 60 Hz holds, and 2x below 100%.
- **Nanite demo**: dynamic resolution averaging ~1400p, with temporal upsampling to 4K — [Nanite 2021](https://advances.realtimerendering.com/s2021/Karis_Nanite_SIGGRAPH_Advances_2021_final.pdf)
- **Lumen**: budgets assume 1080p internal resolution with TSR to 4K — [Epic Lumen performance guide](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-performance-guide-for-unreal-engine)
- **Assassin's Creed Shadows** on Xbox Series X: Quality mode 1620p at 33.1 ms; Performance mode 1080p at 16.2 ms. The two modes ship different GI systems — [Ubisoft REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Anvil.pdf)

#### 5.8 Temporal amortisation (update every N frames, partial updates, checkerboard)
- **Lumen** — [Epic Lumen guide](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-performance-guide-for-unreal-engine):
  - `NumProbesToTraceBudget` caps how many radiance-cache probes update per frame ("Higher values make lighting more responsive but cost more").
  - `r.LumenScene.DirectLighting.UpdateFactor` and `Radiosity.UpdateFactor` set the fraction of the surface cache updated per frame.
  - Reflection downsampling has a checkerboard mode that traces "one ray every two pixels".
  - Half-resolution integration is available.
- **UE 5.7**: stochastic interpolation with half-res integration on High saves ~0.5 ms on console at 1080p — [Tom Looman UE 5.7](https://tomlooman.com/unreal-engine-5-7-performance-highlights/)
- **idTech8 GI**: "~20k cache entries updated per frame. Re-use for N frames"; one GI cascade and one volume are updated per frame — [Sousa SIGGRAPH 2025](https://advances.realtimerendering.com/s2025/content/SOUSA_SIGGRAPH_2025_Final.pdf)
- **Indy**: "We also try to amortize work whenever possible. And while this adds latency, it also spreads out load". At 60 Hz, one frame of delay costs less than at 30 Hz — [MachineGames REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Indy.pdf)
- **HypeHype**: shadow-map updates are load-balanced with a priority queue "to avoid performance spikes when many shadow maps require updates" — [HypeHype notes](https://advances.realtimerendering.com/s2025/content/s2025_stb_lighting_v1.1_notes.pdf)
- **Diablo Immortal**: static BLAS construction "can be spread across frames"; highly dynamic BLAS/TLAS are fully rebuilt every N frames — [Android Developers](https://developer.android.com/stories/games/diablo-raytracing)
- **Guerrilla's Nubis clouds**: a 2 ms GPU budget on PS4 (Horizon Zero Dawn) — [Guerrilla](https://www.guerrilla-games.com/read/the-real-time-volumetric-cloudscapes-of-horizon-zero-dawn). Horizon Forbidden West added temporal upscaling for faster-moving clouds — [Nubis Evolved](https://www.guerrilla-games.com/read/nubis-evolved)

#### 5.9 Shadow-map caching
- **UE Virtual Shadow Maps** — [Epic VSM docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/virtual-shadow-maps-in-unreal-engine):
  - Cached pages have "very low cost and will have almost no impact on performance".
  - Pages are invalidated by light movement, by moving/adding/removing casters, and by materials using WPO or PDO. Skeletal or WPO geometry "always invalidates cached pages every frame".
  - Separate static and dynamic caches mean moving geometry doesn't force static geometry to re-render.
  - "Non-Nanite geometry is much more expensive to render into VSMs".
  - "Performance in scenes with many small local lights is still a work in progress".
- **Indy** keeps "a copy of the static part of the shadow map in a separate slot and render[s] dynamics on top of a copy of that. Trading rendering time for memory" — [MachineGames REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Indy.pdf)
- **HypeHype** — [HypeHype notes](https://advances.realtimerendering.com/s2025/content/s2025_stb_lighting_v1.1_notes.pdf):
  - The atlas holds power-of-two spot maps and octahedral omni maps.
  - Static maps (static geometry only) are updated rarely; dynamic maps include static + dynamic geometry.
  - Maps are resized by the light's distance from the camera.
- **Limits of caching** (MegaLights deck): hundreds of moving lights "completely break any caching schemes". Even in the MegaLights demo, VSM "fills the max allocation size of 4gb for the shadow map virtual page cache and still isn't able to fit all the required lights" — [MegaLights, SIGGRAPH 2025](https://www.advances.realtimerendering.com/s2025/content/MegaLights_Stochastic_Direct_Lighting_2025.pdf)

#### 5.10 Many dynamic lights: keeping cost bounded
- **Diablo IV**: Blizzard chose a deferred renderer so complex lighting from many light sources shares material calculations, and built a custom shadow system on top, since "The complexity here comes from the need to compute shadows for all of these separate light sources" — [Blizzard Diablo IV article](https://news.blizzard.com/en-us/article/23964183/iv)
- **Why tiled deferred struggles** (HypeHype's analysis): it "Scales only linearly with light count per tile". Tiles at object silhouettes get large light counts even in simple scenes, light culling is costly, and per-tile light caps cause "flickering tile artifacts" — [HypeHype notes](https://advances.realtimerendering.com/s2025/content/s2025_stb_lighting_v1.1_notes.pdf)
- **HypeHype Stochastic Tile-Based Lighting** (SIGGRAPH 2025, for "$99 budget phones to high-end PCs") — [HypeHype notes](https://advances.realtimerendering.com/s2025/content/s2025_stb_lighting_v1.1_notes.pdf):
  - The CPU culls scene lights against the camera FOV.
  - 128 px big tiles pick 16 light samples by stratified reservoir sampling, using the tile's MinMax depth.
  - Small tiles interleaved over a 32×32 px footprint resample 1–4 lights. "Fixed resampling cost independent of N", and the lighting pass is "Fixed cost independent of the scene lighting".
  - Shadow terms are stored in 8×8 px blocks per tile, so shadows can come from shadow maps or RT at lower resolution without changing lighting-shader cost.
- **UE MegaLights** (experimental in 5.5, beta in 5.7):
  - A fixed number of rays per pixel goes toward stochastically selected lights, with one denoising pass for all lights; "constant performance overhead" versus deferred lighting, whose cost grows with light count — [Epic MegaLights docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/megalights-in-unreal-engine)
  - PS5 at 1080p, 1 spp, async off: 941 area lights on screen, ~20–80 lights per pixel, all casting shadows: 5.51 ms total, replacing all direct-lighting shadowing and shading — [MegaLights SIGGRAPH 2025](https://www.advances.realtimerendering.com/s2025/content/MegaLights_Stochastic_Direct_Lighting_2025.pdf)
  - It needs hardware ray tracing. Arm reports >190 shadow-casting dynamic point lights on a Mali-G1 — [Arm blog](https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/lighting-at-scale-bringing-hundreds-of-dynamic-lights-to-mobile-with-unreal-megalights)
  - UE 5.7 shading-sample vectorisation saves 0.1–0.2 ms in complex content on current consoles; `r.MegaLights.DownsampleMode` offers half-res / checkerboard — [Tom Looman UE 5.7](https://tomlooman.com/unreal-engine-5-7-performance-highlights/)
  - Content still matters: attenuation range, cone angles, barn doors and light functions remain relevant optimisations — [MegaLights SIGGRAPH 2025](https://www.advances.realtimerendering.com/s2025/content/MegaLights_Stochastic_Direct_Lighting_2025.pdf)

### Inferences
- **Missing web features.** To my knowledge WebGPU has no variable-rate-shading API and exposes a single queue, so no async compute; WebGL2 has neither. Verify against the current spec.
  - Replacement for VRS: render particles and transparents into a half- or quarter-res off-screen target with a max-depth test, plus a mixed-resolution edge fix. The ARPG's heavy spell VFX make particle fill the likely biggest GPU cost, and the GPU Gems data shows a 2x+ win when fill dominates.
  - Replacement for async compute: amortisation.
- **Many-light technique for the web.** HypeHype's stochastic tile-based lighting is the most transferable technique found. It is pixel-shader based, aimed at TBR, fixed-cost and designed for $99 phones. A WebGPU version can do tile sampling in compute; WebGL2 could bin lights on the CPU into a light-grid texture. MegaLights is not feasible because it needs hardware RT.
- **Shadowed spell lights.** Set a budget of N shadow-casting lights. Use an atlas with octahedral omni maps, size each map by screen size/distance, split static and dynamic content, and spread updates over frames with a priority queue (the HypeHype/Indy patterns). Caching fails when lights move, as MegaLights showed, so moving projectile lights should cast no shadows or very low-res ones.
- **Dynamic resolution.** Cheap to implement in browsers via a scaled canvas or render target plus upscaling. Indy's aniso coupling is a free quality trick.
- **Precision and formats.** FP16 (WebGPU `shader-f16`, where supported) and compact render-target formats help mostly on mobile/iGPU tile-based hardware, which is exactly the browser low end.

### Gaps
- No modern (2023–26) published numbers for half-resolution particle rendering in a shipped game were found; the data here is from 2007 plus Indy's VRS figure.
- No 2023–26 source on checkerboard rendering, beyond Lumen's checkerboard reflection mode.
- WebGPU availability of `shader-f16`, `rg11b10ufloat-renderable` and subgroups as of Oct 2026 was not re-verified (search budget exhausted).

## Q6. Crowds and animation cost: GPU skinning, animation LOD / update-rate optimisation, animation instancing, vertex animation textures for hordes

### Takeaway
Crowd cost is kept down by:
1. Compute skinning done once per frame and reused by every pass (Indy).
2. Budgeted animation update rates (UE Animation Budget Allocator).
3. Separating per-instance render data from heavyweight animation objects, so swarms scale to 10K+ instances (Saber, Space Marine 2).
4. LOD tiers that end in billboards, plus density reduction.
5. Animation baked into textures (vertex animation textures / animation instancing) for hordes.

At the extreme, A Plague Tale: Requiem shows 300,000 rats and Space Marine 2 "thousands" of Tyranids. For the web, VAT plus instancing is the main WebGL2 path; compute skinning becomes possible with WebGPU.

### Cited Findings

#### 6.1 GPU/compute skinning, skinned once and reused
- **Indy**: "A prepass skinning compute shader is ran, very few things take the vertex shader skinning path", and skinning data is reused between passes ("Skin once and reuse") — [MachineGames REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Indy.pdf)
- **Diablo Immortal**: a compute shader skins vertices each frame, followed by an incremental BLAS update — [Android Developers](https://developer.android.com/stories/games/diablo-raytracing)

#### 6.2 Animation update-rate budgeting
- **UE Animation Budget Allocator**:
  - Throttles skeletal-mesh tick rates against a per-platform budget in milliseconds of game-thread work.
  - When over budget it can update animation at a lower rate, interpolate between updates, or stop ticking components (favouring a leader pose component).
  - Meshes must use `SkeletalMeshComponentBudgeted` — [Epic docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/animation-budget-allocator-in-unreal-engine)
- **UE 5.7**: Mass processor time-slicing spreads heavy work across frames; observer batching cut observer executions ~20x in CitySample; full-body IK is ~20% faster — [Tom Looman UE 5.7](https://tomlooman.com/unreal-engine-5-7-performance-highlights/)

#### 6.3 Decoupling instance data for swarms (Space Marine 2, 2024)
- **Targets**: "Tyranids swarms", "Flocking rendering", 10K+ instances, >60M triangles before culling, min spec GeForce GTX 1060 / 6 GB VRAM.
- **The problem**: the classic anim instance is a 1500+ byte class mixing game, animation and render data.
- **The fix**:
  - Render data moved into a separate instance data manager (instance id + archetype), so "Instances can be created without anim instance" and "Instances can be rendered using single 'proxy' anim instance".
  - An ECS render path requires >40 systems.
  - Copying visible dynamic instance data takes ~0.08 ms on PS5/Xbox Series and ~1 ms on PC (latency hidden).

Source: [Saber REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Saber.pdf)

#### 6.4 Vertex animation textures and animation instancing
- **VAT**: per-vertex motion is baked into textures and played back in the material via World Position Offset, avoiding the CPU cost of a skeletal mesh per character (SideFX talk on Houdini → Unreal crowds) — [SideFX](https://www.sidefx.com/learn/talks/vertex-animation-textures-for-crowds/). One SideFX forum answer calls VAT "a good solution for smaller crowds" and suggests animated impostors for larger ones — [SideFX forum](https://www.sidefx.com/forum/topic/62062/)
- **Unity Animation Instancing** (Unity Technologies): "designed to instance Characters (SkinnedMeshRender)". It supports root motion, attachments, LOD, culling and mobile platforms, and needs Unity 5.4+. No performance numbers are published — [GitHub](https://github.com/Unity-Technologies/Animation-Instancing)
- **Web**: a Babylon.js VAT test ran 500 instances at 60 fps on the poster's machine — [Babylon.js forum](https://forum.babylonjs.com/t/vertex-animation-textures/6325)

#### 6.5 Horde references
- **A Plague Tale: Requiem** (2022, Asobo):
  - On-screen rats went from 5,000 in Innocence to 300,000, according to lead engine programmer Nicolas Bécavin — [GameSpot](https://gamespot.com/articles/a-plague-tale-requiem-has-way-too-many-damn-rats-thanks-to-extra-console-ratpower/1100-6507886/). Another outlet cites a 10,000 baseline — [3DJuegos](https://www.3djuegos.com/juegos/a-plague-tale-innocence/noticias/plaga-300-000-ratas-a-15-kilometros-hora-este-videojuego-puede-parecer-ciencia-ficcion-realidad-su-origen-esta-australia/amp)
  - Innocence used a four-layer detail system: less detail for distant rats, full animation up close — [KeenGamer](https://www.keengamer.com/articles/news/asobo-studio-reveals-more-info-on-a-plague-tale-requiem/)
- **Space Marine 2**: promises "thousands of tyranids" — [PC Gamer](https://www.pcgamer.com/uk/space-marine-2-promises-to-pit-us-against-thousands-of-tyranids/). Its engine descends from World War Z's "High Zombie Throughput in Modern Graphics" (GDC 2019) — [Saber REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Saber.pdf)

#### 6.6 Skinning inside virtualised geometry
- UE 5.7 Nanite Foliage animates trees with Nanite Skinning driven by a Dynamic Wind skeleton instead of WPO, which has poor Nanite support.
- `NanitePixelProgrammableDistance` disables pixel-programmable rasterisation for skinned Nanite meshes beyond a set distance — [Tom Looman UE 5.7](https://tomlooman.com/unreal-engine-5-7-performance-highlights/)

### Inferences
- **WebGL2 path for hundreds of monsters.** Use VAT plus instancing for rank-and-file monsters: bake each archetype's clips into a texture, then store clip index, time and tint per instance. Reserve true skeletal skinning for nearby, elite and boss monsters. Hit reactions and death animations can be extra baked clips. Blending between clips costs two VAT samples.
- **WebGPU path.** Add a compute-skinning prepass that writes skinned vertices once per frame and reuses them for the depth, shadow and main passes (the Indy pattern). This matters because each shadowed spell light re-renders the monsters.
- **Update-rate budgeting in JS.** A per-frame ms budget for animation updates, à la UE's allocator, maps cleanly onto a JS AnimationMixer scheduler. Update off-screen, tiny or idle monsters at reduced rates with interpolation. In isometric view almost all on-screen monsters are at a similar distance, so the importance metric should be screen presence, combat relevance and off-screen state rather than distance.
- **Data layout (Saber's lesson).** Keep per-monster render data in flat typed arrays (structure-of-arrays) separate from gameplay/animation objects. This is especially relevant in JS for GC pressure and cache behaviour.

### Gaps
- No primary technical breakdown was found for A Plague Tale: Requiem's rat rendering or Space Marine 2's Tyranid animation LOD/VAT usage.
- No Diablo IV or Path of Exile 2 talk on monster rendering or animation cost was found.
- City Sample (The Matrix Awakens) crowd details (MassEntity, AnimToTexture usage) were not retrieved.

## Q7. Frame budgets, profiling and scalability: ms budgets for 30/60 fps titles, profiling tools, quality presets, Steam Deck/Switch 2 scaling, mobile lessons

### Takeaway
60 Hz (16.7 ms) is an explicit, non-negotiable target in several 2024–25 AAA console titles: Indiana Jones runs at 60 Hz on every platform including Series S, and idTech8 requires "Stable >= 60hz on all platforms". Budgets are enforced with fixed memory pools, soft per-pass targets, nightly automated captures, a dynamic-resolution floor and FPS/DRS heatmaps.

Published component costs are small next to the frame:

| Component | Cost |
|---|---|
| GI + reflections + volumetric fog at 60 fps (Lumen High) | 4 ms |
| Nanite geometry + material pass | ~2.5 ms + ~2 ms |
| MegaLights | 5.5 ms |
| idTech8 GI (heavy hotspot) | ~1.4–2.1 ms |
| RedLynx GPU-driven geometry, 250k objects (Xbox One) | 2.3 ms |

Scalability tiers are tied to named hardware: Lumen Medium means 60 fps on Switch 2; Steam Deck Verified means roughly ≥30 fps at 800p with default settings. Diablo Immortal's mobile lessons: a visibility buffer to decouple geometry from shading, expensive features only where they pay, and radius-limited acceleration structures.

### Cited Findings

#### 7.1 Published budgets and component costs
- **Lumen** — [Epic Lumen performance guide](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-performance-guide-for-unreal-engine):
  - Budgets of 8 ms (30 fps) and 4 ms (60 fps) on consoles at 1080p internal, covering GI, reflections on opaque and translucent surfaces, and volumetric fog.
  - Each lower scalability level costs about half of the one above.
  - Hardware RT generally needs <100,000 instances in the ray-tracing scene after culling.
  - Replacing Lumen reflections with SSR saves ~1 ms on Series S.
- **Nanite** (PS5, ~1400p): ~2.5 ms for culling and rasterisation, ~2 ms for the material pass, "Well within budget for a 60hz game" — [Nanite 2021](https://advances.realtimerendering.com/s2021/Karis_Nanite_SIGGRAPH_Advances_2021_final.pdf)
- **MegaLights** (PS5): 5.51 ms for 941 shadowed area lights — [MegaLights SIGGRAPH 2025](https://www.advances.realtimerendering.com/s2025/content/MegaLights_Stochastic_Direct_Lighting_2025.pdf)
- **idTech8 GI** (DOOM: The Dark Ages hotspot "large vista, lots of enemies, vegetation, particles"): shipped totals of roughly ~1.4–2.1 ms on consoles, serial vs async. The per-platform column mapping in the extracted slide text is ambiguous; the low spec is Xbox Series S — [Sousa SIGGRAPH 2025](https://advances.realtimerendering.com/s2025/content/SOUSA_SIGGRAPH_2025_Final.pdf)
- **Assassin's Creed Shadows** frames on Xbox Series X: 33.1 ms (Quality, 1620p) and 16.2 ms (Performance, 1080p) — [Ubisoft REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Anvil.pdf)
- **Dragon's Dogma 2 / Monster Hunter Wilds** PS5 dev-build GPU time with meshlets on: 19.90 ms / 27.605 ms, i.e. 30 fps-class titles — [Capcom REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Capcom.pdf)
- **World War Z**: 30 FPS with a "66+ms critical path" across 2 frames of latency. **Space Marine 2**: 30/60 FPS with 66+/33+ ms critical paths — [Saber REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Saber.pdf)
- **RedLynx**: GPU-driven geometry for 250k objects took 2.3 ms on Xbox One — [Haar & Aaltonen 2015](https://advances.realtimerendering.com/s2015/aaltonenhaar_siggraph2015_combined_final_footer_220dpi.pdf)

#### 7.2 Budget practice: Indiana Jones and the Great Circle
- **Context**: shipped Dec 2024 (PC, Xbox), Apr 2025 (PS5); 60 Hz on all platforms at 1080p (Series S), 1800p (Series X, PS5) and 4K (PS5 Pro); MOTOR engine, a fork of idTech 7.
- **Principles**: "We will hit 60Hz!"; "Sacrifice latency for throughput"; "Resolution scaling as a last effort"; "Fixed pools for memory"; "Floating perf target for CPU/GPU time"; perf stats and reviews; "Avoid baking".
- **Nightly automated tests**: several locations per map plus all cutscenes, tracking pass timings, overall GPU/CPU time, load times, model counts and per-shader VGPR usage.
- **Reality check**: an August 2024 Series S run with resolution scaling off showed most main levels below 60 fps, about four months before launch.

Source: [MachineGames REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Indy.pdf)

#### 7.3 Profiling tools
- **Unreal**: the VSM docs point to the GPU Profiler, Unreal Insights and `CsvCategory VSM` for measuring cost — [Epic VSM docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/virtual-shadow-maps-in-unreal-engine)
- **Anvil**: an internal CPU/GPU profiler, GPU resource lifetime and memory tracking, and a "Profiling analytics pipeline" with FPS and DRS heatmaps across PC configurations — [Ubisoft REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Anvil.pdf)
- **Native GPU tools** (homepages): [RenderDoc](https://renderdoc.org/), [PIX](https://devblogs.microsoft.com/pix/), [NVIDIA Nsight Graphics](https://developer.nvidia.com/nsight-graphics), [Radeon GPU Profiler](https://gpuopen.com/rgp/), [Tracy](https://github.com/wolfpld/tracy)
- **Browser**:
  - Chrome WebGPU on its D3D12 backend can be captured in PIX. Timing data needs PIX run as administrator, plus launch flags such as `--disable-gpu-sandbox` and `--disable-gpu-watchdog` — [Chromium PIX doc](https://chromium.googlesource.com/chromium/src.git/+show/HEAD/docs/gpu/debugging_chrome_gpu_with_pix.md); [Toji: Profiling WebGPU with PIX](https://toji.dev/webgpu-profiling/pix)
  - RenderDoc capture of Chrome WebGPU on D3D12 needs Chrome 144+ (Canary at the time of writing) per Toji's guide — [Toji: Profiling WebGPU with RenderDoc](https://toji.dev/webgpu-profiling/renderdoc); [Chromium RenderDoc doc](https://chromium.googlesource.com/chromium/src/+/main/docs/gpu/debugging_chrome_gpu_with_renderdoc.md)

#### 7.4 Scalability tiers, handheld and low-end targets
- **Lumen tiers**: Epic = 30 fps on consoles; High = 60 fps on current-gen consoles (excluding Switch 2); Medium = 60 fps on Switch 2 and medium PCs, using Irradiance Field Gather; Low disables Lumen — [Epic Lumen guide](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-performance-guide-for-unreal-engine)
- **Indy**: per-platform resolution floors (above) — [MachineGames REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Indy.pdf)
- **Steam Deck Verified**: the game must give a playable frame rate with the automatically selected defaults; Igor'sLAB summarises this as ≥30 fps at 800p. There are no published frametime or percentile criteria. Valve's newer "Steam Machine Verified" sets 30 fps at 1080p as the minimum — [Igor'sLAB](https://www.igorslab.de/en/steam-machine-verified-valve-sets-30-fps-at-1080p-as-the-minimum-standard/). Critics note verified games dropping to 17–19 fps — [SteamDeckHQ](https://steamdeckhq.com/news/the-steam-deck-verified-system-needs-to-change/)
- **Space Marine 2** min spec: GeForce GTX 1060, 6 GB VRAM, 8 GB RAM, DirectX 12 — [Saber REAC 2025](https://enginearchitecture.org/downloads/REAC_2025_Saber.pdf)

#### 7.5 Mobile lessons: Diablo Immortal and HypeHype
- **Diablo Immortal** (Blizzard/NetEase) — [Android Developers](https://developer.android.com/stories/games/diablo-raytracing):
  - Uses Vulkan hardware ray queries rather than RT pipelines, invoked from existing compute/fragment shaders for compatibility and lower resource use.
  - Traces reflections only, at 1 spp, with surfaces classified by roughness (none / mirror / glossy GGX) and denoised with AMD FidelityFX Reflection Denoiser.
  - Non-reflective areas are rejected up front with a stencil test.
  - Reflection model IDs are read back asynchronously, so models and materials that don't contribute to reflections are skipped.
  - The TLAS contains only models within the character's active radius.
  - A visibility buffer decouples geometry from shading. Varied vertex formats hurt branching efficiency, a lesson that pushed this choice.
- **Pixelworks** claims 120 fps on IRX-certified devices (vendor claim) — [Pixelworks](https://pixelworks.gcs-web.com/node/16716)
- **HypeHype**: mobile bandwidth and heat constraints (see 5.4) — [HypeHype notes](https://advances.realtimerendering.com/s2025/content/s2025_stb_lighting_v1.1_notes.pdf)
- **Related Blizzard ARPG material**: REAC 2024 included a talk on integrating ray tracing into the Diablo IV engine (Kevin Todisco) — [REAC 2024](https://enginearchitecture.org/2024.htm). A GDC session on Diablo IV water covers deferred-rendered water and "avoiding distracting highlights based upon the fixed camera angle" — [GDC schedule](https://schedule.gdconf.com/session/technical-artist-summit-h2o-in-h3ll-the-various-forms-of-water-in-diablo-iv/901730)

### Inferences
- **Budget for a browser ARPG at 60 fps.** The 16.7 ms frame must also absorb JS game logic, GC and browser compositing.
  - An illustrative GPU split (my estimate, not a published breakdown): ~2–3 ms shadows (sun + a few spell lights), ~3–4 ms opaque, ~2–4 ms particles/transparents, ~1–2 ms post + UI, plus headroom for VFX spikes.
  - The published AAA figures show that even heavy subsystems are kept to 2–5 ms each at 60 Hz.
- **Process.** Copy Indy's process: fixed camera captures per zone in CI (headless Chrome + WebGPU timestamp queries), tracked nightly; a DRS floor; aniso/quality coupled to the resolution scale; quality tiers keyed to device classes. Integrated-GPU laptops and handheld PCs are roughly the Steam Deck/Switch 2 class.
- **Radius-limited data.** Diablo Immortal shows that an ARPG camera allows expensive per-frame structures to be limited to a radius around the hero. The same idea applies to shadow casters, light lists, animation updates and particle simulation.
- **Mobile/iGPU browsers.** HypeHype's figures (15 GB/s, passive cooling) argue for bandwidth-first design: compact render-target formats, few full-screen passes, and pixel-shader formulations that suit tile-based GPUs.

### Gaps
- No fully itemised per-pass ms breakdown for a 2024–26 60 fps console title was found, only component costs (Lumen, Nanite, MegaLights, idTech8 GI, Indy savings).
- No Switch 2-specific scaling data was found beyond Epic's Lumen tier target.
- The Diablo IV REAC 2024 talk content was not retrieved; no Path of Exile 2 rendering-performance talk was found.
- Method note: the shared web-search budget ran out late in this research. Several web-API availability facts (WebGPU multi-draw-indirect, 64-bit atomics, subgroups, `shader-f16`, occlusion queries, single-queue model) and spec/registry pages (WEBGL_multi_draw, KHR_parallel_shader_compile, KTX2/Basis, EXT_meshopt_compression) are cited from well-known pages without re-verification in this session. The three.js researcher's notes should be treated as authoritative for current browser feature status.
