"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  Scissors,
  Flame,
  Paintbrush,
  Hammer,
  CheckCheck,
  Layers,
  ArrowLeft,
  Activity,
  Timer,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  Bell
} from "lucide-react";

const DEFAULT_NOTIFICATIONS = [
  {
    id: "1",
    title: "Nova Ordem de Produção",
    desc: "Pedido aguardando corte no chão de fábrica.",
    time: "Há 10 min",
    read: false,
  },
  {
    id: "2",
    title: "Etapa de Manufatura Concluída",
    desc: "Um lote foi concluído e está pronto para expedição.",
    time: "Há 45 min",
    read: false,
  },
  {
    id: "3",
    title: "Proposta Aprovada",
    desc: "Cliente aprovou o orçamento 3D via link público.",
    time: "Há 2 horas",
    read: true,
  },
];

const STEPS = [
  {
    key: "CORTE",
    stepNumber: "01",
    label: "Corte de Perfis & Chapas",
    icon: Scissors,
    color: "text-amber-500",
    activeBg: "border-amber-500/80 bg-amber-500/10 text-amber-900"
  },
  {
    key: "SOLDA",
    stepNumber: "02",
    label: "Solda & Estruturação",
    icon: Flame,
    color: "text-orange-500",
    activeBg: "border-orange-500/80 bg-orange-500/10 text-orange-900"
  },
  {
    key: "PINTURA",
    stepNumber: "03",
    label: "Pintura Eletrostática",
    icon: Paintbrush,
    color: "text-purple-500",
    activeBg: "border-purple-500/80 bg-purple-500/10 text-purple-900"
  },
  {
    key: "MONTAGEM",
    stepNumber: "04",
    label: "Montagem & Tapeçaria",
    icon: Hammer,
    color: "text-blue-500",
    activeBg: "border-blue-500/80 bg-blue-500/10 text-blue-900"
  },
  {
    key: "PRONTO_ENTREGA",
    stepNumber: "05",
    label: "Pronto para Expedição",
    icon: CheckCheck,
    color: "text-emerald-500",
    activeBg: "border-emerald-500/80 bg-emerald-500/10 text-emerald-900"
  },
];

