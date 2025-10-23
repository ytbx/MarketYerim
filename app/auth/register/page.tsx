"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const userType = searchParams.get("type") || "customer"

  const supabase = getSupabaseBrowserClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: userType,
          },
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
        },
      })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        router.push("/auth/login?type=" + userType)
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Kayıt olurken bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {userType === "seller" ? "Satıcı Kaydı" : "Müşteri Kaydı"}
          </CardTitle>
          <CardDescription className="text-center">Yeni hesap oluşturun</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>Kayıt başarılı! E-postanızı kontrol edin. Yönlendiriliyorsunuz...</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Ad Soyad</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Ahmet Yılmaz"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

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
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">En az 6 karakter</p>
            </div>

            <Button type="submit" className="w-full" disabled={loading || success}>
              {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Zaten hesabınız var mı?{" "}
              <Link href={`/auth/login?type=${userType}`} className="text-primary hover:underline font-medium">
                Giriş Yap
              </Link>
            </div>

            {userType === "seller" ? (
              <div className="text-center text-sm text-muted-foreground">
                <Link href="/auth/register" className="text-primary hover:underline">
                  Müşteri olarak kayıt ol
                </Link>
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                <Link href="/auth/register?type=seller" className="text-primary hover:underline">
                  Satıcı olarak kayıt ol
                </Link>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
