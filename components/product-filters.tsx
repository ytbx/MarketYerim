"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ProductFiltersProps {
  categories: string[]
  currentCategory: string
  currentSearch: string
}

export function ProductFilters({ categories, currentCategory, currentSearch }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchInput, setSearchInput] = useState(currentSearch)

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (category === currentCategory) {
      params.delete("category")
    } else {
      params.set("category", category)
    }
    params.delete("page")
    router.push(`/?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchInput) {
      params.set("search", searchInput)
    } else {
      params.delete("search")
    }
    params.delete("page")
    router.push(`/?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearchInput("")
    router.push("/")
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Ürün ara..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit">Ara</Button>
        {(currentCategory || currentSearch) && (
          <Button type="button" variant="outline" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Temizle
          </Button>
        )}
      </form>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-muted-foreground self-center">Kategoriler:</span>
          {categories.map((category) => (
            <Badge
              key={category}
              variant={currentCategory === category ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/90"
              onClick={() => handleCategoryClick(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
