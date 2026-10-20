# Shared asset schema

Every asset has a globally unique, stable `id`. IDs anchor notes and saved items; changing one requires migrating workspace data.

| Field | Contract |
|---|---|
| id | Required stable string, e.g. `env-rogue-camp-ground` |
| name | Required display name |
| type | `creature`, `environment`, `npc`, `item`, `model`, `animation`, or `effect` |
| act | Display scope, e.g. `Act I` |
| index | Optional catalog ordering number |
| group | Optional group ID for creatures, items or NPCs; other types can omit it |
| role | Optional short subtype: melee, tileset, armor, vendor, etc. |
| description | Appearance or purpose |
| art | Production observations |
| location | Place or scope |
| base | Suggested base comparison, not a verified rig relationship |
| kind | Creature `regular`, `unique` or `boss`; item `quest` or `base` |
| status | Default `reference`, `todo`, `progress` or `approved` |
| tags | Searchable string array |
| image | Optional `{src, file, url, source, label}`; `src` should be a data URI for standalone delivery |
| media.model | Reserved model metadata or null; not automatically loaded by the current UI |
| media.clips | Verified clip metadata only; use an empty array until audited |
| motions | Suggested checklist strings, separate from verified clips |

## Concept records

Concept records (`type: 'concept'`, `game: 'd2rr'`) add `number` (position in the concept list), `palette`, `scale`, `method` (how the image was made), `layout` (sheet arrangement) and `images`: an ordered array of `{file, thumb, origin, label, width, height}`, with `src`/`thumbSrc` data URIs added at build time. `image` is `images[0]`. Concept indexes start at 4001 so catalog order keeps them after the reference records. Edit them through assets/CONCEPT_SOURCES.json, not concepts.json.

## Adding an environment record

```js
export const environments = [{
  id: 'env-rogue-camp-ground',
  name: 'Rogue Encampment — Ground',
  type: 'environment', act: 'Act I', index: 66,
  role: 'Terrain tileset', status: 'todo',
  description: 'Describe the reference after reviewing the source.',
  art: 'Document tile transitions, scale and ground material variation.',
  location: 'Rogue Encampment', tags: ['terrain', 'town'],
  image: null,
  media: {model: null, clips: []}, motions: []
}];
```

This is an illustrative schema example, not an included asset. Add real records to the corresponding array in collections.js, or extend items.js for item records. The registry combines arrays and the UI computes counts dynamically. Reference images and source links must be provided and checked before calling a record complete.

## Model and animation roadmap

The current viewer supports opening self-contained local GLBs for session inspection. For persistent models, extend media.model with `{format: 'glb', source, file, license}` and implement explicit loading in the viewer adapter. Clip metadata can contain `{name, duration, sourceModelId, verified: true}`. Link models to creature/NPC/item records by stable IDs when that relationship is established.

Do not populate verified clip counts from the suggested `motions` array. Frame counts, directional sprites and animation clips are different units.
