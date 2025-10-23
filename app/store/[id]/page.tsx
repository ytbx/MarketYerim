import { getSupabaseServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProductCard } from "@/components/product-card"
import Image from "next/image"
import { Store, Package } from "lucide-react"

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()

  const { data: store } = await supabase.from("stores").select("*").eq("id", id).eq("is_active", true).single()

  if (!store) {
    notFound()
  }

  // Hide products if seller has no active subscription
  const { data: products } = await supabase
    .from("products")
    .select("*, seller_sub:subscriptions!inner(is_active, end_date)")
    .eq("store_id", id)
    .eq("is_active", true)
    .eq("seller_sub.is_active", true)
    .gt("seller_sub.end_date", new Date().toISOString())
    .order("created_at", { ascending: false })

  const logoUrl = store.logo_url || "/generic-store-logo.png"

  return (
    <div className="min-h-screen bg-background">
      <div className="h-48 relative bg-gradient-to-br from-primary/10 to-primary/5">
        {store.banner_url && (
          <Image src={store.banner_url || "/placeholder.svg"} alt={store.name} fill className="object-cover" />
        )}
      </div>

      <div className="container">
        <div className="relative -mt-16 mb-8">
          <div className="bg-card rounded-lg shadow-lg p-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 relative rounded-lg overflow-hidden border-4 border-background shadow-md bg-white">
                <Image src={logoUrl || "/placeholder.svg"} alt={store.name} fill className="object-cover" />
              </div>

              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{store.name}</h1>
                {store.description && <p className="text-muted-foreground mb-4">{store.description}</p>}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>{products?.length || 0} ürün</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="py-8">
          <h2 className="text-2xl font-semibold mb-6">Mağaza Ürünleri</h2>

          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Bu mağazada henüz ürün bulunmuyor.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
