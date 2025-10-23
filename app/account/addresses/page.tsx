import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AddressList } from "@/components/address-list"

export default async function AddressesPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-7xl mx-auto px-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Adreslerim</h1>
        <AddressList addresses={addresses || []} />
      </div>
    </div>
  )
}
