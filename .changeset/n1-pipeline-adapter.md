---
'@stephen-netu/design-system': minor
---

Add pipeline-adapter module: PipelineState → GraphSnapshot mapping for pipeline DAG visualization.

New exports from `@stephen-netu/design-system/n1-flow-canvas`:
- `pipelineStateToSnapshot()` — converts raw PipelineState into a GraphSnapshot
- `createEmptyPipelineSnapshot()` — creates an all-Pending pipeline graph
- `PIPELINE_STAGE_NAMES` — ordered stage name array
- `PipelineState`, `PipelineStageData`, `PipelineStatus`, `PipelineTermination` types

FlowCanvas now renders status-colored nodes with error indicators and attempt badges.
