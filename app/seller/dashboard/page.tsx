import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingBag, TrendingUp, StoreIcon, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function SellerDashboardPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?type=seller")
  }

  const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()

  if (profile?.user_type !== "seller") {
    redirect("/")
  }

  const { data: store } = await supabase.from("stores").select("*").eq("seller_id", user.id).single()

  if (!store) {
    redirect("/seller/store")
  }

  const { data: products, count: productCount } = await supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("store_id", store.id)

  const { data: orderItems } = await supabase
    .from("order_items")
    .select(
      `
      *,
      product:products!inner(store_id),
      order:orders(*)
    `,
    )
    .eq("product.store_id", store.id)

  // Group order items by order_id to get unique orders
  const uniqueOrders = orderItems?.reduce((acc, item) => {
    if (item.order && !acc.some((o) => o.id === item.order.id)) {
      acc.push(item.order)
    }
    return acc
  }, [] as any[])

  const orderCount = uniqueOrders?.length || 0
  const totalRevenue = uniqueOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0

  const activeProducts = products?.filter((p) => p.is_active).length || 0

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Satıcı Paneli</h1>
            <p className="text-muted-foreground">Hoş geldiniz, {store.name}</p>
          </div>
        </div>

        {!store.bank_account && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Banka Hesap Bilgisi Eksik</AlertTitle>
            <AlertDescription className="mt-2 flex items-center justify-between">
              <span>
                Ürün satışı yapabilmek için mağaza ayarlarından banka hesap bilgilerinizi (IBAN) girmeniz gerekmektedir.
              </span>
              <Button asChild variant="outline" size="sm" className="ml-4 bg-transparent">
                <Link href="/seller/store">Ayarlara Git</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Ürün</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productCount || 0}</div>
              <p className="text-xs text-muted-foreground">{activeProducts} aktif ürün</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Sipariş</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orderCount || 0}</div>
              <p className="text-xs text-muted-foreground">Tüm zamanlar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRevenue.toFixed(2)} ₺</div>
              <p className="text-xs text-muted-foreground">Tüm zamanlar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mağaza Durumu</CardTitle>
              <StoreIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{store.is_active ? "Aktif" : "Pasif"}</div>
              <p className="text-xs text-muted-foreground">Mağaza durumu</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Hızlı İşlemler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full bg-transparent" variant="outline">
                <Link href="/seller/products/new">Yeni Ürün Ekle</Link>
              </Button>
              <Button asChild className="w-full bg-transparent" variant="outline">
                <Link href="/seller/products">Ürünleri Yönet</Link>
              </Button>
              <Button asChild className="w-full bg-transparent" variant="outline">
                <Link href="/seller/orders">Siparişleri Görüntüle</Link>
              </Button>
              <Button asChild className="w-full bg-transparent" variant="outline">
                <Link href="/seller/store">Mağaza Ayarları</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Son Siparişler</CardTitle>
            </CardHeader>
            <CardContent>
              {uniqueOrders && uniqueOrders.length > 0 ? (
                <div className="space-y-4">
                  {uniqueOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Sipariş #{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{order.total_amount.toFixed(2)} ₺</p>
                        <p className="text-xs text-muted-foreground">{order.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Henüz sipariş yok</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
