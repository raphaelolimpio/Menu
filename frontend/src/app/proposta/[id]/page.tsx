"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import api, { API_URL } from "@/services/api";
import {
  CheckCircle2,
  Clock,
  FileText,
  Layers,
  ShieldCheck,
  Check,
  AlertCircle,
  Building2,
  Calendar,
  Sparkles
} from "lucide-react";



export default function PropostaPublicaPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    api
      .get(`/api/orders/${id}/publico`)
      .then((res) => setOrder(res.data))
      .catch((err) => console.error("Erro ao carregar proposta pública:", err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await api.patch(`/api/orders/${id}/aprovar-orcamento`);

      // Registra a aprovação na lista global de notificações sincronizadas
      const orderYear = new Date(order.createdAt).getFullYear() || 2026;
      const orderFormattedCode = `PED-${orderYear}-${String(order.orderNumber || order.id).padStart(4, "0")}`;
      
      const newNotif = {
        id: String(Date.now()),
        title: `Proposta Aprovada: ${orderFormattedCode}`,
        desc: `O cliente ${order.customer?.name || "Consumidor"} aprovou a proposta comercial online.`,
        time: "Agora",
        read: false,
      };

      try {
        const stored = localStorage.getItem("system_notifications");
        let currentList = stored ? JSON.parse(stored) : [];
        currentList = [newNotif, ...currentList.filter((n: any) => n.id !== newNotif.id)];
        localStorage.setItem("system_notifications", JSON.stringify(currentList));
        window.dispatchEvent(new Event("notifications-updated"));
      } catch (e) {
        console.error("Erro ao sincronizar notificação local:", e);
      }

      alert("Proposta aprovada com sucesso! Em breve a nossa equipe entrará em contato com a chave de faturamento.");
      window.location.reload();
    } catch (err) {
      alert("Erro ao aprovar proposta comercial.");
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-slate-800 border-t-emerald-500 rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-400">Carregando proposta comercial...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white border border-rose-200 p-8 rounded-2xl shadow-xs max-w-md w-full text-center">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">Proposta Não Encontrada</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            O link acessado pode estar incorreto ou a proposta comercial expirou.
          </p>
        </div>
      </div>
    );
  }

  const orderYear = new Date(order.createdAt).getFullYear() || 2026;
  const orderFormattedCode = `PED-${orderYear}-${String(order.orderNumber || order.id).padStart(4, "0")}`;
  const isApproved = order.status !== "QUOTE";

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col justify-between py-10 px-4 selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Container Principal */}
      <main className="max-w-2xl w-full mx-auto space-y-6">
        
        {/* Marca & Cabeçalho da Proposta */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 mx-auto shadow-2xs">
            <FileText className="w-5 h-5" />
          </div>
          
          <div className="inline-flex items-center gap-1.5 bg-slate-200/80 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Documento Comercial Verificado</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Proposta Comercial
          </h1>
          
          <p className="text-xs font-mono font-bold text-slate-500">
            {orderFormattedCode} • Cliente: <strong className="text-slate-800">{order.customer?.name || "Consumidor"}</strong>
            {order.customer?.responsibleArea ? ` (${order.customer.responsibleArea})` : ""}
          </p>
        </div>

        {/* Card Master de Conteúdo */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          
          {/* Status Geral da Proposta */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block tracking-wider">
                Status da Proposta
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isApproved ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                <span className="text-xs font-black text-slate-800">
                  {isApproved ? "APROVADA PELO CLIENTE" : "AGUARDANDO APROVAÇÃO"}
                </span>
              </div>
            </div>

            {order.createdAt && (
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block tracking-wider">
                  Data de Emissão
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
            )}
          </div>

          {/* Lista de Itens */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Itens & Especificações do Projeto ({order.items?.length || 0})
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                Configuração 3D
              </span>
            </div>

            <div className="space-y-3">
              {order.items?.map((item: any, idx: number) => {
                let config: Record<string, string> = {};
                try {
                  config = typeof item.configuration === "string" ? JSON.parse(item.configuration) : item.configuration || {};
                } catch {
                  config = {};
                }

                return (
                  <div
                    key={item.id || idx}
                    className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all"
                  >
                    <div className="flex items-start gap-3.5">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt="Thumbnail"
                          className="w-12 h-12 rounded-xl bg-slate-900 object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                          <Layers className="w-5 h-5" />
                        </div>
                      )}

                      <div>
                        <h4 className="text-xs font-black text-slate-900">
                          {item.product?.name || item.productName || "Item Personalizado"}
                        </h4>
                        
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Quantidade: <strong className="text-slate-800">{item.quantity} un.</strong>
                        </p>

                        {/* Cores dos Grupos Customizáveis */}
                        {Object.keys(config).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {Object.entries(config)
                              .filter(([k]) => k !== "[object Object]" && !k.startsWith("Body") && !k.startsWith("body"))
                              .map(([part, color]) => (
                                <div
                                  key={part}
                                  className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[10px]"
                                >
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-slate-300 block shadow-2xs"
                                    style={{ backgroundColor: color as string }}
                                  />
                                  <span className="text-slate-700 font-bold capitalize">{part}</span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right sm:self-center shrink-0">
                      <span className="text-sm font-black text-slate-900 font-mono">
                        R$ {Number(item.totalPrice || item.quantity * item.unitPrice).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bloco Financeiro e Ação de Aprovação */}
          <div className="border-t border-slate-100 pt-6 space-y-5">
            <div className="flex justify-between items-end bg-slate-50 p-4.5 rounded-2xl border border-slate-200/70">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block font-mono">
                  Investimento Total Consolidado
                </span>
                <span className="text-xs text-slate-500">Valores com condições comerciais aplicadas</span>
              </div>
              <span className="text-3xl font-black text-emerald-600 tracking-tight font-mono">
                R$ {Number(order.totalAmount || 0).toFixed(2)}
              </span>
            </div>

            {!isApproved ? (
              <button
                type="button"
                onClick={handleApprove}
                disabled={approving}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold p-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs text-xs disabled:opacity-50 active:scale-[0.99]"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {approving ? "Processando e Notificando Equipe..." : "Aprovar Orçamento e Avançar Pedido"}
              </button>
            ) : (
              <div className="w-full bg-emerald-50 text-emerald-900 p-4 rounded-xl flex items-center justify-between border border-emerald-200 text-xs shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Proposta Comercial Já Aprovada!</span>
                    <span className="text-[11px] text-emerald-700">A equipe fabril foi notificada para prosseguir com o lote.</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black">
                  Validado
                </span>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Rodapé Corporativo */}
      <footer className="text-center space-y-1 pt-8">
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <div className="w-4 h-4 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
            <Layers className="w-2.5 h-2.5" />
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            Catálogo 3D <span className="font-mono text-slate-500">• SISTEMA ERP</span>
          </span>
        </div>
      </footer>

    </div>
  );
}