import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { ProductForm } from "@/components/product-form"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  const { data: product } = await supabase.from("products").select("*").eq("id", id).eq("store_id", store.id).single()

  if (!product) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Ürünü Düzenle</h1>
        <ProductForm storeId={store.id} product={product} />
      </div>
    </div>
  )
}
