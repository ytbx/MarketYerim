"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, MapPin } from "lucide-react"
import Image from "next/image"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface SellerOrderListProps {
  orders: Array<{
    order: any
    items: any[]
  }>
}

export function SellerOrderList({ orders: initialOrders }: SellerOrderListProps) {
  const [orders, setOrders] = useState(initialOrders)
  const [loading, setLoading] = useState<string | null>(null)

  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setLoading(orderId)
    try {
      await supabase.from("orders").update({ status: newStatus }).eq("id", orderId)

      setOrders(
        orders.map((o) =>
          o.order.id === orderId
            ? {
                ...o,
                order: { ...o.order, status: newStatus },
              }
            : o,
        ),
      )
      router.refresh()
    } catch (error) {
      console.error("Error updating order status:", error)
    } finally {
      setLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary"
      case "processing":
        return "default"
      case "shipped":
        return "default"
      case "delivered":
        return "default"
      case "cancelled":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Beklemede"
      case "processing":
        return "Hazırlanıyor"
      case "shipped":
        return "Kargoda"
      case "delivered":
        return "Teslim Edildi"
      case "cancelled":
        return "İptal Edildi"
      default:
        return status
    }
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Henüz sipariş yok</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map(({ order, items }) => {
        const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

        return (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Sipariş #{order.id.slice(0, 8)}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(order.created_at).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
                  <Select
                    value={order.status}
                    onValueChange={(value) => handleStatusChange(order.id, value)}
                    disabled={loading === order.id}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Beklemede</SelectItem>
                      <SelectItem value="processing">Hazırlanıyor</SelectItem>
                      <SelectItem value="shipped">Kargoda</SelectItem>
                      <SelectItem value="delivered">Teslim Edildi</SelectItem>
                      <SelectItem value="cancelled">İptal Edildi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                {items.map((item) => {
                  const imageUrl = item.product?.images?.[0] || "/diverse-products-still-life.png"

                  return (
                    <div key={item.id} className="flex gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-16 h-16 relative rounded-md overflow-hidden bg-background flex-shrink-0">
                        <Image
                          src={imageUrl || "/placeholder.svg"}
                          alt={item.product?.name || "Product"}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-clamp-1">{item.product?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} adet x {item.price.toFixed(2)} ₺
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{(item.price * item.quantity).toFixed(2)} ₺</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {order.shipping_address && (
                <div className="flex gap-2 p-3 bg-muted rounded-lg">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">{order.shipping_address.title}</p>
                    <p className="text-muted-foreground">
                      {order.shipping_address.full_name} - {order.shipping_address.phone}
                    </p>
                    <p className="text-muted-foreground">
                      {order.shipping_address.address_line1}
                      {order.shipping_address.address_line2 && `, ${order.shipping_address.address_line2}`}
                    </p>
                    <p className="text-muted-foreground">
                      {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-semibold">Toplam Tutar</span>
                <span className="text-xl font-bold">{totalAmount.toFixed(2)} ₺</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
