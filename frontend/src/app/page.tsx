"use client";

import React, { useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
} from "lucide-react";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeParam = searchParams.get("store");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      try {
        const parsed = JSON.parse(storedUser);
        
      } catch (e) {
        console.error("Erro ao validar sessão persistida", e);
      }
    }

  }, [router, storeParam]);

  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-slate-100 selection:bg-emerald-400 selection:text-slate-950">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex min-h-11 items-center gap-3" aria-label="Catálogo 3D, página inicial">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
              <Layers className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-extrabold tracking-tight text-white">Catálogo 3D</span>
              <span className="block text-[11px] text-slate-400">Produtos em detalhe</span>
            </span>
          </Link>

          <nav aria-label="Navegação principal" className="flex items-center gap-2">
            <Link
              href="/register"
              className="flex min-h-11 items-center gap-2 rounded-xl bg-emerald-400 px-3.5 text-sm font-extrabold text-slate-950 transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/30 sm:px-4"
            >
              <UserPlus className="h-4 w-4" />
              <span>Criar conta</span>
            </Link>
            <Link
              href="/login"
              className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 text-sm font-bold text-white transition hover:border-emerald-300/30 hover:bg-white/10 sm:px-4"
            >
              <LogIn className="h-4 w-4 text-emerald-300" />
              <span>Entrar</span>
            </Link>
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
                href="#como-funciona"
                className="flex min-h-14 items-center justify-center gap-2.5 rounded-2xl bg-emerald-400 px-6 text-base font-extrabold text-slate-950 shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/30"
              >
                Conhecer o catálogo
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
            <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-emerald-400/15 via-teal-400/5 to-transparent blur-2xl" />
            <div className="relative rounded-[2rem] border border-white/10 bg-slate-900/90 p-5 shadow-2xl shadow-black/30 sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Uma compra mais segura</p>
                  <p className="mt-1 text-sm text-slate-400">Do primeiro olhar ao pedido</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                  <Box className="h-5 w-5" />
                </span>
              </div>

              <div className="mt-6 rounded-2xl border border-white/[0.07] bg-slate-950/70 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                    <Box className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">Produto em 3D</p>
                    <p className="mt-0.5 text-sm text-slate-400">Gire e observe de todos os lados</p>
                  </div>
                </div>
                <div className="my-4 ml-5 h-5 border-l border-dashed border-emerald-300/30" />
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-300/10 text-teal-200">
                    <Palette className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">Acabamento à sua escolha</p>
                    <p className="mt-0.5 text-sm text-slate-400">Veja as opções disponíveis</p>
                  </div>
                </div>
                <div className="my-4 ml-5 h-5 border-l border-dashed border-emerald-300/30" />
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-300/10 text-sky-200">
                    <PackageCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">Pedido simples</p>
                    <p className="mt-0.5 text-sm text-slate-400">Reúna os produtos no carrinho</p>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-center text-sm text-slate-400">
                A experiência funciona no navegador do seu telemóvel.
              </p>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="scroll-mt-24 border-t border-white/[0.07] bg-slate-900/50">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-300">Simples assim</p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                O produto certo, ao seu ritmo.
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-300">
                Não precisa de conhecimentos técnicos. Abra o produto que recebeu, explore as opções e envie o seu pedido.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
              {[
                { number: "01", title: "Explore", description: "Abra o produto e veja o modelo em 3D.", icon: Box },
                { number: "02", title: "Personalize", description: "Escolha entre os acabamentos disponíveis.", icon: Palette },
                { number: "03", title: "Peça", description: "Envie o seu pedido de forma simples e prática.", icon: PackageCheck },
              ].map((step) => (
                <article key={step.number} className="rounded-2xl border border-white/[0.08] bg-slate-950/50 p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold tracking-widest text-emerald-300">{step.number}</span>
                    <step.icon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-6xl px-4 py-6 text-sm text-slate-400 sm:px-6">
          <span>Catálogo 3D · Produtos em detalhe</span>
        </div>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-pulse mb-3">
          <Layers className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-xs font-mono text-slate-400">A carregar...</p>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}