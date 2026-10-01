"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import {
  Box,
  ArrowRight,
  Search,
  Sparkles,
  Eye,
  PackageOpen
} from "lucide-react";

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const storeIdFromUrl = urlParams.get("store");

      const storedStore = localStorage.getItem("store");
      const storeIdFromStorage = storedStore ? JSON.parse(storedStore).id : null;

      const finalStoreId = storeIdFromUrl || storeIdFromStorage;

      if (!finalStoreId) {
        setProducts([]);
        setLoading(false);
        return;
      }

      axios
        .get(`http://localhost:3333/api/products?storeId=${finalStoreId}`)
        .then((res) => {
          setProducts(res.data || []);
        })
        .catch((err) => {
          console.error("Erro na API de Produtos:", err);
          setProducts([]);
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (error) {
      console.error("Erro interno no carregamento da HomePage:", error);
      setProducts([]);
      setLoading(false);
    }
  }, []);

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = (p.name || "").toLowerCase().includes(term);
    const skuMatch = (p.sku || "").toLowerCase().includes(term);
    const descMatch = (p.description || "").toLowerCase().includes(term);
    return nameMatch || skuMatch || descMatch;
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-16">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Barra de Filtro e Contagem em Linha Direta */}
        {!loading && products.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar modelos ou SKU..."
                className="w-full text-xs border border-slate-200 rounded-xl pl-10 pr-3 py-2 bg-slate-50 focus:bg-white focus:outline-emerald-500 transition-all font-medium text-slate-800 placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 self-end sm:self-auto px-2">
              <Box className="w-4 h-4 text-slate-400" />
              <span>
                <strong className="text-slate-900">{filteredProducts.length}</strong> modelos disponíveis
              </span>
            </div>
          </div>
        )}

        {/* Grade de Produtos */}
        {loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center text-slate-400">
            <div className="w-9 h-9 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin mb-3" />
            <p className="text-xs font-bold">Carregando catálogo e malhas 3D...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-16 text-center max-w-lg mx-auto shadow-xs my-8 space-y-3">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <PackageOpen className="w-7 h-7 stroke-[1.5]" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Nenhum produto cadastrado nesta loja</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              O catálogo desta unidade está sendo preparado. Cadastre novos modelos no painel de administração.
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center max-w-md mx-auto shadow-xs">
            <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">Nenhum modelo encontrado para "{searchTerm}"</p>
            <button
              onClick={() => setSearchTerm("")}
              className="text-xs font-bold text-emerald-600 hover:underline mt-2 inline-block"
            >
              Limpar filtro de pesquisa
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Viewport 3D */}
                <div className="w-full h-52 bg-slate-950 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/80 via-slate-950 to-slate-950 opacity-80" />

                  {product.thumbnailUrl ? (
                    <img
                      src={product.thumbnailUrl}
                      alt={product.name}
                      className="w-full h-full object-contain p-4 relative z-10 group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 relative z-10">
                      <Box className="w-12 h-12 text-slate-600 stroke-[1.5]" />
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
                        Geometria 3D Nativa
                      </span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 z-20">
                    <span className="bg-slate-900/90 backdrop-blur-xs border border-slate-800 text-emerald-400 text-[10px] font-mono font-black px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                      <Eye className="w-3 h-3 text-emerald-400" /> 3D PRONTO
                    </span>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                        SKU: {product.sku || "PADRÃO"}
                      </span>
                      {product.estimatedTimeMin > 0 && (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                          {product.estimatedTimeMin} min fabril
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-black text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                      {product.name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {product.description || "Sem descrição técnica informada para esta peça."}
                    </p>
                  </div>

                  {/* Preço e Botão */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block tracking-wider">
                        A partir de
                      </span>
                      <span className="text-lg font-black text-emerald-600 font-mono tracking-tight">
                        R$ {Number(product.basePrice).toFixed(2)}
                      </span>
                    </div>

                    <Link
                      href={`/products/${product.id}`}
                      className="inline-flex items-center gap-2 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs active:scale-95"
                    >
                      Personalizar
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}