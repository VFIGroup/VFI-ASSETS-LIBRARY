import { supabase } from '../supabase';
import { CartItem, Order, OrderStatus, UserRole } from '../types';

export const ordersApi = {
  createOrder: async ({
    brandId,
    items,
    notes,
    shippingAddress,
    userRole,
  }: {
    brandId: string;
    items: CartItem[];
    notes?: string;
    shippingAddress: any;
    userRole: UserRole;
  }) => {
    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) throw new Error('Authentication required to place an order');

    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    // 1. Insert parent order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        brand_id: brandId,
        placed_by_user_id: userAuth.user.id,
        user_role_at_order: userRole,
        total_amount: totalAmount,
        status: 'pending_approval',
        notes: notes || null,
        shipping_address: shippingAddress,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Insert order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.subtotal,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

    if (itemsError) {
      console.error('[OrdersApi] Error inserting items:', itemsError);
      throw itemsError;
    }

    return order;
  },

  fetchOrders: async (filters?: { brandId?: string; status?: OrderStatus }) => {
    let query = supabase
      .from('orders')
      .select(
        `
        *,
        brand:brands(id, name, code, logo_url),
        placed_by:profiles!orders_placed_by_user_id_fkey(id, full_name, email, company_name, role),
        order_items(
          id,
          quantity,
          unit_price,
          subtotal,
          product:products(id, name, sku, image_url)
        )
      `
      )
      .order('created_at', { ascending: false });

    if (filters?.brandId && filters.brandId !== 'ALL') {
      query = query.eq('brand_id', filters.brandId);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as Order[];
  },

  fetchOrderById: async (orderId: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        brand:brands(id, name, code, logo_url),
        placed_by:profiles!orders_placed_by_user_id_fkey(id, full_name, email, company_name, role, phone),
        order_items(
          id,
          quantity,
          unit_price,
          subtotal,
          product:products(id, name, sku, image_url, description)
        )
      `
      )
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data as unknown as Order;
  },

  stage1ApproveOrder: async (orderId: string, remarks: string) => {
    const { data: userAuth } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'stage1_approved',
        stage1_approved_by: userAuth.user?.id || null,
        stage1_remarks: remarks || 'Stage-1 Verified: Pricing and allocation approved.',
        approved_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  stage1RejectOrder: async (orderId: string, remarks: string) => {
    const { data: userAuth } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'rejected',
        stage1_approved_by: userAuth.user?.id || null,
        stage1_remarks: remarks || 'Rejected during Stage-1 review.',
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateFulfillmentStatus: async (
    orderId: string,
    status: 'confirmed' | 'dispatched' | 'delivered',
    trackingNumber?: string
  ) => {
    const updates: any = { status };
    if (trackingNumber) {
      updates.tracking_number = trackingNumber;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
