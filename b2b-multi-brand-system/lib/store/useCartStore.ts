import { create } from 'zustand';
import { CartItem, Product, UserRole } from '../types';

interface CartState {
  items: CartItem[];
  activeBrandId: string | null;
  addItem: (product: Product, role: UserRole, quantity?: number) => { success: boolean; message?: string };
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
  getTotalItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  activeBrandId: null,

  addItem: (product: Product, role: UserRole, quantity = 1) => {
    const { items, activeBrandId } = get();

    // Enforce single-brand order integrity: all items in an order belong to the same brand
    if (activeBrandId && activeBrandId !== product.brand_id && items.length > 0) {
      return {
        success: false,
        message: 'Your cart contains items from another brand. Please submit or clear your current order before adding items from a different brand.',
      };
    }

    // Determine unit price based on B2B role tier
    let unitPrice = product.dealer_price;
    if (role === 'distributor') {
      unitPrice = product.distributor_price;
    } else if (role === 'dealer') {
      unitPrice = product.dealer_price;
    } else {
      // Super admin or Management
      unitPrice = product.dealer_price || product.min_price;
    }

    const minQty = product.min_order_qty || 1;
    const addQty = Math.max(quantity, minQty);

    const existingIndex = items.findIndex((i) => i.product.id === product.id);

    if (existingIndex > -1) {
      const updatedItems = [...items];
      const newQty = updatedItems[existingIndex].quantity + addQty;
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: newQty,
        subtotal: newQty * unitPrice,
      };
      set({ items: updatedItems, activeBrandId: product.brand_id });
    } else {
      const newItem: CartItem = {
        product,
        quantity: addQty,
        unitPrice,
        subtotal: addQty * unitPrice,
      };
      set({ items: [...items, newItem], activeBrandId: product.brand_id });
    }

    return { success: true };
  },

  removeItem: (productId: string) => {
    const { items } = get();
    const updated = items.filter((i) => i.product.id !== productId);
    set({
      items: updated,
      activeBrandId: updated.length === 0 ? null : get().activeBrandId,
    });
  },

  updateQuantity: (productId: string, quantity: number) => {
    const { items } = get();
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    const updated = items.map((i) => {
      if (i.product.id === productId) {
        return {
          ...i,
          quantity,
          subtotal: quantity * i.unitPrice,
        };
      }
      return i;
    });

    set({ items: updated });
  },

  clearCart: () => {
    set({ items: [], activeBrandId: null });
  },

  getTotalAmount: () => {
    return get().items.reduce((sum, item) => sum + item.subtotal, 0);
  },

  getTotalItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
