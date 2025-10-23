"use client"

import { useState } from "react"
import type { Address } from "@/lib/types/database"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Edit, Trash2, Plus } from "lucide-react"
import { AddressDialog } from "@/components/address-dialog"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface AddressListProps {
  addresses: Address[]
}

export function AddressList({ addresses: initialAddresses }: AddressListProps) {
  const [addresses, setAddresses] = useState(initialAddresses)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | undefined>()
  const [loading, setLoading] = useState<string | null>(null)

  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const handleDelete = async (id: string) => {
    setLoading(id)
    try {
      await supabase.from("addresses").delete().eq("id", id)
      setAddresses(addresses.filter((a) => a.id !== id))
      router.refresh()
    } catch (error) {
      console.error("Error deleting address:", error)
    } finally {
      setLoading(null)
    }
  }

  const handleEdit = (address: Address) => {
    setEditingAddress(address)
    setDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditingAddress(undefined)
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => setDialogOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Yeni Adres Ekle
      </Button>

      {addresses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Henüz kayıtlı adresiniz yok</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{address.title}</span>
                    {address.is_default && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Varsayılan</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(address)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(address.id)}
                      disabled={loading === address.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    {address.full_name} - {address.phone}
                  </p>
                  <p>
                    {address.address_line1}
                    {address.address_line2 && `, ${address.address_line2}`}
                  </p>
                  <p>
                    {address.city}, {address.state} {address.postal_code}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddressDialog open={dialogOpen} onOpenChange={handleDialogClose} address={editingAddress} />
    </div>
  )
}
