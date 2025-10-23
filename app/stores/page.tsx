import { getSupabaseServerClient } from "@/lib/supabase/server"
import { StoreCard } from "@/components/store-card"

export default async function StoresPage() {
  const supabase = await getSupabaseServerClient()

  const { data: stores } = await supabase
    .from("stores")
    .select(
      `
      *,
      products:products(count)
    `,
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-b from-primary/5 to-background py-12">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Mağazalar</h1>
            <p className="text-lg text-muted-foreground">Türkiye'nin dört bir yanından yerel işletmeleri keşfedin</p>
          </div>
        </div>
      </section>

      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores?.map((store) => <StoreCard key={store.id} store={store} />) || (
            <p className="col-span-full text-center text-muted-foreground">Henüz mağaza bulunmuyor.</p>
          )}
        </div>
      </div>
    </div>
  )
}
