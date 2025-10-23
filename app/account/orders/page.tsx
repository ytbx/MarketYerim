import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CustomerOrderList } from "@/components/customer-order-list"

export default async function CustomerOrdersPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items(
        *,
        product:products(
          *,
          store:stores(id, name),
          images
        )
      ),
      shipping_address:addresses!orders_shipping_address_id_fkey(*)
    `
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })

  console.log("Orders query result:", { orders, error, user: user.id })

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Siparişlerim</h1>
        <CustomerOrderList orders={orders || []} />
      </div>
    </div>
  )
}
