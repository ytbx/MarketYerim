import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    const user = auth.user
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = (await request.json()) as { plan_name: string }
    const planName = body?.plan_name
    if (!planName) return NextResponse.json({ error: "Missing plan_name" }, { status: 400 })

    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("id, name, max_products, price, duration_days")
      .eq("name", planName)
      .single()

    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 })

    // Check if seller already has any subscription history to determine trial eligibility
    const { data: existingSubs } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("seller_id", user.id)
      .limit(1)

    const now = new Date()
    const trialEligible = !existingSubs || existingSubs.length === 0
    const periodDays = plan.duration_days
    const periodEnd = new Date(now)
    periodEnd.setDate(periodEnd.getDate() + periodDays)

    // Deactivate existing active subscriptions
    await supabase
      .from("subscriptions")
      .update({ is_active: false })
      .eq("seller_id", user.id)
      .eq("is_active", true)

    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .insert({
        seller_id: user.id,
        plan_id: plan.id,
        start_date: now.toISOString(),
        end_date: periodEnd.toISOString(),
        is_active: true,
      })
      .select()
      .single()

    if (subError) return NextResponse.json({ error: subError.message }, { status: 500 })

    return NextResponse.json({ subscription: sub })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 })
  }
}


