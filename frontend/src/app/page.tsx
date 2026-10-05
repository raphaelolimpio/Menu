"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import api, { API_URL } from "@/services/api";
import {
  Layers,
  Box,
  Smartphone,
  ArrowRight,
  LogIn,
  UserPlus,
  Palette,
  BadgeCheck,
  PackageCheck,
  LayoutDashboard,
  PlusCircle,
} from "lucide-react";

function HomeContent() {
  const searchParams = useSearchParams();
  const storeParam = searchParams.get("store");

  const [activeStore, setActiveStore] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedStore = localStorage.getItem("store");

    if (storedUser) {
      try { setCurrentUser(JSON.parse(storedUser)); } catch (e) { }
    }

    let targetStoreId = storeParam;
    if (!targetStoreId && storedStore) {
      try {
        const parsedStore = JSON.parse(storedStore);
        targetStoreId = parsedStore.id;
        setActiveStore(parsedStore);
      } catch (e) { }
    }

    if (targetStoreId) {
      fetchStoreProducts(targetStoreId);
    } else {
      setLoading(false);
    }
  }, [storeParam]);

  const fetchStoreProducts = async (storeId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/products?storeId=${storeId}`);
      setProducts(res.data || []);
    } catch (err) {
      console.error("Erro ao carregar catálogo:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // 1. VISUALIZAÇÃO: VITRINE DA LOJA (COM PRODUTOS OU VAZIA)
  if (activeStore || storeParam) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-400 selection:text-slate-950">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-black text-white block leading-tight">
                  {activeStore?.name || "Catálogo 3D"}
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider">
                  VITRINE DIGITAL
                </span>
              </div>
            </div>

            {currentUser && (
              <Link
                href="/admin"
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-xs"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Painel ERP</span>
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
          {loading ? (
            <div className="py-24 text-center flex flex-col items-center justify-center text-slate-400">
              <div className="w-8 h-8 border-3 border-white/20 border-t-emerald-400 rounded-full animate-spin mb-3" />
              <p className="text-xs font-bold">Carregando catálogo 3D...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-900 border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/40 transition-all"
                >
                  <div>
                    <h3 className="font-bold text-white text-base">{p.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-emerald-400 font-black text-lg">
                      R$ {Number(p.basePrice || 0).toFixed(2)}
                    </span>
                    <Link
                      href={`/produto/${p.id}`}
                      className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg text-xs"
                    >
                      Ver em 3D
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500 mb-4">
                <Box className="w-8 h-8 text-slate-500" />
              </div>
              <h2 className="text-lg font-bold text-white">Nenhum produto cadastrado ainda</h2>
              <p className="text-xs text-slate-400 max-w-sm mt-1 mb-6">
                Esta vitrine está pronta. Cadastre seus modelos 3D e produtos pelo painel de controle para que apareçam aqui.
              </p>
              {currentUser?.role === "OWNER" && (
                <Link
                  href="/admin?tab=products"
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Cadastrar Produtos no Admin</span>
                </Link>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  // 2. VISUALIZAÇÃO: LANDING PAGE GENÉRICA
  return (
    <div className="min-h-screen overflow-y-auto bg-slate-950 text-slate-100 selection:bg-emerald-400 selection:text-slate-950">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex min-h-11 items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
              <Layers className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-extrabold tracking-tight text-white">Catálogo 3D</span>
              <span className="block text-[11px] text-slate-400">Produtos em detalhe</span>
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            <a
              href="/register"
              className="flex min-h-11 items-center gap-2 rounded-xl bg-emerald-400 px-3.5 text-sm font-extrabold text-slate-950 transition hover:bg-emerald-300 sm:px-4"
            >
              <UserPlus className="h-4 w-4" />
              <span>Criar conta</span>
            </a>
            <a
              href="/login"
              className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 text-sm font-bold text-white transition hover:border-emerald-300/30 hover:bg-white/10 sm:px-4"
            >
              <LogIn className="h-4 w-4 text-emerald-300" />
              <span>Entrar</span>
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:min-h-[620px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-20">
          <div className="pointer-events-none absolute -left-40 top-10 h-80 w-80 rounded-full bg-emerald-500/10 blur-[100px]" />
          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-3.5 py-2 text-sm font-semibold text-emerald-200">
              <Smartphone className="h-4 w-4" />
              Funciona direto no telemóvel
            </div>
            <h1 className="max-w-2xl text-[2.6rem] font-black leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.65rem]">
              Veja cada detalhe.
              <span className="mt-1 block bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
                Escolha com confiança.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Explore os produtos em 3D, experimente os acabamentos e monte o seu pedido — sem instalar nenhuma aplicação.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/register"
                className="flex min-h-14 items-center justify-center gap-2.5 rounded-2xl bg-emerald-400 px-6 text-base font-extrabold text-slate-950 shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-300"
              >
                Criar Minha Loja
                <ArrowRight className="h-5 w-5" />
              </a>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-emerald-300" />
                Sem instalar app
              </span>
              <span className="inline-flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-emerald-300" />
                Visualização 3D
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative rounded-[2rem] border border-white/10 bg-slate-900/90 p-5 shadow-2xl sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Uma compra mais segura</p>
                  <p className="mt-1 text-sm text-slate-400">Do primeiro olhar ao pedido</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                  <Box className="h-5 w-5" />
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-pulse mb-3">
            <Layers className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-xs font-mono text-slate-400">A carregar...</p>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}