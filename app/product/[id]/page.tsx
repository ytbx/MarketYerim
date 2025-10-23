import { getSupabaseServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProductDetail } from "@/components/product-detail"

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()

  const { data: product } = await supabase
    .from("products")
    .select(
      `
      *,
      store:stores(*)
    `,
    )
    .eq("id", id)
    .eq("is_active", true)
    .single()

  if (!product) {
    notFound()
  }

  return <ProductDetail product={product} />
}
