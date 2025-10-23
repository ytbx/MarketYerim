"use client"

import type React from "react"

import { useState } from "react"
import type { Product } from "@/lib/types/database"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Upload, X } from "lucide-react"
import Image from "next/image"

interface ProductFormProps {
  storeId: string
  product?: Product
}

export function ProductForm({ storeId, product }: ProductFormProps) {
  const [name, setName] = useState(product?.name || "")
  const [description, setDescription] = useState(product?.description || "")
  const [price, setPrice] = useState(product?.price?.toString() || "")
  const [stock, setStock] = useState(product?.stock?.toString() || "")
  const [category, setCategory] = useState(product?.category || "")
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>(product?.images || [])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isActive, setIsActive] = useState(product?.is_active ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setImageFiles((prev) => [...prev, ...files])

    // Create preview URLs
    const newPreviews = files.map((file) => URL.createObjectURL(file))
    setImagePreviews((prev) => [...prev, ...newPreviews])
  }

  const removePreview = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const uploadedImageUrls: string[] = []

      for (const file of imageFiles) {
        const fileExt = file.name.split(".").pop()
        const fileName = `${storeId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          })

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("product-images").getPublicUrl(uploadData.path)

        uploadedImageUrls.push(publicUrl)
      }

      const allImages = [...existingImages, ...uploadedImageUrls]

      const productData = {
        store_id: storeId,
        name,
        description,
        price: Number.parseFloat(price),
        stock: Number.parseInt(stock),
        category,
        images: allImages,
        is_active: isActive,
      }

      if (product) {
        const { error: updateError } = await supabase.from("products").update(productData).eq("id", product.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from("products").insert(productData)

        if (insertError) throw insertError
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/seller/products")
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Ürün kaydedilirken bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>Ürün başarıyla kaydedildi! Yönlendiriliyorsunuz...</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Ürün Adı *</Label>
            <Input
              id="name"
              placeholder="Örn: Kablosuz Kulaklık"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Ürün Açıklaması</Label>
            <Textarea
              id="description"
              placeholder="Ürününüz hakkında detaylı açıklama yazın..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Fiyat (₺) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stok Adedi *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                placeholder="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori *</Label>
            <Input
              id="category"
              placeholder="Örn: Elektronik, Giyim, Ev & Yaşam"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">Ürün Resimleri</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
              <input id="images" type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
              <label htmlFor="images" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Resim yüklemek için tıklayın veya sürükleyin</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP (Maks. 5MB)</p>
              </label>
            </div>

            {existingImages.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Mevcut Resimler:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {existingImages.map((url, index) => (
                    <div key={url} className="relative group">
                      <Image
                        src={url || "/placeholder.svg"}
                        alt={`Existing ${index + 1}`}
                        width={200}
                        height={200}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {imagePreviews.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Yeni Resimler:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={preview} className="relative group">
                      <Image
                        src={preview || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        width={200}
                        height={200}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePreview(index)}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Ürün Durumu</Label>
              <p className="text-sm text-muted-foreground">Ürünü aktif veya pasif yapın</p>
            </div>
            <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <Button type="submit" className="w-full" disabled={loading || success}>
            {loading ? "Kaydediliyor..." : product ? "Güncelle" : "Ürün Ekle"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
