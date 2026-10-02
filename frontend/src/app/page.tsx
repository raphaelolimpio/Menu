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
  LogIn
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeParam = searchParams.get("store");

  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [hasDirectStore, setHasDirectStore] = useState(false);

  useEffect(() => {
    // 1. Verificação de sessão persistida no aparelho
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

    // 2. Se houver parâmetro de loja direta no link
    if (storeParam) {
      setHasDirectStore(true);
    }

    setIsLoadingSession(false);
  }, [router, storeParam]);

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-pulse mb-3">
          <Layers className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-xs font-mono text-slate-400">A carregar catálogo 3D...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* CABEÇALHO */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-black tracking-wider uppercase text-white block leading-none">
              Catálogo 3D
            </span>
            <span className="text-[10px] text-slate-500 font-mono tracking-widest font-semibold uppercase">
              Plataforma Interativa
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2.5 rounded-xl transition-all"
          >
            <LogIn className="w-4 h-4 text-emerald-400" />
            <span>Aceder</span>
          </Link>
        </div>
      </header>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 lg:py-20 flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* LADO ESQUERDO: Apresentação */}
        <div className="flex-1 text-center lg:text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Visualização 3D e Emissão de Pedidos</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Configure os seus produtos em tempo real com <span className="text-emerald-400">interação 3D</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Permita que os seus clientes explorem acabamentos, texturas e geometrias diretamente no telemóvel ou no navegador antes de fechar orçamentos e propostas.
          </p>

          {/* BOTÕES DE AÇÃO */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider px-7 py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Store className="w-4 h-4" />
              <span>Criar Conta para a Minha Loja</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/cart"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-bold text-xs px-6 py-4 rounded-xl transition-all"
            >
              <ShoppingBag className="w-4 h-4 text-slate-400" />
              <span>Ver Carrinho Atual</span>
            </Link>
          </div>
        </div>

        {/* LADO DIREITO: Cartão Visual Mobile & Desktop */}
        <div className="w-full max-w-md lg:max-w-md flex flex-col gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden shadow-2xl">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Modelos Industriais</h3>
                  <p className="text-xs text-slate-400">Carregamento ultrarrápido em formato GLB</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Compatível com Telemóveis</h3>
                  <p className="text-xs text-slate-400">Gire, amplie e configure sem instalar aplicações</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Acesso Persistente</h3>
                  <p className="text-xs text-slate-400">Mantenha o seu dispositivo ligado sem pedir credenciais constantes</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/80">
              <Link
                href="/login"
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors"
              >
                <span>Já possui acesso da loja?</span>
                <ChevronRight className="w-4 h-4 text-emerald-400" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* RODAPÉ */}
      <footer className="w-full border-t border-slate-900 py-6 text-center text-xs text-slate-600 font-medium">
        Catálogo 3D &bull; Sistema de Apresentação e Encomendas Comerciais
      </footer>
    </div>
  );
}