"use client"

import { useState } from "react"
import type { ReturnRequest } from "@/lib/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Check, X } from "lucide-react"
import Image from "next/image"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface ReturnRequestListProps {
  returnRequests: ReturnRequest[]
}

export function ReturnRequestList({ returnRequests: initialRequests }: ReturnRequestListProps) {
  const [requests, setRequests] = useState(initialRequests)
  const [loading, setLoading] = useState<string | null>(null)

  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const handleStatusChange = async (requestId: string, newStatus: "approved" | "rejected") => {
    setLoading(requestId)
    try {
      await supabase.from("return_requests").update({ status: newStatus }).eq("id", requestId)

      setRequests(requests.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r)))
      router.refresh()
    } catch (error) {
      console.error("Error updating return request:", error)
    } finally {
      setLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary"
      case "approved":
        return "default"
      case "rejected":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Beklemede"
      case "approved":
        return "Onaylandı"
      case "rejected":
        return "Reddedildi"
      default:
        return status
    }
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Henüz iade talebi yok</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const orderItem = request.order_item
        const product = orderItem?.product
        const imageUrl = product?.images?.[0] || "/diverse-products-still-life.png"

        return (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">İade Talebi #{request.id.slice(0, 8)}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(request.created_at).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Badge variant={getStatusColor(request.status)}>{getStatusText(request.status)}</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex gap-3 p-3 bg-muted rounded-lg">
                <div className="w-16 h-16 relative rounded-md overflow-hidden bg-background flex-shrink-0">
                  <Image
                    src={imageUrl || "/placeholder.svg"}
                    alt={product?.name || "Product"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium line-clamp-1">{product?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {orderItem?.quantity} adet x {orderItem?.price.toFixed(2)} ₺
                  </p>
                  <p className="text-sm font-bold mt-1">
                    Toplam: {((orderItem?.price || 0) * (orderItem?.quantity || 0)).toFixed(2)} ₺
                  </p>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="font-semibold mb-1">İade Sebebi</p>
                <p className="text-sm text-muted-foreground">{request.reason}</p>
              </div>

              {request.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => handleStatusChange(request.id, "approved")}
                    disabled={loading === request.id}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Onayla
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-destructive hover:text-destructive bg-transparent"
                    onClick={() => handleStatusChange(request.id, "rejected")}
                    disabled={loading === request.id}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reddet
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
