"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Calendar, Package } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

interface SubscriptionDetails {
  id: string
  plan: {
    name: string
    max_products: number | null
    price: number
  }
  start_date: string
  end_date: string
}

export default function SubscriptionSuccessPage() {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const subscriptionId = searchParams.get("subscription")
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    if (!subscriptionId) {
      router.push("/seller/subscription")
      return
    }
    loadSubscription()
  }, [subscriptionId])

  const loadSubscription = async () => {
    try {
      const { data: subData } = await supabase
        .from("subscriptions")
        .select(
          `id, start_date, end_date,
           plan:subscription_plans ( name, max_products, price )`
        )
        .eq("id", subscriptionId)
        .single()

      if (subData) {
        setSubscription(subData as SubscriptionDetails)
      }
    } catch (err) {
      console.error("Error loading subscription:", err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR")
  }

  if (loading) {
    return (
      <div className="container py-10">
        <div className="text-center">Yükleniyor...</div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="container py-10">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Abonelik bulunamadı.</p>
            <Button asChild className="mt-4">
              <Link href="/seller/subscription">Planlara Dön</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10 max-w-2xl">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-green-600 mb-2">Ödeme Başarılı!</h1>
        <p className="text-muted-foreground">
          Üyelik planınız başarıyla aktif edildi.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Aktif Üyelik Detayları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Plan Adı</p>
              <p className="font-semibold text-lg">{subscription.plan.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ürün Limiti</p>
              <p className="font-semibold">
                {subscription.plan.max_products === null 
                  ? "Sınırsız" 
                  : `${subscription.plan.max_products} ürün`}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Başlangıç Tarihi</p>
              <p className="font-semibold">{formatDate(subscription.start_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bitiş Tarihi</p>
              <p className="font-semibold">{formatDate(subscription.end_date)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button asChild className="w-full">
          <Link href="/seller/products/new">
            <Package className="h-4 w-4 mr-2" />
            Ürün Ekle
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/seller/subscription">
            <Calendar className="h-4 w-4 mr-2" />
            Üyelik Yönetimi
          </Link>
        </Button>
      </div>

      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">Önemli Bilgiler:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Üyelik süresi dolmadan önce yenileme yapabilirsiniz</li>
            <li>• Ürün limitiniz dolduğunda planınızı yükseltebilirsiniz</li>
            <li>• Üyelik süresi dolduğunda ürünleriniz geçici olarak gizlenir</li>
            <li>• Herhangi bir sorunuz için destek ekibimizle iletişime geçebilirsiniz</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
