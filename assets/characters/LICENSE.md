# Anime character source assets

These VRM files are optimized copies of VRoid Studio beta sample models, whose embedded `extensions.VRM.meta.licenseName` is `CC0`. Their embedded metadata also explicitly allows everyone to use them, commercial use and violent expression. No models marked `Redistribution_Prohibited` or with an unspecified license are included.

| Local asset | Original title |
| --- | --- |
| aurora.vrm | Victoria Rubin |
| amber.vrm | Vivi |
| lune.vrm | Vita |
| velvet.vrm | Darkness Shibu |
| noctis.vrm | Sakurada Fumiriya |

Source: [madjin/vrm-samples](https://github.com/madjin/vrm-samples/tree/e16eb187100149a315ad92c3c9968f1d5baa6c7d/vroid/beta), commit `e16eb187100149a315ad92c3c9968f1d5baa6c7d`.

- [VRoid sample model conditions](https://vroid.pixiv.help/hc/en-us/articles/4402614652569-Do-VRoid-Studio-s-sample-models-come-with-conditions-of-use-)
- [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/)

Changes: maximum texture dimensions reduced to 512 px (normal maps to 256 px), unused facial morph targets removed, buffers repacked. Original license metadata remains embedded. Geometry, painted face, hair, outfit, skin weights and humanoid rig originate from the samples. Runtime animations and subtle outfit tinting are implemented separately in `../models/anime-characters.js`.

The project uses five shared base models; it does not claim 96 independently authored character meshes.
