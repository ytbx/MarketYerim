"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Package } from "lucide-react"

interface CustomerReturnListProps {
	returnRequests: any[]
}

export function CustomerReturnList({ returnRequests: initial }: CustomerReturnListProps) {
	const [requests] = useState(initial)

	const getStatusColor = (status: string) => {
		switch (status) {
			case "pending":
				return "secondary"
			case "approved":
				return "default"
			case "rejected":
				return "destructive"
			default:
				return "secondary"
		}
	}

	const getStatusText = (status: string) => {
		switch (status) {
			case "pending":
				return "Beklemede"
			case "approved":
				return "Onaylandı"
			case "rejected":
				return "Reddedildi"
			default:
				return status
		}
	}

	if (!requests || requests.length === 0) {
		return (
			<Card>
				<CardContent className="p-12 text-center">
					<Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
					<p className="text-muted-foreground">Henüz iade talebiniz yok</p>
				</CardContent>
			</Card>
		)
	}

	return (
		<div className="space-y-4">
			{requests.map((req) => {
				const product = req.order_item?.product
				const order = req.order_item?.order
				const imageUrl = product?.images?.[0] || "/diverse-products-still-life.png"
				return (
					<Card key={req.id}>
						<CardHeader>
							<div className="flex items-start justify-between">
								<div>
									<CardTitle className="text-lg">İade #{req.id.slice(0, 8)}</CardTitle>
									<p className="text-sm text-muted-foreground mt-1">
										{new Date(req.created_at).toLocaleDateString("tr-TR", {
											year: "numeric",
											month: "long",
											day: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</p>
								</div>
								<Badge variant={getStatusColor(req.status)}>{getStatusText(req.status)}</Badge>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex gap-3 p-3 bg-muted rounded-lg">
								<div className="w-16 h-16 relative rounded-md overflow-hidden bg-background flex-shrink-0">
									<Image src={imageUrl} alt={product?.name || "Product"} fill className="object-cover" />
								</div>
								<div className="flex-1 min-w-0">
									<p className="font-medium line-clamp-1">{product?.name}</p>
									<p className="text-sm text-muted-foreground">Sebep: {req.reason}</p>
									<p className="text-sm">
										{req.order_item?.quantity} adet x {req.order_item?.price?.toFixed(2)} ₺
									</p>
								</div>
							</div>
							{order?.shipping_address && (
								<div className="p-3 bg-muted rounded-lg">
									<p className="font-semibold mb-1">Teslimat Adresi</p>
									<p className="text-sm text-muted-foreground">{order.shipping_address.title}</p>
								</div>
							)}
						</CardContent>
					</Card>
				)
			})}
		</div>
	)
}


