# Generated art integration

These paths are reserved for the image-generation pass from the previous ChatGPT session:

- `assets/images/generated/formation-atlas.webp` — 4x4 formation/card character atlas
- `assets/images/generated/battle-atlas.webp` — 4x4 cel-shaded battle character atlas
- `assets/images/generated/battle-stage.webp` — battle-stage background
- `assets/images/generated/boss-judge.webp` — grotesque modernist judge boss

Runtime behavior is fail-safe: every generated asset is preloaded before use. If a file is missing or fails to load, the previous procedural/SVG presentation remains visible instead of leaving a blank screen.
