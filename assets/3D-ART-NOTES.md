# Subculture 3D presentation — sculpted revision

`index.html` loads the local Three.js build and `subculture-3d.js`. All runtime code is in this repository. Serve it over HTTP.

## Character models

`models/toon-models.js` builds continuous shaped head and torso surfaces, layered volume hair, transparent high-resolution eye/eyebrow/lip textures, tailored lapels, pleated garments, cuffs, buckles, jewelry, individually modeled fingers and detailed weapons. Character identity is stable across the formation card, HUD portrait and battlefield.

The roster remains 96 characters: 19 male and 77 female (the nearest whole-person approximation to 20% / 80%). Existing stats, skills and character IDs are preserved. Six outfit families, seven female hair arrangements, three male hair arrangements and multiple palette/accessory combinations vary the shared base model.

Shoulders, elbows, wrists, hips and knees form an articulated hierarchy. Attack poses distinguish rifle, blade, staff/orbit and support actions, with preparation, release and recovery. Moving costume parts follow idle motion. Thin inverted-hull outlines and stepped diffuse lighting retain the anime appearance.

## Scene and effects

`models/archive-stage.js` supplies three modeled bosses: a fractured porcelain guardian, nested radial jaws, and a gyroscope with a central eye and orbiting masks. The modeled archive promenade includes recessed platform inlays, repeated pillars, cornices, arches and suspended geometry.

`models/combat-fx.js` supplies deck-specific projectiles, electric paths, crystal shards, rings, runes, motes and protective volumes. Effects are emitted from resolved combat events. Merely selecting a skill does not deal damage or emit hit effects. The render path uses a multisampled scene target and restrained bloom; reduced-motion mode removes camera movement and dynamic impact lights and reduces particles.

## Performance and lifecycle

Static meshes are combined by material within each articulated joint. At most 220 instanced particles and 32 transient effect meshes can exist. Temporary portrait targets, model geometry, private face textures and transient effects are released. Repeated battles, returning to selection, and hidden-page rendering are covered by cleanup paths. WebGL context loss preserves the game state and shows the existing fallback presentation until the context is restored.

The code includes procedural stylized assets. The roster still shares a base anatomy and costume system; it is not a collection of 96 individually sculpted and professionally rigged commercial character assets. The animation uses articulated mesh groups rather than a motion-captured skeletal asset pipeline. Existing missing audio files are outside this art revision.

## Verification

`tests/visual-runtime-smoke.cjs` checks roster identity/counts, two-click skill confirmation, actual damage resolution, particle caps, all effect families, all three bosses, repeated-battle geometry/texture counts, mobile HUD bounds, reduced motion and JavaScript/shader errors. Run the commands at the top of that file with Playwright installed.
