# Task body Markdown contract

Task `body` is always one Markdown string. Never persist HTML, editor JSON, a rich-text AST, or hidden formatting metadata. The toolbarless rich-text editor is only a presentation and editing layer over that string.

## Authored syntax

AI-authored Task bodies may use:

- headings levels 1–3;
- bold, italic, and strikethrough;
- bullet and ordered lists;
- blockquotes;
- inline code and fenced code blocks;
- links with safe relative, `http`, `https`, or `mailto` targets.

Keep `- [ ]`, `- [x]`, and `- [X]` markers as ordinary list text. They are not interactive task-list nodes.

Do not intentionally author tables, headings levels 4–6, raw HTML, inline Markdown images, embedded audio/video, colors, fonts, or alignment markup. Historical unsupported Markdown may remain as an opaque round-tripped block; preserve it byte-for-byte when the requested write does not edit that body.

## Files and media

Never represent new file content through Task `attachments`, Markdown image syntax, HTML media elements, data URLs, or local absolute paths. Create or reuse one managed Asset Node per file and connect the Task to each Asset with `Task -> Asset` so Task Flow Run includes the files. Canvasight infers image, SVG, video, or ordinary-file presentation from the managed file itself.

When refining a Task, submit only the requested `body` change. If the graph context exposes only a preview and the complete body is required to make a safe rewrite, obtain the missing source or ask the user instead of reconstructing omitted text.
