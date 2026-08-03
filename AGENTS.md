<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Database types

Derive database types from the Drizzle schema — never hand-write custom or partial shapes for table rows. Export typeof table.$inferSelect (and $inferInsert when needed) from lib/schema.ts and import it. When a consumer needs only some columns, narrow with Pick<Row, ...> / Omit<Row, ...> rather than redeclaring a literal type. Don't add an insert type where db.insert(...).values() already enforces the shape.

# React Flow

Never write React Flow code from training data — the API drifts between versions. Before using any React Flow component, hook, util, type, or prop, fetch https://reactflow.dev/llms.txt, pick the relevant page from that index, and fetch it. This applies to every touch of the library: new flows, new props on an existing `<ReactFlow />`, custom nodes and edges, layouting, and styling. If a doc page contradicts what you remember, the doc wins.

The package is `@xyflow/react` (React Flow v12) — not the older `reactflow` package. `@xyflow/react/dist/style.css` must be imported wherever a flow renders.