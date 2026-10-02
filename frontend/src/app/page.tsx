"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Layers,
  Box,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Store,
  ChevronRight,
  LogIn,
  QrCode,
  MessageCircle,
  Eye,
  CheckCircle2
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeParam = searchParams.get("store");

  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [activeFinish, setActiveFinish] = useState("#0f172a");

  // Cores de teste interativo no preview
  const demoFinishes = [
    { label: "Grafite Industrial", color: "#0f172a" },
    { label: "Dourado Nobre", color: "#d97706" },
    { label: "Verde Esmeralda", color: "#059669" },
    { label: "Alumínio Polido", color: "#64748b" },
  ];

  useEffect(() => {
    // 1. Auto-login persistido no aparelho
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      try {
        const parsed = JSON.parse(storedUser);
        if (["OWNER", "SELLER", "ADMIN"].includes(parsed.role)) {
          router.replace("/admin");
          return;
        }
      } catch (e) {
        console.error("Erro ao validar sessão persistida", e);
      }
    }

    // 2. Se houver link direto da loja no URL (ex: ?store=xyz)
    if (storeParam) {
      // Redireciona para o catálogo com filtro da loja se aplicável
    }

    setIsLoadingSession(false);
  }, [router, storeParam]);

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-pulse mb-3">
          <Layers className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-xs font-mono text-slate-400">A carregar plataforma 3D...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* CABEÇALHO RESPONSIVO */}
      <header className="w-full max-w-7xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between border-b border-slate-900 sticky top-0 bg-slate-950/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-black tracking-wider uppercase text-white block leading-none">
              Catálogo 3D
            </span>
            <span className="text-[10px] text-slate-500 font-mono tracking-widest font-semibold uppercase">
              Portal Interativo & ERP
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/cart"
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition flex items-center gap-1.5 text-xs font-semibold"
            title="Ver Carrinho"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Carrinho</span>
          </Link>

          <Link
            href="/login"
            className="flex items-center gap-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <LogIn className="w-4 h-4 text-emerald-400" />
            <span>Aceder</span>
          </Link>
        </div>
      </header>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 max-w-7xl mx-auto px-5 sm:px-8 py-10 lg:py-16 flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* LADO ESQUERDO: Apresentação & Ação Rápida */}
        <div className="flex-1 text-center lg:text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tecnologia 3D sem necessidade de instalar App</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
            Apresente os seus produtos em <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">3D Real</span> no telemóvel do cliente
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Permita que clientes e revendedores girem, inspecionem acabamentos e emitam propostas completas com QR Code PIX e WhatsApp direto do navegador.
          </p>

          {/* BOTÕES DE AÇÃO MOBILE-FIRST */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3.5 pt-2">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider px-7 py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Store className="w-4 h-4" />
              <span>Criar Conta da Minha Loja</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/cart"
              className="flex items-center justify-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-bold text-xs px-6 py-4 rounded-xl transition-all"
            >
              <Eye className="w-4 h-4 text-slate-400" />
              <span>Ver Demonstração do Carrinho</span>
            </Link>
          </div>

          {/* MINI BADGES DE CONFIANÇA */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Modelos GLB Leves</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Fecho via WhatsApp</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 col-span-2 sm:col-span-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Cobrança por PIX</span>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: Simulação Interativa (Desktop e Mobile) */}
        <div className="w-full max-w-md lg:max-w-lg flex flex-col gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 backdrop-blur-md relative overflow-hidden shadow-2xl">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Cabeçalho do Card Simulado */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-[11px] font-mono text-slate-500 ml-2">preview_interativo.glb</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Tempo Real
              </span>
            </div>

            {/* Caixa Visual de Interação */}
            <div
              className="w-full h-48 rounded-2xl border border-slate-800 flex flex-col items-center justify-center p-6 text-center transition-colors duration-500 relative overflow-hidden"
              style={{
                background: `radial-gradient(circle at center, ${activeFinish}33, #020617 80%)`
              }}
            >
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 border border-white/10"
                style={{ backgroundColor: activeFinish }}
              >
                <Box className="w-10 h-10 text-white drop-shadow-md animate-pulse" />
              </div>
              <p className="text-xs font-semibold text-slate-300 mt-3">
                Simulador de Textura & Geometria
              </p>
              <span className="text-[10px] text-slate-500 font-mono">
                Toque nos acabamentos abaixo para alterar
              </span>
            </div>

            {/* Seletores Interativos de Cor */}
            <div className="mt-4 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Acabamentos Disponíveis
              </span>
              <div className="grid grid-cols-2 gap-2">
                {demoFinishes.map((item) => (
                  <button
                    key={item.color}
                    type="button"
                    onClick={() => setActiveFinish(item.color)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-left border text-xs font-medium transition-all ${
                      activeFinish === item.color
                        ? "border-emerald-500 bg-emerald-500/10 text-white"
                        : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate text-[11px]">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Link Direto para Login da Loja */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <Link
                href="/login"
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs font-bold text-slate-200 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Entrar com conta existente no telemóvel</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* RODAPÉ */}
      <footer className="w-full border-t border-slate-900 py-6 text-center text-xs text-slate-600 font-medium">
        Catálogo 3D &bull; Visualizador de Produtos e Sistema ERP Multi-Lojas
      </footer>
    </div>
  );
}