# AB’S student — animated 3D model, v1

`abs-student.glb` is a self-contained glTF 2.0 asset, approximately 481 KB.

This is an editable, stylized interpretation of the supplied student illustrations,
not an exact photogrammetric reconstruction. It retains the blue polo, swept dark
hair, grey trousers, sneakers and backpack. It uses rounded articulated meshes,
not a deforming human skin rig. Facial expressions and finger gestures are fixed.

## Included loops

- Idle: 3 seconds
- Walk: 1.05 seconds, in place
- Point: 3 seconds, right-arm pointing gesture
- Present: 3 seconds, right-arm presentation gesture
- Celebrate: 2 seconds, both arms raised

All directions use the same model: rotate its root around the Y axis. Forward is
+Z, up is +Y, and the origin is near the feet. Units are metres. Use a consistent
camera and model scale so changing direction never changes the rendered size.

## Preview and rebuild

- Open `/student-model.html` in the Vite preview for animation and rotation controls.
- `npm run model:build` regenerates the GLB and statistics from editable source.
- `npm run model:test` checks file size, structure, geometry and loop continuity.
- Editable geometry and animation source: `src/student3d/create-student.mjs`.
- Example loader, lighting and animation crossfades: `src/student3d/preview.js`.

## Website use

Load once with Three.js `GLTFLoader`, create an `AnimationMixer`, and play the
named clips. Use Walk while scrolling and Idle or a gesture at each stop. Keep
walking in place; move the model container along the existing page path. Rotate
the model to face its direction of travel. Crossfade actions over about 0.2 seconds.

Render only while visible and animate only when movement or a gesture requires it.
Cap pixel ratio on mobile. Respect reduced motion by showing an idle pose. Keep the
existing image fallback for devices without WebGL2.

The landing page still uses the original frame character. This asset and its
separate preview allow appearance review before replacing that character.
