// Outputs produced so far in a run, keyed by the id of the node that produced them.
export type NodeOutputs = Record<string, unknown>

// {{ nodeId.path.to.value }} — whitespace around the path is optional.
const PLACEHOLDER = /\{\{\s*([^{}]*?)\s*\}\}/g

// Path segments: dots and brackets are separators, so `items[0].name` reads as
// ["items", "0", "name"]. Quoted bracket keys keep their quotes stripped.
const SEGMENT = /[^.[\]]+/g

/** Walks a dotted/bracketed path into a value, or undefined if it dead-ends. */
function getByPath(source: unknown, path: string): unknown {
  const segments = path.match(SEGMENT)
  if (!segments) return undefined

  let current = source
  for (const segment of segments) {
    if (current === null || current === undefined) return undefined
    if (typeof current !== "object") return undefined

    const key = segment.replace(/^["']|["']$/g, "")
    current = (current as Record<string, unknown>)[key]
  }

  return current
}

/** Renders a resolved value into the field text. */
function format(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

/**
 * Replaces every `{{ nodeId.path }}` placeholder in a field's text with the
 * matching value from this run's node outputs. Placeholders that resolve to
 * nothing become an empty string; objects and arrays are dropped in as JSON.
 */
export function interpolate(text: string, outputs: NodeOutputs): string {
  return text.replace(PLACEHOLDER, (_match, path: string) =>
    format(getByPath(outputs, path))
  )
}
