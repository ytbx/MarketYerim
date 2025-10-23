import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CustomerReturnList } from "@/components/customer-return-list"

export default async function CustomerReturnsPage() {
	const supabase = await getSupabaseServerClient()

	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		redirect("/auth/login")
	}

	// Fetch user's return requests
	const { data: returnRequests } = await supabase
		.from("return_requests")
		.select(
			`
			*,
			order_item:order_items(
				*,
				product:products(
					*,
					store:stores(id, name)
				),
				order:orders(*)
			)
			`,
		)
		.order("created_at", { ascending: false })

	// Attach shipping addresses
	const withAddresses = await Promise.all(
		(returnRequests || []).map(async (req: any) => {
			const addressId = req?.order_item?.order?.shipping_address_id
			if (!addressId) return req
			const { data: address } = await supabase.from("addresses").select("*").eq("id", addressId).single()
			return {
				...req,
				order_item: {
					...req.order_item,
					order: {
						...req.order_item?.order,
						shipping_address: address,
					},
				},
			}
		}),
	)

	return (
		<div className="min-h-screen bg-background">
			<div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<h1 className="text-3xl font-bold mb-8">İadelerim</h1>
				<CustomerReturnList returnRequests={withAddresses || []} />
			</div>
		</div>
	)
}


