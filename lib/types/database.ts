export type UserType = "customer" | "seller"

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled"

export type ReturnStatus = "pending" | "approved" | "rejected"

export interface Profile {
  id: string
  username: string
  full_name: string
  user_type: UserType
  phone?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Store {
  id: string
  seller_id: string
  name: string
  description?: string
  logo_url?: string
  banner_url?: string
  is_active: boolean
  bank_account?: string // Added bank account field for payment transfers
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  store_id: string
  name: string
  description?: string
  price: number
  stock: number
  category: string
  images?: string[] // Made optional to handle cases where it might not exist yet
  is_active: boolean
  created_at: string
  updated_at: string
  store?: Store
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
  updated_at: string
  product?: Product
}

export interface Address {
  id: string
  user_id: string
  title: string
  full_name: string
  phone: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  customer_id: string
  total_amount: number
  status: OrderStatus
  shipping_address_id: string
  created_at: string
  updated_at: string
  shipping_address?: Address
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  created_at: string
  product?: Product
}

export interface Payment {
  id: string
  order_id: string
  amount: number
  payment_method: string
  status: string
  transaction_id?: string
  created_at: string
  updated_at: string
}

export interface ReturnRequest {
  id: string
  order_item_id: string
  reason: string
  status: ReturnStatus
  created_at: string
  updated_at: string
  order_item?: OrderItem
}
