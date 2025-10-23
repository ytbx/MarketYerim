import { getSupabaseServerClient } from "@/lib/supabase/server"
import { ProductGrid } from "@/components/product-grid"
import { ProductFilters } from "@/components/product-filters"
import { Suspense } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LayoutDashboard } from "lucide-react"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; search?: string }>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const category = params.category || ""
  const search = params.search || ""
  const itemsPerPage = 100

  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userType = null
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()
    userType = profile?.user_type
  }

  let query = supabase
    .from("products")
    .select(
      `
      *,
      store:stores(id, name, logo_url)
    `,
      { count: "exact" },
    )
    .eq("is_active", true)

  if (category) {
    query = query.eq("category", category)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  const { data: products, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)

  const totalPages = Math.ceil((count || 0) / itemsPerPage)

  const { data: categories } = await supabase.from("products").select("category").eq("is_active", true)

  const uniqueCategories = [...new Set(categories?.map((p) => p.category).filter(Boolean))]

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-b from-primary/5 to-background py-12 md:py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
              Türkiye'nin Komisyonsuz E-Ticaret Platformu
            </h1>
            <p className="text-lg text-muted-foreground text-pretty">
              Yerel işletmelerden binlerce ürün. Komisyon yok, sadece kaliteli alışveriş.
            </p>
          </div>
        </div>
      </section>

      {userType === "seller" && (
        <div className="container py-4">
          <Alert className="bg-primary/10 border-primary">
            <LayoutDashboard className="h-4 w-4" />
            <AlertTitle>Satıcı Paneli</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Mağazanızı yönetmek ve ürünlerinizi düzenlemek için satıcı panelinize gidin.</span>
              <Button asChild size="sm" className="ml-4">
                <Link href="/seller/dashboard">Panele Git</Link>
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="container py-8">
        <Suspense fallback={<div>Yükleniyor...</div>}>
          <ProductFilters categories={uniqueCategories} currentCategory={category} currentSearch={search} />
        </Suspense>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">
              {search ? `"${search}" için sonuçlar` : category ? `${category} Kategorisi` : "Tüm Ürünler"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {count || 0} ürün bulundu (Sayfa {page} / {totalPages})
            </p>
          </div>

          <ProductGrid products={products || []} currentPage={page} totalPages={totalPages} />
        </div>
      </div>
    </div>
  )
}
