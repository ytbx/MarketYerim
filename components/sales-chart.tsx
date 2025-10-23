"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface SalesChartProps {
  salesData: Array<{
    day_date: string
    daily_sales: number
    total_orders: number
  }>
  year: number
  month: number
}

export function SalesChart({ salesData, year, month }: SalesChartProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleYearChange = (newYear: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("year", newYear)
    router.push(`/seller/analytics?${params.toString()}`)
  }

  const handleMonthChange = (newMonth: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("month", newMonth)
    router.push(`/seller/analytics?${params.toString()}`)
  }

  const chartData = salesData.map((day) => ({
    date: new Date(day.day_date).getDate(),
    sales: Number(day.daily_sales),
    orders: Number(day.total_orders),
  }))

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const months = [
    { value: "1", label: "Ocak" },
    { value: "2", label: "Şubat" },
    { value: "3", label: "Mart" },
    { value: "4", label: "Nisan" },
    { value: "5", label: "Mayıs" },
    { value: "6", label: "Haziran" },
    { value: "7", label: "Temmuz" },
    { value: "8", label: "Ağustos" },
    { value: "9", label: "Eylül" },
    { value: "10", label: "Ekim" },
    { value: "11", label: "Kasım" },
    { value: "12", label: "Aralık" },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Günlük Satış Grafiği</CardTitle>
          <div className="flex gap-2">
            <Select value={year.toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={month.toString()} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" label={{ value: "Gün", position: "insideBottom", offset: -5 }} />
              <YAxis label={{ value: "Satış (₺)", angle: -90, position: "insideLeft" }} />
              <Tooltip
                formatter={(value: any, name: string) => {
                  if (name === "sales") return [`${Number(value).toFixed(2)} ₺`, "Satış"]
                  if (name === "orders") return [value, "Sipariş"]
                  return value
                }}
              />
              <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            Bu ay için satış verisi bulunmuyor
          </div>
        )}
      </CardContent>
    </Card>
  )
}
