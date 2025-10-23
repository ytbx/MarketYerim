"use client"

import { useState } from "react"
import type { CartItem, Address } from "@/lib/types/database"
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
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, MapPin, Plus } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AddressDialog } from "@/components/address-dialog"

interface CheckoutDialogProps {
  cartItems: CartItem[]
  addresses: Address[]
  total: number
}

export function CheckoutDialog({ cartItems, addresses, total }: CheckoutDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"address" | "payment">("address")
  const [selectedAddress, setSelectedAddress] = useState<string>(addresses.find((a) => a.is_default)?.id || "")
  const [cardType, setCardType] = useState<"credit" | "debit" | "papara">("credit")
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addressDialogOpen, setAddressDialogOpen] = useState(false)
  const [localAddresses, setLocalAddresses] = useState(addresses)

  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const handleAddressAdded = (newAddress: Address) => {
    setLocalAddresses([...localAddresses, newAddress])
    setSelectedAddress(newAddress.id)
  }

  const handleCheckout = async () => {
    if (!selectedAddress) {
      setError("Lütfen bir teslimat adresi seçin")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Kullanıcı bulunamadı")

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({ 
          customer_id: user.id, 
          total_amount: total, 
          status: "pending", 
          shipping_address_id: selectedAddress 
        })
        .select()
        .single()

      if (orderError || !order) {
        throw new Error(orderError?.message || "Sipariş oluşturulamadı")
      }

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product?.price || 0,
      }))
      
      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)
      if (itemsError) {
        throw new Error(itemsError.message)
      }

      // Clear cart after successful order
      const { error: cartError } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
      
      if (cartError) {
        console.error("Cart could not be cleared:", cartError)
      }

      setOpen(false)
      // Redirect to orders page
      router.push(`/account/orders`)
    } catch (err: any) {
      setError(err.message || "Sipariş oluşturulurken bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" size="lg">
            Siparişi Tamamla
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{step === "address" ? "Teslimat Adresi" : "Ödeme Bilgileri"}</DialogTitle>
            <DialogDescription>
              {step === "address"
                ? "Ürünlerin teslim edileceği adresi seçin"
                : "Ödeme bilgilerinizi güvenli bir şekilde girin"}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === "address" ? (
            <div className="space-y-4">
              <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                {localAddresses.map((address) => (
                  <Card key={address.id} className={selectedAddress === address.id ? "border-primary" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                        <label htmlFor={address.id} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{address.title}</span>
                            {address.is_default && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Varsayılan</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {address.full_name} - {address.phone}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {address.address_line1}
                            {address.address_line2 && `, ${address.address_line2}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {address.city}, {address.state} {address.postal_code}
                          </p>
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </RadioGroup>

              <Button variant="outline" className="w-full bg-transparent" onClick={() => setAddressDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Adres Ekle
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setOpen(false)}>
                  İptal
                </Button>
                <Button className="flex-1" onClick={() => setStep("payment")} disabled={!selectedAddress}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Ödemeye Geç
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Kart Tipi</Label>
                <RadioGroup value={cardType} onValueChange={(value: any) => setCardType(value)}>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="credit" id="credit" />
                      <Label htmlFor="credit" className="cursor-pointer font-normal">
                        Kredi Kartı
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="debit" id="debit" />
                      <Label htmlFor="debit" className="cursor-pointer font-normal">
                        Banka Kartı
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="papara" id="papara" />
                      <Label htmlFor="papara" className="cursor-pointer font-normal">
                        Papara
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardNumber">Kart Numarası</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) =>
                    setCardNumber(
                      e.target.value
                        .replace(/\s/g, "")
                        .replace(/(\d{4})/g, "$1 ")
                        .trim(),
                    )
                  }
                  maxLength={19}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardName">Kart Üzerindeki İsim</Label>
                <Input
                  id="cardName"
                  placeholder="AHMET YILMAZ"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cardExpiry">Son Kullanma Tarihi</Label>
                  <Input
                    id="cardExpiry"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, "")
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + "/" + value.slice(2, 4)
                      }
                      setCardExpiry(value)
                    }}
                    maxLength={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardCvv">CVV</Label>
                  <Input
                    id="cardCvv"
                    placeholder="123"
                    type="password"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                    maxLength={3}
                  />
                </div>
              </div>

              <Card className="bg-muted">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Toplam Tutar</span>
                    <span className="text-2xl font-bold">{total.toFixed(2)} ₺</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setStep("address")}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Geri
                </Button>
                <Button className="flex-1" onClick={handleCheckout} disabled={loading}>
                  {loading ? "İşleniyor..." : "Ödemeyi Tamamla"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AddressDialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen} onAddressAdded={handleAddressAdded} />
    </>
  )
}
