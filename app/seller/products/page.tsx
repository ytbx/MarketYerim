import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProductList } from "@/components/product-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function SellerProductsPage() {
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

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Ürünlerim</h1>
          <Button asChild>
            <Link href="/seller/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Ürün Ekle
            </Link>
          </Button>
        </div>

        <ProductList products={products || []} storeId={store.id} />
      </div>
    </div>
  )
}
