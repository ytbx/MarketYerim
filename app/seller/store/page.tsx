import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StoreForm } from "@/components/store-form"

export default async function SellerStorePage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?type=seller")
  }

  const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()

  if (profile?.user_type !== "seller") {
    redirect("/")
  }

  const { data: store } = await supabase.from("stores").select("*").eq("seller_id", user.id).single()

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">{store ? "Mağaza Ayarları" : "Mağaza Oluştur"}</h1>
        <StoreForm store={store} />
      </div>
    </div>
  )
}
