"use client"

import { useState } from "react"
import type { Product } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Store, Minus, Plus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface ProductDetailProps {
  product: Product
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
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
          .update({ quantity: existingItem.quantity + quantity })
          .eq("id", existingItem.id)
      } else {
        await supabase.from("cart_items").insert({
          user_id: user.id,
          product_id: product.id,
          quantity,
        })
      }

      router.push("/cart")
    } catch (error) {
      console.error("Error adding to cart:", error)
    } finally {
      setLoading(false)
    }
  }

  const images = product.images?.length > 0 ? product.images : ["/diverse-products-still-life.png"]

  return (
    <div className="container py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="aspect-square relative overflow-hidden rounded-lg bg-muted">
            <Image src={images[selectedImage] || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square relative overflow-hidden rounded-md border-2 ${
                    selectedImage === index ? "border-primary" : "border-transparent"
                  }`}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            {product.store && (
              <Link
                href={`/store/${product.store.id}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Store className="h-4 w-4" />
                <span>{product.store.name}</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold">{product.price.toFixed(2)} ₺</span>
            <Badge variant={product.stock > 0 ? "default" : "destructive"}>
              {product.stock > 0 ? `${product.stock} adet stokta` : "Stokta yok"}
            </Badge>
          </div>

          {product.category && (
            <div>
              <span className="text-sm text-muted-foreground">Kategori: </span>
              <Badge variant="outline">{product.category}</Badge>
            </div>
          )}

          {product.description && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Ürün Açıklaması</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="font-medium">Adet:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={handleAddToCart} disabled={product.stock === 0 || loading}>
              <ShoppingCart className="h-5 w-5 mr-2" />
              {loading ? "Ekleniyor..." : "Sepete Ekle"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