export default function LinhaProducaoPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const orderId = params?.id as string;
  const storeId = searchParams.get("storeId") || "";

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Estados de Notificação Sincronizada
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Sincronização Global das Notificações
  useEffect(() => {
    const syncNotifications = () => {
      const stored = localStorage.getItem("system_notifications");
      if (stored) {
        try {
          setNotifications(JSON.parse(stored));
        } catch {
          setNotifications(DEFAULT_NOTIFICATIONS);
        }
      } else {
        localStorage.setItem("system_notifications", JSON.stringify(DEFAULT_NOTIFICATIONS));
      }
    };

    syncNotifications();
    window.addEventListener("notifications-updated", syncNotifications);
    window.addEventListener("storage", syncNotifications);

    return () => {
      window.removeEventListener("notifications-updated", syncNotifications);
      window.removeEventListener("storage", syncNotifications);
    };
  }, []);

  // Fechar popover ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllNotificationsAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem("system_notifications", JSON.stringify(updated));
    window.dispatchEvent(new Event("notifications-updated"));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadOrder = () => {
    setLoading(true);
    axios
      .get(`http://localhost:3333/api/orders/${orderId}/producao?storeId=${storeId}`)
      .then((res) => setOrder(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (orderId) loadOrder();
  }, [orderId, storeId]);

  const handleUpdateStep = async (step: string) => {
    setUpdating(true);
    try {
      await axios.patch(`http://localhost:3333/api/orders/${orderId}/etapa-producao`, {
        productionStep: step,
        storeId,
      });

      // Dispara automaticamente uma nova notificação em tempo real para todo o sistema
      const stepObj = STEPS.find((s) => s.key === step);
      const newNotif = {
        id: String(Date.now()),
        title: `Fase Atualizada: PED-${String(orderId).padStart(4, "0")}`,
        desc: `Avançado para a fase de ${stepObj?.label || step}.`,
        time: "Agora",
        read: false,
      };

      const stored = localStorage.getItem("system_notifications");
      let currentList = stored ? JSON.parse(stored) : DEFAULT_NOTIFICATIONS;
      currentList = [newNotif, ...currentList.filter((n: any) => n.id !== newNotif.id)];
      localStorage.setItem("system_notifications", JSON.stringify(currentList));
      window.dispatchEvent(new Event("notifications-updated"));

      loadOrder();
    } catch (err: any) {
      alert("Erro ao salvar etapa: " + (err.response?.data?.error || err.message));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-slate-800 border-t-emerald-500 rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-400">Sincronizando ordem de produção com a fábrica...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white border border-rose-200 p-8 rounded-2xl shadow-xs max-w-md w-full text-center">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">Ordem de Produção Não Localizada</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Verifique o código da ordem ou o vínculo com a loja fabril informada.
          </p>
          <button
            onClick={() => router.push("/admin")}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
          >
            Voltar ao Painel Geral
          </button>
        </div>
      </div>
    );
  }

  const currentStepIndex = STEPS.findIndex((s) => s.key === order.productionStep);

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-16">
      
      {/* Barra Superior / Header de Terminal MES */}
      <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin")}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="Voltar ao Painel Geral"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar ao ERP</span>
          </button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-slate-400 font-bold block leading-none">
                TERMINAL DE FÁBRICA • MES
              </span>
              <span className="text-xs font-black text-slate-900">Catálogo 3D PCP</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-slate-600 hidden sm:inline-block">
              CONECTADO AO CHÃO DE FÁBRICA
            </span>
          </div>

          {/* SINO DE NOTIFICAÇÕES SINCRONIZADO */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
              title="Notificações do sistema"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white ring-1 ring-rose-500" />
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 duration-150">
                <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Notificações Fabris
                    </span>
                    {unreadCount > 0 && (
                      <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.2 rounded-full">
                        {unreadCount} novas
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsAsRead}
                      className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Marcar lidas
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 flex gap-3 transition-colors ${
                        n.read ? "bg-white" : "bg-emerald-50/20"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          n.read ? "bg-slate-300" : "bg-emerald-500"
                        }`}
                      />
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">{n.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.desc}</p>
                        <span className="text-[9px] font-mono text-slate-400 mt-1 block">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">

        {/* CARTÃO MASTER DA ORDEM (ESTILO INDUSTRIAL SLATE-950) */}
        <div className="bg-slate-950 text-white p-6 rounded-2xl border border-slate-900 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest uppercase bg-slate-900 text-slate-400 border border-slate-800 px-2.5 py-0.5 rounded-md">
                  Linha de Produção Ativa
                </span>
                {order.createdAt && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-black font-mono tracking-tight text-white mt-2">
                PED-{String(order.id).padStart(4, "0")}
              </h1>

              <p className="text-xs text-slate-400 mt-1">
                Cliente / Destino: <strong className="text-slate-200">{order.customer?.name || "Consumidor Geral"}</strong>
                {order.customer?.responsibleArea ? ` (${order.customer.responsibleArea})` : ""}
              </p>
            </div>

            {/* Status Fabril em Destaque */}
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex flex-col sm:items-end justify-center shrink-0">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Fase de Execução Atual
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-sm font-black text-emerald-400 font-mono">
                  {order.productionStep || "AGUARDANDO INÍCIO"}
                </span>
              </div>
            </div>
          </div>

          {/* Barra de Progresso Fabril das Etapas */}
          <div className="mt-6 pt-5 border-t border-slate-900/90 grid grid-cols-5 gap-1.5">
            {STEPS.map((step, idx) => {
              const isPassed = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div key={step.key} className="space-y-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isCurrent
                        ? "bg-emerald-400 shadow-xs shadow-emerald-500/50"
                        : isPassed
                          ? "bg-emerald-600/70"
                          : "bg-slate-800"
                    }`}
                  />
                  <span
                    className={`text-[9px] font-mono block truncate ${
                      isCurrent ? "text-emerald-400 font-bold" : isPassed ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    {step.stepNumber}. {step.key}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ESPECIFICAÇÕES 3D E PEÇAS DA ORDEM */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-600" />
              Especificações Técnicas dos Itens ({order.items?.length || 0})
            </h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Acabamentos 3D
            </span>
          </div>

          <div className="space-y-2.5">
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
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">
                        {item.product?.name || "Peça Industrial Padrão"}
                      </h3>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                        SKU: {item.product?.sku || "N/A"}
                      </p>
                    </div>

                    <span className="text-xs font-black bg-slate-900 text-white px-3 py-1 rounded-lg shrink-0 font-mono shadow-2xs">
                      {item.quantity} un.
                    </span>
                  </div>

                  {/* Configuração de Cores por Grupo */}
                  {Object.keys(config).length > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                      {Object.entries(config)
                        .filter(([k]) => k !== "[object Object]" && !k.startsWith("Body") && !k.startsWith("body"))
                        .map(([part, color]) => (
                          <div
                            key={part}
                            className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-[11px]"
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-slate-300 shadow-2xs block"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-slate-700 font-bold capitalize">{part}:</span>
                            <span className="font-mono text-[10px] text-slate-400">{color}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTÕES DE TRANSIÇÃO DE ETAPA (CONTROLE MES) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              Atualizar Fase do Processo Fabril
            </h2>
            {updating && (
              <span className="text-[10px] font-bold text-emerald-600 animate-pulse">
                Sincronizando etapa...
              </span>
            )}
          </div>

          <div className="space-y-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isCurrent = order.productionStep === step.key;

              return (
                <button
                  key={step.key}
                  disabled={updating}
                  onClick={() => handleUpdateStep(step.key)}
                  className={`w-full p-4 rounded-2xl border-2 font-bold text-xs flex items-center justify-between transition-all active:scale-[0.99] disabled:opacity-50 ${
                    isCurrent
                      ? "border-emerald-600 bg-emerald-500/10 text-emerald-950 shadow-sm"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isCurrent
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-500"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="text-left">
                      <span className="text-[10px] font-mono text-slate-400 block font-semibold leading-tight">
                        ETAPA {step.stepNumber}
                      </span>
                      <span className={`text-xs font-black ${isCurrent ? "text-emerald-950" : "text-slate-800"}`}>
                        {step.label}
                      </span>
                    </div>
                  </div>

                  {isCurrent ? (
                    <span className="text-[10px] bg-emerald-600 text-white px-2.5 py-1 rounded-full font-black tracking-wide flex items-center gap-1 shadow-2xs">
                      <Check className="w-3 h-3 stroke-[3]" /> EM ANDAMENTO
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-slate-600">
                      Mudar para esta
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}