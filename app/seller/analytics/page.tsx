import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SalesChart } from "@/components/sales-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function SellerAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const params = await searchParams
  const currentDate = new Date()
  const year = Number(params.year) || currentDate.getFullYear()
  const month = Number(params.month) || currentDate.getMonth() + 1

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

  // Query from order_items first to avoid circular RLS policy dependencies
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const { data: orderItems } = await supabase
    .from("order_items")
    .select(
      `
      *,
      product:products!inner(store_id),
      order:orders!inner(created_at, status)
    `,
    )
    .eq("product.store_id", store.id)
    .gte("order.created_at", startDate.toISOString())
    .lte("order.created_at", endDate.toISOString())
    .neq("order.status", "cancelled")

  // Process data to group by day
  const salesByDay = new Map<string, { sales: number; orders: Set<string> }>()

  orderItems?.forEach((item: any) => {
    const date = new Date(item.order.created_at).toISOString().split("T")[0]
    const existing = salesByDay.get(date) || { sales: 0, orders: new Set() }
    existing.sales += item.quantity * item.price
    existing.orders.add(item.order_id)
    salesByDay.set(date, existing)
  })

  // Convert to array format for the chart
  const salesData = Array.from(salesByDay.entries())
    .map(([date, data]) => ({
      day_date: date,
      daily_sales: data.sales,
      total_orders: data.orders.size,
    }))
    .sort((a, b) => a.day_date.localeCompare(b.day_date))

  const totalSales = salesData.reduce((sum, day) => sum + Number(day.daily_sales), 0)
  const totalOrders = salesData.reduce((sum, day) => sum + Number(day.total_orders), 0)
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Satış Analizleri</h1>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Satış</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSales.toFixed(2)} ₺</div>
              <p className="text-xs text-muted-foreground">
                {year} / {month.toString().padStart(2, "0")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Sipariş</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {year} / {month.toString().padStart(2, "0")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ortalama Sipariş Değeri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageOrderValue.toFixed(2)} ₺</div>
              <p className="text-xs text-muted-foreground">
                {year} / {month.toString().padStart(2, "0")}
              </p>
            </CardContent>
          </Card>
        </div>

        <SalesChart salesData={salesData || []} year={year} month={month} />
      </div>
    </div>
  )
}
