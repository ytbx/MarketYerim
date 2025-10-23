import type { Store } from "@/lib/types/database"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StoreIcon, Package } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface StoreCardProps {
  store: Store & { products?: any[] }
}

export function StoreCard({ store }: StoreCardProps) {
  const logoUrl = store.logo_url || "/generic-store-logo.png"
  const productCount = store.products?.[0]?.count || 0

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-32 relative bg-gradient-to-br from-primary/10 to-primary/5">
        {store.banner_url && (
          <Image src={store.banner_url || "/placeholder.svg"} alt={store.name} fill className="object-cover" />
        )}
      </div>

      <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 relative rounded-lg overflow-hidden border-2 border-background shadow-md -mt-12 bg-white">
            <Image src={logoUrl || "/placeholder.svg"} alt={store.name} fill className="object-cover" />
          </div>
          <div className="flex-1 mt-2">
            <h3 className="font-bold text-lg line-clamp-1">{store.name}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Package className="h-3 w-3" />
              <span>{productCount} ürün</span>
            </div>
          </div>
        </div>

        {store.description && <p className="text-sm text-muted-foreground line-clamp-2">{store.description}</p>}
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <Button asChild className="w-full">
          <Link href={`/store/${store.id}`}>
            <StoreIcon className="h-4 w-4 mr-2" />
            Mağazayı Ziyaret Et
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
