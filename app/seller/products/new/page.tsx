import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProductForm } from "@/components/product-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getActiveSubscriptionForSeller, getProductLimitFromPlan } from "@/lib/subscriptions"

export default async function NewProductPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?type=seller")
  }

  const { data: store } = await supabase.from("stores").select("*").eq("seller_id", user.id).single()

  if (!store) {
    redirect("/seller/store")
  }
  // Enforce subscription product limits
  const { subscription } = await getActiveSubscriptionForSeller(user.id)
  if (!subscription) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8">Yeni Ürün Ekle</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Aktif üyelik bulunamadı</AlertTitle>
            <AlertDescription className="mt-2">
              Ürün ekleyebilmek için önce bir satıcı üyelik planı seçmelisiniz. İlk ay ücretsiz deneme mevcuttur.
            </AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button asChild>
              <Link href="/seller/subscription">Üyelik Planlarına Git</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const { count: productCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("store_id", store.id)

  const limit = getProductLimitFromPlan(subscription.plan)
  if (Number.isFinite(limit) && (productCount || 0) >= (limit as number)) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8">Yeni Ürün Ekle</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ürün limiti doldu</AlertTitle>
            <AlertDescription className="mt-2">
              Mevcut planınız en fazla {String(limit)} ürün eklemenize izin veriyor. Daha fazla ürün eklemek için planınızı
              yükseltin.
            </AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button asChild>
              <Link href="/seller/subscription">Planı Yükselt</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!store.bank_account) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8">Yeni Ürün Ekle</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Banka Hesap Bilgisi Gerekli</AlertTitle>
            <AlertDescription className="mt-2">
              Ürün ekleyebilmek için önce mağaza ayarlarından banka hesap bilgilerinizi (IBAN) girmeniz gerekmektedir.
              Bu bilgi, satış ödemelerinizin size aktarılması için zorunludur.
            </AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button asChild>
              <Link href="/seller/store">Mağaza Ayarlarına Git</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Yeni Ürün Ekle</h1>
        <ProductForm storeId={store.id} />
      </div>
    </div>
  )
}
