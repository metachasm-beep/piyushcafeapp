// ============================================================
// Shared TypeScript type definitions for the Restaurant PWA
// ============================================================

export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  upi_id: string | null;
  razorpay_key_id: string | null;
  stripe_account_id: string | null;
  currency: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Table = {
  id: string;
  restaurant_id: string;
  table_number: number;
  display_name: string | null;
  capacity: number;
  qr_code_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MenuCategory = {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  icon_emoji: string;
  sort_order: number;
  is_active: boolean;
};

export type DietaryTag = 'veg' | 'vegan' | 'gluten_free' | 'contains_nuts' | 'dairy_free' | 'spicy';

export type MenuItem = {
  id: string;
  category_id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  dietary_tags: DietaryTag[];
  preparation_time: number | null;
  happy_hour_discount?: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type MenuItemVariation = {
  id: string;
  menu_item_id: string;
  name: string;
  extra_price: number;
  sort_order: number;
  created_at: string;
};

export type MenuItemAddon = {
  id: string;
  menu_item_id: string;
  name: string;
  extra_price: number;
  sort_order: number;
  created_at: string;
};

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';

export type Order = {
  id: string;
  restaurant_id: string;
  table_id: string;
  status: OrderStatus;
  total_amount: number;
  payment_method: string | null;
  payment_status: 'unpaid' | 'paid' | 'refunded';
  payment_reference: string | null;
  platform_fee: number;
  restaurant_amount: number;
  customer_session: string | null;
  special_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields (from queries)
  table?: Table;
  order_items?: OrderItemWithMenuItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  variation_name: string | null;
  variation_price: number;
  addons: { name: string; price: number }[];
  special_instructions: string | null;
  created_at: string;
};

export type OrderItemWithMenuItem = OrderItem & {
  menu_item: MenuItem;
};

export type WaiterRequest = {
  id: string;
  restaurant_id: string;
  table_id: string;
  order_id: string | null;
  status: 'pending' | 'acknowledged' | 'resolved';
  message: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
  // Joined
  table?: Table;
};

export type CustomerFeedback = {
  id: string;
  restaurant_id: string;
  table_id: string;
  order_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type CartItem = {
  menu_item: MenuItem;
  quantity: number;
  variation?: MenuItemVariation | null;
  addons: MenuItemAddon[];
  special_instructions: string;
};

// Razorpay types (partial – for checkout integration)
export type RazorpayOptions = {
  key: string;
  amount: number; // in paise (1 INR = 100 paise)
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: { color: string };
  handler: (response: RazorpayResponse) => void;
};

export type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
};

// KDS column type
export type KDSColumn = {
  status: OrderStatus;
  label: string;
  color: string;
  bgClass: string;
};
