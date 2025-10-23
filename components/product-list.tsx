"use client"

import { useState } from "react"
import type { Product } from "@/lib/types/database"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Package } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface ProductListProps {
  products: Product[]
  storeId: string
}

export function ProductList({ products: initialProducts, storeId }: ProductListProps) {
  const [products, setProducts] = useState(initialProducts)
  const [loading, setLoading] = useState<string | null>(null)

  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ürünü silmek istediğinizden emin misiniz?")) return

    setLoading(id)
    try {
      await supabase.from("products").delete().eq("id", id)
      setProducts(products.filter((p) => p.id !== id))
      router.refresh()
    } catch (error) {
      console.error("Error deleting product:", error)
    } finally {
      setLoading(null)
    }
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Henüz ürün eklemediniz</p>
          <Button asChild>
            <Link href="/seller/products/new">İlk Ürününüzü Ekleyin</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {products.map((product) => {
        const imageUrl = product.images?.[0] || "/diverse-products-still-life.png"

        return (
          <Card key={product.id}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="w-24 h-24 relative rounded-md overflow-hidden bg-muted flex-shrink-0">
                  <Image src={imageUrl || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" asChild>
                        <Link href={`/seller/products/${product.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:text-destructive bg-transparent"
                        onClick={() => handleDelete(product.id)}
                        disabled={loading === product.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-lg font-bold">{product.price.toFixed(2)} ₺</span>
                    <Badge variant={product.stock > 0 ? "default" : "destructive"}>Stok: {product.stock}</Badge>
                    <Badge variant="outline">{product.category}</Badge>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Aktif" : "Pasif"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
