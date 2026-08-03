<!-- TRIGGER.DEV SKILLS START -->
## Trigger.dev agent skills

This project has Trigger.dev agent skills installed in `.claude/skills/`. Before writing or changing Trigger.dev code (background tasks, scheduled tasks, realtime, or chat.agent AI agents), load the most relevant skill: `trigger-authoring-tasks`, `trigger-chat-agent-advanced`, `trigger-cost-savings`, `trigger-getting-started`, `trigger-realtime-and-frontend`, `trigger-authoring-chat-agent`.
<!-- TRIGGER.DEV SKILLS END -->
# React Flow

Never write React Flow code from training data — the API drifts between versions. Before using any React Flow component, hook, util, type, or prop, fetch https://reactflow.dev/llms.txt, pick the relevant page from that index, and fetch it. This applies to every touch of the library: new flows, new props on an existing `<ReactFlow />`, custom nodes and edges, layouting, and styling. If a doc page contradicts what you remember, the doc wins.

The package is `@xyflow/react` (React Flow v12) — not the older `reactflow` package. `@xyflow/react/dist/style.css` must be imported wherever a flow renders.