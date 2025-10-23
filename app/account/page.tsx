import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Package, MapPin, User } from "lucide-react"

export default async function AccountPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { count: orderCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("customer_id", user.id)

  const { count: addressCount } = await supabase
    .from("addresses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Hesabım</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profil Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Ad Soyad</p>
                <p className="font-medium">{profile?.full_name || "Belirtilmemiş"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">E-posta</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefon</p>
                <p className="font-medium">{profile?.phone || "Belirtilmemiş"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Siparişlerim
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-4">{orderCount || 0}</div>
              <Button asChild className="w-full bg-transparent" variant="outline">
                <Link href="/account/orders">Siparişleri Görüntüle</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Adreslerim
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-4">{addressCount || 0}</div>
              <Button asChild className="w-full bg-transparent" variant="outline">
                <Link href="/account/addresses">Adresleri Yönet</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
