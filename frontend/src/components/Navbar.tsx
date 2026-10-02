"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, Layers, LayoutDashboard, UserCircle, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const { cart } = useCart();

  const [store, setStore] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadStorageData = () => {
      const storedStore = localStorage.getItem("store");
      const storedUser = localStorage.getItem("user");

      if (storedStore) {
        try { setStore(JSON.parse(storedStore)); } catch (e) {}
      } else {
        setStore(null);
      }
      if (storedUser) {
        try { setUser(JSON.parse(storedUser)); } catch (e) {}
      } else {
        setUser(null);
      }
    };

    loadStorageData();
    window.addEventListener("storage-updated", loadStorageData);
    return () => window.removeEventListener("storage-updated", loadStorageData);
  }, []);

  const hiddenRoutes = [
    "/admin",
    "/cart", 
    "/products",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/linha-producao",
    "/producao",
  ];

  const isHidden = hiddenRoutes.some((route) => pathname?.startsWith(route));

  if (pathname === "/" || isHidden) {
    return null;
  }

  const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-50 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Identidade / Marca da Loja */}
        <Link href="/" className="flex items-center gap-3">
          {store?.logoUrl ? (
            <img 
              src={store.logoUrl} 
              alt={store.name || "Logo"} 
              className="h-9 max-w-[160px] object-contain" 
            />
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                <Layers className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="font-black text-sm text-slate-900 tracking-tight block leading-tight">
                  {store?.name || "Catálogo 3D"}
                </span>
                <span className="text-[9px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                  Portal Industrial
                </span>
              </div>
            </div>
          )}
        </Link>

        {/* Ações da Direita: Carrinho e Gestão */}
        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 text-slate-800 px-3.5 py-2 rounded-xl font-bold transition-all text-xs border border-slate-200/60"
          >
            <ShoppingCart className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Carrinho</span>
            {totalCount > 0 && (
              <span className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {totalCount}
              </span>
            )}
          </Link>

          {/* Atalho para o Painel Administrativo */}
          {user ? (
            <Link
              href="/admin"
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl font-bold transition-all text-xs shadow-xs"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Painel ERP</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors"
            >
              <span>Acessar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}