"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, Layers } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { cart } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Define as rotas onde a Navbar Global NÃO deve aparecer
  const hiddenRoutes = [
    "/admin",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/linha-producao",
    "/producao",
  ];

  const isHidden = hiddenRoutes.some((route) => pathname?.startsWith(route));

  // 2. Se estiver na raiz "/" (Landing Page/Vitrine) ou nas rotas acima, a Navbar desaparece
  if (pathname === "/" || isHidden) {
    return null;
  }

  // 3. Renderiza a Navbar apenas no Catálogo Público (ex: /products) e Carrinho (/cart)
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
            <Layers className="w-5 h-5" />
          </div>
          <span className="font-black text-slate-900 tracking-tight uppercase">Catálogo 3D</span>
        </Link>

        <nav className="flex items-center gap-5">
          <Link 
            href="/" 
            className="text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors"
          >
            Início
          </Link>

          <Link 
            href="/cart" 
            className="relative p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            {mounted && cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                {cart.length}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}