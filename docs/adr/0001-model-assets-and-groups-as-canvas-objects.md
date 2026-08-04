# Model Assets and Groups as canvas objects

Canvasight models Task Nodes, Asset Nodes, and Groups as distinct canvas objects because files and semantic classification must remain visible to both the user and AI. Group membership is single-level containment rather than an Edge, while Task/Asset relationships remain explicit Edges; this preserves executable topology, allows React Flow parent movement and collapse, and avoids turning every classification into a false dependency.

Existing Task Node attachments remain supported and can be promoted deliberately. This avoids rewriting old canvases into noisy layouts while still letting new visual and file inputs become first-class structure.
