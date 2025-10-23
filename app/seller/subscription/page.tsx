"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Crown, Star, Zap } from "lucide-react"
import { useRouter } from "next/navigation"

interface SubscriptionPlan {
  id: string
  name: string
  max_products: number | null
  price: number
  duration_days: number
}

interface ActiveSubscription {
  id: string
  seller_id: string
  plan: SubscriptionPlan
  start_date: string
  end_date: string
  is_active: boolean
}

export default function SellerSubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<ActiveSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) {
        router.push("/auth/login?type=seller")
        return
      }

      // Check if seller has ever had a subscription (to determine if free tier should be shown)
      const { data: hasEverSubscribed } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("seller_id", auth.user.id)
        .limit(1)

      // Load available plans
      const { data: plansData } = await supabase
        .from("subscription_plans")
        .select("id, name, max_products, price, duration_days")
        .order("price", { ascending: true })

      // Filter out free plan if seller has ever subscribed before
      const filteredPlans = plansData?.filter((plan: SubscriptionPlan) => {
        if (plan.price === 0 && hasEverSubscribed && hasEverSubscribed.length > 0) {
          return false // Hide free plan if seller has subscribed before
        }
        return true
      }) || []

      setPlans(filteredPlans)

      // Load current active subscription
      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select(
          `id, seller_id, start_date, end_date, is_active,
           plan:subscription_plans ( id, name, max_products, price, duration_days )`
        )
        .eq("seller_id", auth.user.id)
        .eq("is_active", true)
        .gt("end_date", new Date().toISOString())
        .order("end_date", { ascending: false })
        .limit(1)
        .maybeSingle()

      setCurrentSubscription(subscriptionData as ActiveSubscription | null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (planName: string) => {
    setSubscribing(planName)
    setError(null)

    try {
      // Check if this is a free plan
      const plan = plans.find(p => p.name === planName)
      if (plan && plan.price === 0) {
        // For free plans, subscribe directly
        const response = await fetch("/api/seller/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan_name: planName }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Abonelik oluşturulamadı")
        }

        // Reload data to show updated subscription
        await loadData()
      } else {
        // For paid plans, redirect to payment page
        router.push(`/seller/subscription/payment?plan=${encodeURIComponent(planName)}`)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubscribing(null)
    }
  }

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "starter":
        return <Star className="h-6 w-6 text-green-500" />
      case "basic":
        return <CheckCircle className="h-6 w-6 text-blue-500" />
      case "pro":
        return <Zap className="h-6 w-6 text-purple-500" />
      case "unlimited":
        return <Crown className="h-6 w-6 text-yellow-500" />
      default:
        return <CheckCircle className="h-6 w-6 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR")
  }

  const isCurrentPlan = (planName: string) => {
    return currentSubscription?.plan.name === planName
  }

  if (loading) {
    return (
      <div className="container py-10">
        <div className="text-center">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Satıcı Üyelik Planları</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Subscription */}
      {currentSubscription && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getPlanIcon(currentSubscription.plan.name)}
              Mevcut Üyelik: {currentSubscription.plan.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Başlangıç Tarihi</p>
                <p className="font-semibold">{formatDate(currentSubscription.start_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bitiş Tarihi</p>
                <p className="font-semibold">{formatDate(currentSubscription.end_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ürün Limiti</p>
                <p className="font-semibold">
                  {currentSubscription.plan.max_products === null 
                    ? "Sınırsız" 
                    : `${currentSubscription.plan.max_products} ürün`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${isCurrentPlan(plan.name) ? "ring-2 ring-primary" : ""}`}>
            {isCurrentPlan(plan.name) && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                Aktif Plan
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getPlanIcon(plan.name)}
                {plan.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-2xl font-bold">
                {plan.price === 0 ? "Ücretsiz" : `${plan.price.toLocaleString("tr-TR")} ₺`}
                {plan.price > 0 && <span className="text-sm text-muted-foreground">/ay</span>}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">
                    {plan.max_products === null 
                      ? "Sınırsız ürün ekleme" 
                      : `${plan.max_products} ürün ekleme hakkı`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{plan.duration_days} gün geçerlilik</span>
                </div>
                {plan.name === "Starter" && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">İlk ay ücretsiz</span>
                  </div>
                )}
              </div>

              <Button
                className="w-full"
                variant={isCurrentPlan(plan.name) ? "outline" : "default"}
                disabled={isCurrentPlan(plan.name) || subscribing === plan.name}
                onClick={() => handleSubscribe(plan.name)}
              >
                {subscribing === plan.name 
                  ? "İşleniyor..." 
                  : isCurrentPlan(plan.name) 
                    ? "Aktif Plan" 
                    : plan.price === 0 
                      ? "Başlat" 
                      : "Satın Al"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">Önemli Bilgiler:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Starter planı ilk ay ücretsizdir ve 5 ürün ekleme hakkı verir</li>
            <li>• Plan değişikliği yaptığınızda yeni plan hemen aktif olur</li>
            <li>• Üyelik süresi dolduğunda ürünleriniz görünmez hale gelir</li>
            <li>• Üyelik yenileme için planınızı tekrar seçebilirsiniz</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}