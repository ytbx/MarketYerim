import { getSupabaseServerClient } from "@/lib/supabase/server"

export type SubscriptionPlan = {
  id: string
  name: string
  max_products: number | null
  price: number // TL per month
  duration_days: number
}

export type ActiveSubscription = {
  id: string
  seller_id: string
  plan: SubscriptionPlan
  start_date: string
  end_date: string
  is_active: boolean
}

export async function getActiveSubscriptionForSeller(sellerId: string) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      `id, seller_id, start_date, end_date, is_active,
       plan:subscription_plans ( id, name, max_products, price, duration_days )`,
    )
    .eq("seller_id", sellerId)
    .eq("is_active", true)
    .gt("end_date", new Date().toISOString())
    .order("end_date", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return { subscription: null as ActiveSubscription | null, error }
  return { subscription: (data as any) as ActiveSubscription | null, error: null }
}

export function getProductLimitFromPlan(plan: SubscriptionPlan | null | undefined) {
  if (!plan) return 0
  if (plan.max_products === null) return Infinity
  return plan.max_products
}


