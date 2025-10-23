"use client"

import type React from "react"

import { useState } from "react"
import type { Store } from "@/lib/types/database"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"

interface StoreFormProps {
  store?: Store | null
}

export function StoreForm({ store }: StoreFormProps) {
  const [name, setName] = useState(store?.name || "")
  const [description, setDescription] = useState(store?.description || "")
  const [isActive, setIsActive] = useState(store?.is_active ?? true)
  const [bankAccount, setBankAccount] = useState(store?.bank_account || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Kullanıcı bulunamadı")

      const storeData = {
        seller_id: user.id,
        name,
        description,
        is_active: isActive,
        bank_account: bankAccount || null,
      }

      if (store) {
        const { error: updateError } = await supabase.from("stores").update(storeData).eq("id", store.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from("stores").insert(storeData)

        if (insertError) throw insertError
      }

      setSuccess(true)
      router.refresh()

      if (!store) {
        setTimeout(() => {
          router.push("/seller/dashboard")
        }, 1500)
      }
    } catch (err: any) {
      setError(err.message || "Mağaza kaydedilirken bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>Mağaza başarıyla kaydedildi!</AlertDescription>
            </Alert>
          )}

          {!bankAccount && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Önemli:</strong> Banka hesap bilgisi olmadan ürün satışı yapamazsınız. Lütfen IBAN numaranızı
                girin.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Mağaza Adı *</Label>
            <Input
              id="name"
              placeholder="Örn: Ahmet'in Dükkanı"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mağaza Açıklaması</Label>
            <Textarea
              id="description"
              placeholder="Mağazanız hakkında kısa bir açıklama yazın..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankAccount">Banka Hesap Bilgisi (IBAN) *</Label>
            <Input
              id="bankAccount"
              placeholder="TR00 0000 0000 0000 0000 0000 00"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              required
              maxLength={32}
            />
            <p className="text-sm text-muted-foreground">
              Satış ödemelerinizin aktarılacağı IBAN numaranızı girin. Bu bilgi olmadan ürün satışı yapamazsınız.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Mağaza Durumu</Label>
              <p className="text-sm text-muted-foreground">Mağazanızı aktif veya pasif yapın</p>
            </div>
            <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <Button type="submit" className="w-full" disabled={loading || success}>
            {loading ? "Kaydediliyor..." : store ? "Güncelle" : "Mağaza Oluştur"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
