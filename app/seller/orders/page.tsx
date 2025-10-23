import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SellerOrderList } from "@/components/seller-order-list"

export default async function SellerOrdersPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?type=seller")
  }

  const { data: store } = await supabase.from("stores").select("*").eq("seller_id", user.id).single()

  if (!store) {
    redirect("/seller/store")
  }

  const { data: orderItems, error } = await supabase
    .from("order_items")
    .select(
      `
      *,
      product:products!inner(
        *,
        store:stores!inner(id, name)
      ),
      order:orders(
        *,
        shipping_address:addresses!orders_shipping_address_id_fkey(*)
      )
    `,
    )
    .eq("product.store_id", store.id)
    .order("created_at", { ascending: false })

  const groupedOrders = orderItems?.reduce(
    (acc, item) => {
      const orderId = item.order_id
      if (!acc[orderId]) {
        acc[orderId] = {
          order: item.order,
          items: [],
        }
      }
      acc[orderId].items.push(item)
      return acc
    },
    {} as Record<string, { order: any; items: any[] }>,
  )

  const orders = Object.values(groupedOrders || {})

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Siparişler</h1>
        <SellerOrderList orders={orders} />
      </div>
    </div>
  )
}
