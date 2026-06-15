import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ordersAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart]           = useState({ items: [], total_price: 0, total_items: 0 });
  const [cartLoading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) { setCart({ items: [], total_price: 0, total_items: 0 }); return; }
    setLoading(true);
    try {
      const { data } = await ordersAPI.getCart();
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  // Добавить товар — оптимистично обновляем UI, потом синхронизируем
  const addToCart = useCallback(async (product, quantity = 1) => {
    // Оптимистичное обновление
    setCart((prev) => {
      const existing = prev.items.find((i) => i.product.id === product.id);
      const items = existing
        ? prev.items.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + quantity }
              : i
          )
        : [...prev.items, { id: Date.now(), product, quantity }];
      return {
        ...prev,
        items,
        total_items: prev.total_items + quantity,
        total_price: Number(prev.total_price) + Number(product.discounted_price) * quantity,
      };
    });

    try {
      const { data } = await ordersAPI.addToCart({ product_id: product.id, quantity });
      setCart(data);
    } catch (err) {
      // Откат при ошибке
      await fetchCart();
      throw err;
    }
  }, [fetchCart]);

  const removeFromCart = useCallback(async (itemId) => {
    // Оптимистичное удаление
    setCart((prev) => {
      const item = prev.items.find((i) => i.id === itemId);
      return {
        ...prev,
        items: prev.items.filter((i) => i.id !== itemId),
        total_items: prev.total_items - (item?.quantity || 0),
        total_price: Number(prev.total_price) - Number(item?.product?.discounted_price || 0) * (item?.quantity || 0),
      };
    });
    try {
      const { data } = await ordersAPI.removeCartItem(itemId);
      setCart(data);
    } catch {
      await fetchCart();
    }
  }, [fetchCart]);

  const updateQuantity = useCallback(async (itemId, quantity) => {
    try {
      const { data } = await ordersAPI.updateCartItem(itemId, quantity);
      setCart(data);
    } catch {
      await fetchCart();
    }
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    setCart({ items: [], total_price: 0, total_items: 0 });
    try {
      const { data } = await ordersAPI.clearCart();
      setCart(data);
    } catch {
      await fetchCart();
    }
  }, [fetchCart]);

  return (
    <CartContext.Provider value={{
      cart, cartLoading, fetchCart,
      addToCart, removeFromCart, updateQuantity, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
