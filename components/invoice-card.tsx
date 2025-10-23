"use client"

import { useState } from "react"
import type { Order } from "@/lib/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, ChevronDown, ChevronUp, Download } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ReturnRequestDialog } from "@/components/return-request-dialog"

interface InvoiceCardProps {
  order: Order
  userType?: "customer" | "seller"
}

export function InvoiceCard({ order, userType = "customer" }: InvoiceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

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

  const handleDownloadInvoice = () => {
    // Create a simple invoice text
    const invoiceText = `
FATURA
==========================================
Fatura No: ${order.id.slice(0, 8)}
Tarih: ${new Date(order.created_at).toLocaleDateString("tr-TR")}
Durum: ${getStatusText(order.status)}

ÜRÜNLER:
------------------------------------------
${order.order_items
  ?.map(
    (item) => `
${item.product?.name}
Mağaza: ${item.product?.store?.name}
Miktar: ${item.quantity} adet
Birim Fiyat: ${item.price.toFixed(2)} ₺
Toplam: ${(item.price * item.quantity).toFixed(2)} ₺
`,
  )
  .join("\n")}

------------------------------------------
TOPLAM TUTAR: ${order.total_amount.toFixed(2)} ₺
==========================================

TESLİMAT ADRESİ:
${order.shipping_address?.title}
${order.shipping_address?.full_name}
${order.shipping_address?.phone}
${order.shipping_address?.address_line1}
${order.shipping_address?.address_line2 || ""}
${order.shipping_address?.city}, ${order.shipping_address?.state} ${order.shipping_address?.postal_code}
    `

    const blob = new Blob([invoiceText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `fatura-${order.id.slice(0, 8)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-muted-foreground mt-1" />
            <div>
              <CardTitle className="text-lg">Fatura #{order.id.slice(0, 8)}</CardTitle>
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
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
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
                    {userType === "customer" && order.status === "delivered" && (
                      <ReturnRequestDialog orderItem={item} />
                    )}
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
                  {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t">
            <Button variant="outline" size="sm" onClick={handleDownloadInvoice}>
              <Download className="h-4 w-4 mr-2" />
              Faturayı İndir
            </Button>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Toplam Tutar</p>
              <p className="text-2xl font-bold">{order.total_amount.toFixed(2)} ₺</p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
