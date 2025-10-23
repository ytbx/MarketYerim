import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ReturnRequestList } from "@/components/return-request-list"

export default async function SellerReturnsPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?type=seller")
  }

  const { data: store } = await supabase.from("stores").select("*").eq("seller_id", user.id).single()

  if (!store) {
    redirect("/seller/store")
  }

  // First get return requests for this store's products
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

  // Filter return requests for this store's products
  const filteredRequests = returnRequests?.filter((request: any) => {
    return request.order_item?.product?.store?.id === store.id
  })

  // Fetch shipping addresses separately for each order
  const requestsWithAddresses = await Promise.all(
    (filteredRequests || []).map(async (request: any) => {
      if (request.order_item?.order?.shipping_address_id) {
        const { data: address } = await supabase
          .from("addresses")
          .select("*")
          .eq("id", request.order_item.order.shipping_address_id)
          .single()

        return {
          ...request,
          order_item: {
            ...request.order_item,
            order: {
              ...request.order_item.order,
              shipping_address: address,
            },
          },
        }
      }
      return request
    }),
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">İade Talepleri</h1>
        <ReturnRequestList returnRequests={requestsWithAddresses || []} />
      </div>
    </div>
  )
}
