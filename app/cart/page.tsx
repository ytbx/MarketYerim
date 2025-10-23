import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CartList } from "@/components/cart-list"

export default async function CartPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: cartItems } = await supabase
    .from("cart_items")
    .select(
      `
      *,
      product:products(
        *,
        store:stores(id, name)
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })

  return <CartList cartItems={cartItems || []} addresses={addresses || []} />
}
