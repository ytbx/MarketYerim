"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const userType = searchParams.get("type") || "customer"

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()

        if (profile?.user_type === "seller") {
          router.push("/seller/dashboard")
        } else {
          router.push("/")
        }
      }
    }
    checkUser()
  }, [supabase, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", data.user.id).single()

        if (profile?.user_type === "seller") {
          router.push("/seller/dashboard")
        } else {
          router.push("/")
        }
      }
    } catch (err: any) {
      setError(err.message || "Giriş yapılırken bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {userType === "seller" ? "Satıcı Girişi" : "Müşteri Girişi"}
          </CardTitle>
          <CardDescription className="text-center">Hesabınıza giriş yapın</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Hesabınız yok mu?{" "}
              <Link href={`/auth/register?type=${userType}`} className="text-primary hover:underline font-medium">
                Kayıt Ol
              </Link>
            </div>

            {userType === "seller" ? (
              <div className="text-center text-sm text-muted-foreground">
                <Link href="/auth/login" className="text-primary hover:underline">
                  Müşteri olarak giriş yap
                </Link>
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                <Link href="/auth/login?type=seller" className="text-primary hover:underline">
                  Satıcı olarak giriş yap
                </Link>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
