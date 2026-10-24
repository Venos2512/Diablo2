// Editorial production prompts, not claims about shipped models or clips.
export function enemyArtProfile(family,role){
 const f=family.toLowerCase(),r=role.toLowerCase();
 let art='Create a silhouette sheet, material breakdown and scale comparison. Separate body, equipment and attack effects. Verify each visual decision against the linked references.';
 let motions=['Idle','Locomotion','Attack anticipation','Attack','Hit reaction','Death'];
 if(/arachnid|insectoid|rift scourge/.test(f)){
  art='Study leg count, contact rhythm, abdomen silhouette and mouthparts. Plan body materials separately from venom, web or swarm effects only when the reference shows them. Check small-scale readability from the game camera.';
  motions=['Idle','Multi-leg locomotion','Attack anticipation','Attack','Hit reaction','Death'];
 }else if(/beast$|wildlife|riftspawn|krug beast/.test(f)){
  art='Compare the spine, limb proportions, head and tail silhouette. Record skin, fur or shell treatment from the reference; keep color variants separate from anatomy changes.';
 }else if(/flying creature/.test(f)){
  art='Plan wing silhouette and body readability against ground clutter. Study hover height, wing rhythm and projectile origin in the reference; keep flight effects separate from geometry.';
  motions=['Hover','Flight','Attack','Hit reaction','Fall / death'];
 }else if(/construct|aetherial/.test(f)){
  art='Separate rigid parts, surface damage and emissive accents. Plan activation and impact effects as separate assets. Confirm whether the reference moves, hovers or remains stationary.';
 }else if(/undead|aether corruption/.test(f)){
  art='Document posture, exposed anatomy, clothing damage and corruption accents. Establish a material palette and silhouette hierarchy between common variants and named encounters. Effects require separate references.';
 }else if(/beastman|beastkin|krug|cultist/.test(f)){
  art='Build a body-proportion sheet and equipment breakdown. Compare posture, head shape, weapons and costume layers across the family. Keep named-encounter accents distinct from ordinary variants.';
 }
 if(/caster/.test(r))motions=['Idle','Locomotion','Cast anticipation','Cast / release','Hit reaction','Death'];
 if(/hostile object/.test(r))motions=['Dormant','Activation','Attack effect','Damage state','Destruction'];
 return {art:'Art planning suggestion: '+art,motions};
}
