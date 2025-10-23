"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, CreditCard, Shield } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

interface SubscriptionPlan {
  id: string
  name: string
  max_products: number | null
  price: number
  duration_days: number
}

export default function SubscriptionPaymentPage() {
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Payment form state
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const planName = searchParams.get("plan")
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    loadPlan()
  }, [planName])

  const loadPlan = async () => {
    if (!planName) {
      router.push("/seller/subscription")
      return
    }

    try {
      const { data: planData } = await supabase
        .from("subscription_plans")
        .select("id, name, max_products, price, duration_days")
        .eq("name", planName)
        .single()

      if (!planData) {
        router.push("/seller/subscription")
        return
      }

      setPlan(planData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!plan) return

    setProcessing(true)
    setError(null)

    try {
      // Validate card form
      if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
        throw new Error("Lütfen tüm kart bilgilerini doldurun")
      }

      // Process payment (placeholder - will be replaced with actual payment provider)
      const response = await fetch("/api/seller/subscription/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_name: plan.name,
          payment_method: "card",
          card_details: {
            number: cardNumber.replace(/\s/g, ""),
            name: cardName,
            expiry: cardExpiry,
            cvv: cardCvv
          }
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Ödeme işlemi başarısız")
      }

      // Redirect to success page
      router.push(`/seller/subscription/success?subscription=${data.subscription_id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, "")
      .replace(/(\d{4})/g, "$1 ")
      .trim()
      .slice(0, 19)
  }

  const formatExpiry = (value: string) => {
    let formatted = value.replace(/\D/g, "")
    if (formatted.length >= 2) {
      formatted = formatted.slice(0, 2) + "/" + formatted.slice(2, 4)
    }
    return formatted
  }

  if (loading) {
    return (
      <div className="container py-10">
        <div className="text-center">Yükleniyor...</div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="container py-10">
        <Alert variant="destructive">
          <AlertDescription>Plan bulunamadı.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container py-10 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/seller/subscription">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Planlara Geri Dön
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Ödeme Bilgileri</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Seçilen Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-2xl font-bold">{plan.name}</div>
            <div className="text-3xl font-bold text-primary">
              {plan.price === 0 ? "Ücretsiz" : `${plan.price.toLocaleString("tr-TR")} ₺`}
              {plan.price > 0 && <span className="text-sm text-muted-foreground">/ay</span>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  {plan.max_products === null 
                    ? "Sınırsız ürün ekleme" 
                    : `${plan.max_products} ürün ekleme hakkı`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm">{plan.duration_days} gün geçerlilik</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Kart Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handlePayment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Kart Numarası</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardName">Kart Üzerindeki İsim</Label>
                <Input
                  id="cardName"
                  placeholder="AHMET YILMAZ"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cardExpiry">Son Kullanma Tarihi</Label>
                  <Input
                    id="cardExpiry"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    maxLength={5}
                    required
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
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={processing || plan.price === 0}
                size="lg"
              >
                {processing 
                  ? "İşleniyor..." 
                  : plan.price === 0 
                    ? "Ücretsiz Başlat" 
                    : `${plan.price.toLocaleString("tr-TR")} ₺ Öde ve Başlat`}
              </Button>
            </form>

            <div className="mt-4 text-xs text-muted-foreground text-center">
              <Shield className="h-3 w-3 inline mr-1" />
              Ödeme bilgileriniz güvenli şekilde işlenir
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
