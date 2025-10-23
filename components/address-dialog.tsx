"use client"

import type React from "react"

import { useState } from "react"
import type { Address } from "@/lib/types/database"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface AddressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddressAdded?: (address: Address) => void
  address?: Address
}

export function AddressDialog({ open, onOpenChange, onAddressAdded, address }: AddressDialogProps) {
  const [title, setTitle] = useState(address?.title || "")
  const [fullName, setFullName] = useState(address?.full_name || "")
  const [phone, setPhone] = useState(address?.phone || "")
  const [addressLine1, setAddressLine1] = useState(address?.address_line1 || "")
  const [addressLine2, setAddressLine2] = useState(address?.address_line2 || "")
  const [city, setCity] = useState(address?.city || "")
  const [state, setState] = useState(address?.state || "")
  const [postalCode, setPostalCode] = useState(address?.postal_code || "")
  const [isDefault, setIsDefault] = useState(address?.is_default || false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = getSupabaseBrowserClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Kullanıcı bulunamadı")

      if (isDefault) {
        await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id)
      }

      const addressData = {
        user_id: user.id,
        title,
        full_name: fullName,
        phone,
        address_line1: addressLine1,
        address_line2: addressLine2,
        city,
        state,
        postal_code: postalCode,
        country: "Türkiye",
        is_default: isDefault,
      }

      if (address) {
        const { error: updateError } = await supabase.from("addresses").update(addressData).eq("id", address.id)

        if (updateError) throw updateError
      } else {
        const { data: newAddress, error: insertError } = await supabase
          .from("addresses")
          .insert(addressData)
          .select()
          .single()

        if (insertError) throw insertError
        if (onAddressAdded && newAddress) onAddressAdded(newAddress)
      }

      onOpenChange(false)
      resetForm()
    } catch (err: any) {
      setError(err.message || "Adres kaydedilirken bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setFullName("")
    setPhone("")
    setAddressLine1("")
    setAddressLine2("")
    setCity("")
    setState("")
    setPostalCode("")
    setIsDefault(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{address ? "Adresi Düzenle" : "Yeni Adres Ekle"}</DialogTitle>
          <DialogDescription>Teslimat adres bilgilerinizi girin</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Adres Başlığı</Label>
            <Input
              id="title"
              placeholder="Ev, İş, vb."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Ad Soyad</Label>
              <Input
                id="fullName"
                placeholder="Ahmet Yılmaz"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                placeholder="0555 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine1">Adres Satırı 1</Label>
            <Input
              id="addressLine1"
              placeholder="Sokak, Mahalle, No"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine2">Adres Satırı 2 (Opsiyonel)</Label>
            <Input
              id="addressLine2"
              placeholder="Daire, Kat, vb."
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">İl</Label>
              <Input id="city" placeholder="İstanbul" value={city} onChange={(e) => setCity(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">İlçe</Label>
              <Input
                id="state"
                placeholder="Kadıköy"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Posta Kodu</Label>
              <Input
                id="postalCode"
                placeholder="34000"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(checked === true)}
            />
            <Label htmlFor="isDefault" className="cursor-pointer">
              Varsayılan adres olarak ayarla
            </Label>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Kaydediliyor..." : address ? "Güncelle" : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
