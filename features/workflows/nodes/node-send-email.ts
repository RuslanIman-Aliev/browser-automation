import { resend } from "@/lib/resend"

// Resend's sandbox sender. It only delivers to the Resend account's own email
// address — swap this for a verified domain to send to real recipients.
const FROM = "onboarding@resend.dev"

export async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string
  subject: string
  body: string
}) {
  // The Resend SDK never throws on an API error, it returns it as `error`, so
  // a run would look successful with no email sent unless we throw ourselves.
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject,
    text: body,
  })

  if (error) {
    throw new Error(`Resend failed to send the email: ${error.message}`)
  }

  if (!data) {
    throw new Error("Resend returned no email id")
  }

  return { id: data.id }
}
