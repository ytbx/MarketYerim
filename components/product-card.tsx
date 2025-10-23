"use client"

import type { Product } from "@/lib/types/database"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Store } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const handleAddToCart = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .single()

      if (existingItem) {
        await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + 1 })
          .eq("id", existingItem.id)
      } else {
        await supabase.from("cart_items").insert({
          user_id: user.id,
          product_id: product.id,
          quantity: 1,
        })
      }

      router.refresh()
    } catch (error) {
      console.error("Error adding to cart:", error)
    } finally {
      setLoading(false)
    }
  }

  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : "/diverse-products-still-life.png"

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/product/${product.id}`}>
        <div className="aspect-square relative overflow-hidden bg-muted">
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold">Stokta Yok</span>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4 space-y-2">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">{product.name}</h3>
        </Link>

        {product.store && (
          <Link
            href={`/store/${product.store.id}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Store className="h-3 w-3" />
            <span className="line-clamp-1">{product.store.name}</span>
          </Link>
        )}

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">{product.price.toFixed(2)} ₺</span>
          <span className="text-xs text-muted-foreground">Stok: {product.stock}</span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button className="w-full" onClick={handleAddToCart} disabled={product.stock === 0 || loading}>
          <ShoppingCart className="h-4 w-4 mr-2" />
          {loading ? "Ekleniyor..." : "Sepete Ekle"}
        </Button>
      </CardFooter>
    </Card>
  )
}
