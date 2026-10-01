"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartVariation {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  configuration: Record<string, string>;
  model3dUrl: string;
  thumbnail?: string | null; 
}

interface CartContextType {
  cart: CartVariation[];
  addToCart: (items: CartVariation[]) => void;
  removeFromCart: (variationId: string) => void;
  removeByProduct: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartVariation[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("@catalogo3d:cart");
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar carrinho do storage", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("@catalogo3d:cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (newItems: CartVariation[]) => {
    setCart((prev) => [...prev, ...newItems]);
  };

  const removeFromCart = (variationId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== variationId));
  };

  const removeByProduct = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, removeByProduct, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart deve ser usado dentro de CartProvider");
  return context;
}

