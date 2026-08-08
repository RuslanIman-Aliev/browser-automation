import { Resend } from "resend"

// Server-side only — the Resend API does not support CORS, so never import
// this from a client component.
export const resend = new Resend(process.env.RESEND_API_KEY!)
