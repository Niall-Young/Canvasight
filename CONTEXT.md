# Canvasight Canvas

Canvasight turns incomplete intent and supporting material into a structure that people and AI can inspect, revise, and execute together.

## Language

**Page**:
A complete thinking space for one creative or execution problem.
_Avoid_: Project, board

**Group**:
A named, single-level semantic container that classifies canvas nodes without creating an execution relationship.
_Avoid_: Folder, frame, parent task

**Task Node**:
An editable unit of intent, decision, work, or instruction that can participate in an executable flow.
_Avoid_: Text card, prompt box

**Asset**:
A Canvasight-managed file that supplies input, reference, an option, or an output.
_Avoid_: Blob, upload

**Asset Node**:
One visible canvas representation of one Asset, with a title, description, and role in the current structure.
_Avoid_: Attachment card, image node

**Attachment**:
An Asset kept as supporting material inside a Task Node instead of being promoted to an independent Asset Node.
_Avoid_: Asset Node

**Edge**:
A visible semantic relationship between Task Nodes or Asset Nodes. Group membership is not an Edge.
_Avoid_: Group link, containment line

**Run**:
Submission of an explicitly scoped canvas structure and its Assets to the currently bound AI task.
_Avoid_: Export, preview
