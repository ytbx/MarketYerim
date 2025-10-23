"use client"

import { useState } from "react"
import type { CartItem, Address } from "@/lib/types/database"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { CheckoutDialog } from "@/components/checkout-dialog"

interface CartListProps {
  cartItems: CartItem[]
  addresses: Address[]
}

export function CartList({ cartItems, addresses }: CartListProps) {
  const [items, setItems] = useState(cartItems)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setLoading(itemId)
    try {
      await supabase.from("cart_items").update({ quantity: newQuantity }).eq("id", itemId)

      setItems(items.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)))
      router.refresh()
    } catch (error) {
      console.error("Error updating quantity:", error)
    } finally {
      setLoading(null)
    }
  }

  const removeItem = async (itemId: string) => {
    setLoading(itemId)
    try {
      await supabase.from("cart_items").delete().eq("id", itemId)

      setItems(items.filter((item) => item.id !== itemId))
      router.refresh()
    } catch (error) {
      console.error("Error removing item:", error)
    } finally {
      setLoading(null)
    }
  }

  const total = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0)

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-12 pb-8">
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">Sepetiniz Boş</h2>
              <p className="text-muted-foreground mb-6">Alışverişe başlamak için ürünleri keşfedin</p>
              <Button asChild>
                <Link href="/">Ürünleri İncele</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Sepetim</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const product = item.product
              if (!product) return null

              const imageUrl = product.images?.[0] || "/diverse-products-still-life.png"

              return (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <Link href={`/product/${product.id}`} className="flex-shrink-0">
                        <div className="w-24 h-24 relative rounded-md overflow-hidden bg-muted">
                          <Image
                            src={imageUrl || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link href={`/product/${product.id}`}>
                          <h3 className="font-semibold hover:text-primary transition-colors line-clamp-2">
                            {product.name}
                          </h3>
                        </Link>

                        {product.store && (
                          <Link
                            href={`/store/${product.store.id}`}
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            {product.store.name}
                          </Link>
                        )}

                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-lg font-bold">{product.price.toFixed(2)} ₺</span>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 bg-transparent"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={loading === item.id || item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 bg-transparent"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={loading === item.id || item.quantity >= product.stock}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                        disabled={loading === item.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Sipariş Özeti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.product?.name} x {item.quantity}
                      </span>
                      <span className="font-medium">{((item.product?.price || 0) * item.quantity).toFixed(2)} ₺</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Toplam</span>
                    <span>{total.toFixed(2)} ₺</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <CheckoutDialog cartItems={items} addresses={addresses} total={total} />
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
