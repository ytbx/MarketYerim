import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    const user = auth.user
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = (await request.json()) as { 
      plan_name: string
      payment_method: string
      card_details: {
        number: string
        name: string
        expiry: string
        cvv: string
      }
    }

    const { plan_name, payment_method, card_details } = body

    if (!plan_name || !payment_method || !card_details) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get plan details
    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("id, name, max_products, price, duration_days")
      .eq("name", plan_name)
      .single()

    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 })

    // Check if seller already has any subscription history
    const { data: existingSubs } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("seller_id", user.id)
      .limit(1)

    const now = new Date()
    const isFirstTime = !existingSubs || existingSubs.length === 0
    const periodDays = plan.duration_days
    const periodEnd = new Date(now)
    periodEnd.setDate(periodEnd.getDate() + periodDays)

    // For free plans, skip payment processing
    if (plan.price === 0) {
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

      return NextResponse.json({ 
        subscription_id: sub.id,
        message: "Free subscription activated successfully"
      })
    }

    // TODO: Integrate with actual payment provider (PayTR, Stripe, etc.)
    // For now, simulate payment processing
    const paymentResult = await simulatePayment({
      amount: plan.price,
      card_details,
      plan_name: plan.name
    })

    if (!paymentResult.success) {
      return NextResponse.json({ error: paymentResult.error }, { status: 400 })
    }

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

    return NextResponse.json({ 
      subscription_id: sub.id,
      payment_id: paymentResult.payment_id,
      message: "Payment successful and subscription activated"
    })

  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 })
  }
}

// Simulate payment processing - replace with actual payment provider
async function simulatePayment(params: {
  amount: number
  card_details: any
  plan_name: string
}) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Basic validation
  const { card_details } = params
  
  if (!card_details.number || card_details.number.length < 16) {
    return { success: false, error: "Geçersiz kart numarası" }
  }
  
  if (!card_details.name || card_details.name.length < 2) {
    return { success: false, error: "Geçersiz kart sahibi adı" }
  }
  
  if (!card_details.expiry || !card_details.expiry.includes("/")) {
    return { success: false, error: "Geçersiz son kullanma tarihi" }
  }
  
  if (!card_details.cvv || card_details.cvv.length < 3) {
    return { success: false, error: "Geçersiz CVV" }
  }

  // Simulate payment success
  return {
    success: true,
    payment_id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    message: "Payment processed successfully"
  }
}
