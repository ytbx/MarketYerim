"use client"

import { useState } from "react"
import type { Order } from "@/lib/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ReturnRequestDialog } from "@/components/return-request-dialog"

interface CustomerOrderListProps {
  orders: Order[]
}

export function CustomerOrderList({ orders }: CustomerOrderListProps) {
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

  const toggleOrder = (orderId: string) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
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
          <p className="text-muted-foreground mb-4">Henüz siparişiniz yok</p>
          <Button asChild>
            <Link href="/">Alışverişe Başla</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const isExpanded = expandedOrders.has(order.id)

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
                  <Button variant="ghost" size="icon" onClick={() => toggleOrder(order.id)}>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {order.order_items?.map((item) => {
                    const imageUrl = item.product?.images?.[0] || "/diverse-products-still-life.png"

                    return (
                      <div key={item.id} className="flex gap-3 p-3 bg-muted rounded-lg">
                        <Link href={`/product/${item.product_id}`} className="flex-shrink-0">
                          <div className="w-16 h-16 relative rounded-md overflow-hidden bg-background">
                            <Image
                              src={imageUrl || "/placeholder.svg"}
                              alt={item.product?.name || "Product"}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/product/${item.product_id}`}>
                            <p className="font-medium line-clamp-1 hover:text-primary transition-colors">
                              {item.product?.name}
                            </p>
                          </Link>
                          {item.product?.store && (
                            <Link
                              href={`/store/${item.product.store.id}`}
                              className="text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                              {item.product.store.name}
                            </Link>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} adet x {item.price.toFixed(2)} ₺
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="font-bold">{(item.price * item.quantity).toFixed(2)} ₺</p>
                          {( order.status === "delivered") && <ReturnRequestDialog orderItem={item} />}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {order.shipping_address && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-semibold mb-2">Teslimat Adresi</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground">{order.shipping_address.title}</p>
                      <p>
                        {order.shipping_address.full_name} - {order.shipping_address.phone}
                      </p>
                      <p>
                        {order.shipping_address.address_line1}
                        {order.shipping_address.address_line2 && `, ${order.shipping_address.address_line2}`}
                      </p>
                      <p>
                        {order.shipping_address.city}, {order.shipping_address.state}{" "}
                        {order.shipping_address.postal_code}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-semibold">Toplam Tutar</span>
                  <span className="text-xl font-bold">{order.total_amount.toFixed(2)} ₺</span>
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
