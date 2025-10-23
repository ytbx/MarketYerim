"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  ShoppingCart,
  Store,
  User,
  LogOut,
  LayoutDashboard,
  Package,
  ShoppingBag,
  BarChart3,
  RotateCcw,
  FileText,
  MapPin,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export function Header() {
  const [user, setUser] = useState<any>(null)
  const [userType, setUserType] = useState<string | null>(null)
  const [cartCount, setCartCount] = useState(0)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const getUserData = async (userId: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", userId)
        .single()

      setUserType(profile?.user_type || null)

      if (profile?.user_type === "customer") {
        const { count } = await supabase
          .from("cart_items")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
        setCartCount(count || 0)
      } else {
        setCartCount(0)
      }
    }

    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      if (user) await getUserData(user.id)
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user || null
      setUser(sessionUser)
      if (sessionUser) {
        getUserData(sessionUser.id)
      } else {
        setUserType(null)
        setCartCount(0)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Sol taraf - logo ve menü */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <Store className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">MarketYerim</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {userType === "seller" ? (
              <>
                <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                  Ürünler
                </Link>
                <Link href="/stores" className="text-sm font-medium hover:text-primary transition-colors">
                  Mağazalar
                </Link>
                <Link
                  href="/seller/dashboard"
                  className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Panel
                </Link>
              </>
            ) : (
              <>
                <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                  Ürünler
                </Link>
                <Link href="/stores" className="text-sm font-medium hover:text-primary transition-colors">
                  Mağazalar
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Sağ taraf - kullanıcı ve sepet */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {userType === "customer" && (
                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {cartCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {userType === "seller" ? (
                    <>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Satıcı Menüsü</div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/seller/dashboard" className="cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Satıcı Paneli
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/seller/store" className="cursor-pointer">
                          <Store className="mr-2 h-4 w-4" />
                          Mağazam
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/seller/products" className="cursor-pointer">
                          <Package className="mr-2 h-4 w-4" />
                          Ürünlerim
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/seller/orders" className="cursor-pointer">
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          Siparişler
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/seller/analytics" className="cursor-pointer">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Satış Analizleri
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/seller/returns" className="cursor-pointer">
                          <RotateCcw className="mr-2 h-4 w-4" />
                          İade Talepleri
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/seller/subscription" className="cursor-pointer">
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Üyelik
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Hesap Menüsü</div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/account" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          Hesabım
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/cart" className="cursor-pointer">
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Sepetim
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account/orders" className="cursor-pointer">
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          Siparişlerim
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account/returns" className="cursor-pointer">
                          <RotateCcw className="mr-2 h-4 w-4" />
                          İadelerim
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account/addresses" className="cursor-pointer">
                          <MapPin className="mr-2 h-4 w-4" />
                          Adreslerim
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Çıkış Yap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Giriş Yap</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Kayıt Ol</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
