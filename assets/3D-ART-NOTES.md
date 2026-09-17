# Subculture 3D presentation

The loader in `index.html` loads the local Three.js module and `subculture-3d.js`. All dependencies are vendored; no CDN is needed. Serve the repository over HTTP, as before.

- 96 existing characters: 19 male and 77 female (19.8% / 80.2%, nearest whole-person split). Gender and appearance are stable per roster entry and do not alter combat stats.
- Formation cards: cached WebP portraits rendered from each character's model, with matching hair, outfit, accessories and weapon. Portraits are generated lazily when visible.
- Battle: volume meshes with stepped cel lighting, shadows, articulated arm movement and idle motion. Characters are not images on planes.
- Three bosses: displaced porcelain/architectural guardian, radial toothed devourer, and an orbiting eye sculpture.
- Environment: modeled platform, repeating colonnade, nested arches, suspended geometry and perspective camera.
- Effects: bounded world-space particles on resolved damage/support events. Selecting a skill does not produce an attack. Reduced-motion and reset paths clean up effects.

## Current fidelity

These are procedural stylized models, not hand-authored production character assets. They share a base body and costume system, with palette, hair, wardrobe, accessory and weapon variations. They do not match the fidelity of commercial games such as Honkai: Star Rail. Bespoke facial topology, authored animation clips and individual high-detail costumes remain future asset work.

WebGL2 is required. If unavailable, an explicit renderer error appears and existing gameplay remains accessible. A maximum of 180 effect meshes is enforced; portrait render targets and temporary model geometry are released. The renderer pauses while the page is hidden.

Existing missing audio paths have not been populated by this art update.
