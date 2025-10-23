"use client"

import type React from "react"

import { useState } from "react"
import type { OrderItem } from "@/lib/types/database"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RotateCcw } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface ReturnRequestDialogProps {
  orderItem: OrderItem
}

export function ReturnRequestDialog({ orderItem }: ReturnRequestDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: existingRequest } = await supabase
        .from("return_requests")
        .select("*")
        .eq("order_item_id", orderItem.id)
        .single()

      if (existingRequest) {
        setError("Bu ürün için zaten bir iade talebi oluşturulmuş")
        setLoading(false)
        return
      }

      const { error: insertError } = await supabase.from("return_requests").insert({
        order_item_id: orderItem.id,
        reason,
        status: "pending",
      })

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setReason("")
        setSuccess(false)
        router.refresh()
      }, 2000)
    } catch (err: any) {
      setError(err.message || "İade talebi oluşturulurken bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RotateCcw className="h-3 w-3 mr-1" />
          İade Talebi
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>İade Talebi Oluştur</DialogTitle>
          <DialogDescription>İade sebebinizi açıklayın</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>İade talebiniz başarıyla oluşturuldu!</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">İade Sebebi *</Label>
            <Textarea
              id="reason"
              placeholder="Ürünü neden iade etmek istiyorsunuz?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button type="submit" className="flex-1" disabled={loading || success}>
              {loading ? "Gönderiliyor..." : "Talep Oluştur"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
