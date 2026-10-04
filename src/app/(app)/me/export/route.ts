import { createClient } from "@/lib/supabase/server"

/**
 * "Download my data" (GDPR): everything Pocket keeps about the signed-in person, as JSON. Read with their own
 * session, so the database's rules decide what is included (nothing about other people beyond shared jobs).
 */
export async function GET() {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const uid = claims?.claims.sub
  if (!uid) return new Response("Not signed in", { status: 401 })

  const [profile, privateDetails, posted, helped, offers, messages, reviewsWritten, reviewsAbout, payments, notifications, payout] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("profile_private").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("jobs").select("*").eq("poster_id", uid),
      supabase.from("jobs").select("*").eq("helper_id", uid),
      supabase.from("offers").select("*").eq("helper_id", uid),
      supabase.from("chat_messages").select("id, conversation_id, body, created_at").eq("sender_id", uid),
      supabase.from("reviews").select("*").eq("author_id", uid),
      supabase.from("reviews").select("*").eq("subject_id", uid),
      supabase.from("payments").select("*").or(`payer_id.eq.${uid},payee_id.eq.${uid}`),
      supabase.from("notifications").select("*").eq("user_id", uid),
      supabase.from("payout_accounts").select("*").eq("user_id", uid).maybeSingle(),
    ])

  const body = {
    exported_at: new Date().toISOString(),
    account: { id: uid, email: claims?.claims.email ?? null },
    profile: profile.data,
    private_details: privateDetails.data,
    jobs_posted: posted.data,
    jobs_helped: helped.data,
    offers: offers.data,
    messages_sent: messages.data,
    reviews_written: reviewsWritten.data,
    reviews_about_me: reviewsAbout.data,
    payments: payments.data,
    notifications: notifications.data,
    card_payout_account: payout.data,
  }
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="pocket-my-data.json"`,
      "cache-control": "no-store",
    },
  })
}
