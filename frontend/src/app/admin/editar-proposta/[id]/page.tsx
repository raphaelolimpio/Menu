"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useCart } from "@/context/CartContext";
import {
  ArrowLeft,
  Trash2,
  Save,
  Tag,
  Minus,
  Plus,
  Layers,
  LayoutDashboard,
  Clock,
  History,
  DollarSign,
  Users,
  Activity,
  Menu,
  X,
  LogOut,
  Bell,
  ChevronDown,
  Palette,
  FileText,
  CheckCircle2,
  AlertCircle,
  Box,
  ShoppingCart,
  CheckCheck,
  Building2,
  Shield,
  User
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

export default function EditarPropostaPage() {
  const { id } = useParams();
  const router = useRouter();
  const { cart } = useCart();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [store, setStore] = useState<any>(null);

  // Estados locais da proposta
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [openPalette, setOpenPalette] = useState<string | null>(null);

  // Estados dos Pop-ups do Header
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Notificações com Sincronização Global
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedStore = localStorage.getItem("store");

    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {}
    }

    if (storedStore) {
      try {
        setStore(JSON.parse(storedStore));
      } catch {}
    }

    // Busca os dados da proposta atual
    axios
      .get(`http://localhost:3333/api/orders/${id}/publico`)
      .then((res) => {
        setOrder(res.data);
        setItems(res.data.items || []);
        setDiscountAmount(res.data.discountAmount || 0);
      })
      .catch((err) => {
        console.error("Erro ao carregar proposta:", err);
        alert("Erro ao carregar proposta.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Sincroniza notificações via localStorage e eventos globais
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

  // Fechar pop-ups ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (confirm("Deseja realmente sair da sua conta?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("store");
      window.dispatchEvent(new Event("storage-updated"));
      router.push("/login");
    }
  };

  const markAllNotificationsAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem("system_notifications", JSON.stringify(updated));
    window.dispatchEvent(new Event("notifications-updated"));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleRemoveItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleUpdateColor = (itemId: string, part: string, newColor: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const currentConfig =
            typeof item.configuration === "string"
              ? JSON.parse(item.configuration)
              : item.configuration;

          const updatedConfig = { ...currentConfig, [part]: newColor };

          return { ...item, configuration: updatedConfig };
        }
        return item;
      })
    );
  };

  const subtotal = items.reduce((acc, curr) => acc + curr.quantity * curr.unitPrice, 0);
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        items,
        discountAmount,
        totalAmount: finalTotal,
      };

      await axios.patch(`http://localhost:3333/api/orders/${id}/editar`, payload);

      // Dispara notificação no ecossistema
      const orderYear = new Date(order.createdAt).getFullYear() || 2026;
      const orderFormattedCode = `PED-${orderYear}-${String(order.orderNumber || order.id).padStart(4, "0")}`;
      const newNotif = {
        id: String(Date.now()),
        title: `Proposta Atualizada: ${orderFormattedCode}`,
        desc: `Itens ou condições comerciais da proposta foram reajustados.`,
        time: "Agora",
        read: false,
      };

      try {
        const stored = localStorage.getItem("system_notifications");
        let currentList = stored ? JSON.parse(stored) : DEFAULT_NOTIFICATIONS;
        currentList = [newNotif, ...currentList.filter((n: any) => n.id !== newNotif.id)];
        localStorage.setItem("system_notifications", JSON.stringify(currentList));
        window.dispatchEvent(new Event("notifications-updated"));
      } catch (e) {
        console.error("Erro ao sincronizar notificação local:", e);
      }

      alert("Proposta atualizada com sucesso!");
      router.push("/admin");
    } catch (err) {
      console.error("Erro ao atualizar proposta:", err);
      alert("Erro ao atualizar proposta.");
    } finally {
      setSaving(false);
    }
  };

  const navMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "production", label: "Produção & PCP", icon: Activity, role: "OWNER", badge: "Owner" },
    { id: "orders", label: "Fila de Pedidos", icon: Clock },
    { id: "products", label: "Gerenciar Produtos", icon: Layers, role: "OWNER", badge: "Owner" },
    { id: "history", label: "Histórico de Vendas", icon: History },
    { id: "commissions", label: currentUser?.role === "OWNER" ? "Comissões" : "Minhas Comissões", icon: DollarSign },
    { id: "contacts", label: "Clientes", icon: Users },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-sm font-bold text-slate-400 animate-pulse">
          Carregando dados da proposta...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-6 font-sans">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Proposta não encontrada</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">O pedido solicitado não pôde ser carregado.</p>
        <button
          onClick={() => router.push("/admin")}
          className="bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          Voltar ao Painel Geral
        </button>
      </div>
    );
  }

  const orderYear = new Date(order.createdAt).getFullYear() || 2026;
  const orderFormattedCode = `PED-${orderYear}-${String(order.orderNumber || order.id).padStart(4, "0")}`;

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* OVERLAY MOBILE PARA SIDEBAR */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR PADRÃO ERP */}
      <aside
        className={`fixed lg:static top-0 left-0 h-full w-64 bg-slate-950 text-slate-300 z-50 flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo e Nome do Sistema na Sidebar */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-900 bg-slate-950">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white tracking-wider uppercase">Catálogo 3D</h2>
                <p className="text-[10px] text-slate-500 font-mono tracking-widest font-semibold">SISTEMA ERP</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menus Principais */}
          <nav className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 block mb-2 mt-2">
              Menu Principal
            </span>

            {navMenuItems.map((item) => {
              if (item.role && currentUser?.role !== item.role) return null;
              const Icon = item.icon;
              const isOrders = item.id === "orders";

              return (
                <button
                  key={item.id}
                  onClick={() => router.push("/admin")}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                    isOrders
                      ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/10"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isOrders ? "text-slate-950" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}

            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 block pt-5 pb-2">
              Ações Rápidas
            </span>

            <Link
              href="/cart"
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-900 hover:text-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-4 h-4 text-slate-400" />
                <span>Carrinho</span>
              </div>
              {cart.length > 0 && (
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {cart.length}
                </span>
              )}
            </Link>

            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 block pt-5 pb-2">
              Configurações
            </span>

            <Link
              href="/admin/profile"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-900 hover:text-slate-100 transition-colors"
            >
              <Users className="w-4 h-4 text-slate-400" /> Minha Equipe & Loja
            </Link>
          </nav>
        </div>

        {/* Informações do Usuário no Rodapé da Sidebar */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/70">
          <div className="flex items-center gap-3 px-1 mb-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs overflow-hidden">
              {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                currentUser?.name?.charAt(0) || "U"
              )}
            </div>
            <div className="flex-1 overflow-hidden leading-tight">
              <span className="text-xs font-bold text-white block truncate">{currentUser?.name || "Usuário"}</span>
              <span className="text-[10px] text-slate-500 block truncate">
                {currentUser?.role === "OWNER" ? "Proprietário" : "Vendedor"}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 py-2 rounded-xl text-xs font-bold transition-all border border-slate-800 hover:border-rose-900/50"
          >
            <LogOut className="w-3.5 h-3.5" /> Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* PAINEL PRINCIPAL DE CONTEÚDO */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* CABEÇALHO SUPERIOR PADRONIZADO */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 shadow-2xs">
          
          {/* LADO ESQUERDO: HAMBÚRGUER + LOGOMARCA */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              {store?.logoUrl ? (
                <img
                  src={store.logoUrl}
                  alt={store.name || "Logo"}
                  className="h-8 max-w-[140px] sm:max-w-[170px] object-contain rounded-md"
                />
              ) : (
                <span className="text-xs font-black text-slate-900 tracking-tight uppercase">
                  {store?.name || "Catálogo 3D"}
                </span>
              )}
            </div>
          </div>

          {/* LADO DIREITO: ÍCONES RÁPIDOS + NOTIFICAÇÕES + AVATAR POP-UP */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Ícone: Abrir Catálogo 3D */}
            <Link
              href="/"
              title="Ver Catálogo 3D"
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-600 transition-colors shadow-2xs"
            >
              <Box className="w-4 h-4" />
            </Link>

            {/* Ícone: Carrinho com Badge Dinâmico */}
            <Link
              href="/cart"
              title="Ver Carrinho de Compras"
              className="relative p-2 sm:p-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-600 transition-colors shadow-2xs"
            >
              <ShoppingCart className="w-4 h-4" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white text-[10px] font-black w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {cart.length}
                </span>
              )}
            </Link>

            <div className="h-6 w-px bg-slate-200 mx-0.5 hidden sm:block" />

            {/* SINO DE NOTIFICAÇÕES SINCRONIZADO */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setIsProfileOpen(false);
                }}
                className="relative p-2 sm:p-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
                title="Notificações da fábrica"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white ring-1 ring-rose-500" />
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

            {/* AVATAR COM POP-UP DETALHADO */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotifOpen(false);
                }}
                className="flex items-center gap-1.5 p-1 pl-1.5 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-2xs"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs overflow-hidden">
                  {currentUser?.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    currentUser?.name?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
              </button>

              {/* POP-UP DO USUÁRIO */}
              {isProfileOpen && currentUser && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 duration-150">
                  <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0 overflow-hidden">
                      {currentUser?.avatarUrl ? (
                        <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        currentUser?.name?.charAt(0).toUpperCase() || "U"
                      )}
                    </div>
                    <div className="overflow-hidden leading-tight">
                      <span className="text-xs font-black text-slate-900 block truncate">
                        {currentUser?.name}
                      </span>
                      <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                        {currentUser?.email}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.2 rounded-md mt-1.5">
                        <Shield className="w-2.5 h-2.5" />
                        {currentUser?.role === "OWNER" ? "Proprietário" : "Vendedor"}
                      </span>
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-white border-b border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Loja Vinculada
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {store?.name || "Unidade Fabril"}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 space-y-1 bg-white">
                    <Link
                      href="/admin/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      <span>Meu Perfil & Loja</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Encerrar Sessão</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Sub-Cabeçalho com Detalhes da Ordem */}
        <div className="px-6 sm:px-8 pt-6 pb-2 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors mr-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Painel
              </Link>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">EDITAR PROPOSTA COMERCIAL</h1>
              <span className="text-xs font-bold font-mono bg-slate-900 text-white px-2.5 py-0.5 rounded-md">
                {orderFormattedCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Cliente: <strong className="text-slate-800">{order.customer?.name}</strong> • Ajuste quantidades, cores dos componentes ou aplique descontos diretos.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || items.length === 0}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors disabled:opacity-50 self-start sm:self-auto"
          >
            <Save className="w-4 h-4" />
            {saving ? "Salvando Alterações..." : "Salvar Proposta"}
          </button>
        </div>

        {/* Área Rolável de Conteúdo */}
        <main className="flex-1 overflow-y-auto px-6 sm:px-8 py-4">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Lado Esquerdo: Lista de Itens do Pedido */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    Itens e Configurações 3D ({items.length})
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Personalização por peça
                  </span>
                </div>

                {items.length === 0 ? (
                  <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center">
                    <FileText className="w-8 h-8 opacity-40 mb-2" />
                    <p className="text-xs font-bold">Nenhum item restou na proposta.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {items.map((item) => {
                      const config =
                        typeof item.configuration === "string"
                          ? JSON.parse(item.configuration)
                          : item.configuration || {};

                      return (
                        <div
                          key={item.id}
                          className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-50/40 transition-colors"
                        >
                          <div className="space-y-3">
                            <div>
                              <h3 className="text-sm font-bold text-slate-900">{item.product?.name}</h3>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                SKU: {item.product?.sku || "PADRÃO"}
                              </p>
                            </div>

                            {/* Controles de Quantidade */}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                  className="p-2 hover:bg-slate-100 text-slate-600 transition-colors"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="px-3 text-xs font-bold text-slate-900 border-x border-slate-200 min-w-[36px] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                  className="p-2 hover:bg-slate-100 text-slate-600 transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <span className="text-xs font-medium text-slate-400 font-mono">
                                × R$ {Number(item.unitPrice).toFixed(2)}
                              </span>
                            </div>

                            {/* Controles de Cores Permitidas por Grupo */}
                            <div className="flex items-center gap-2 flex-wrap pt-1">
                              {Object.entries(config)
                                .filter(
                                  ([k]) =>
                                    k !== "[object Object]" &&
                                    !k.startsWith("Body") &&
                                    !k.startsWith("body")
                                )
                                .map(([part, color]: any) => {
                                  let productGroups = [];
                                  if (item.product?.customizableParts) {
                                    try {
                                      productGroups =
                                        typeof item.product.customizableParts === "string"
                                          ? JSON.parse(item.product.customizableParts)
                                          : item.product.customizableParts;
                                    } catch (e) {
                                      productGroups = [];
                                    }
                                  }

                                  const targetGroup = productGroups.find(
                                    (g: any) => g.name.toLowerCase() === part.toLowerCase()
                                  );

                                  const allowedColors = targetGroup?.availableColors || [];
                                  const paletteId = `${item.id}-${part}`;
                                  const isPaletteOpen = openPalette === paletteId;

                                  return (
                                    <div
                                      key={part}
                                      className="relative flex items-center text-[11px] text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 shadow-2xs"
                                    >
                                      <button
                                        type="button"
                                        onClick={() => setOpenPalette(isPaletteOpen ? null : paletteId)}
                                        className="flex items-center gap-1.5 cursor-pointer"
                                        title={`Alterar cor da parte: ${part}`}
                                      >
                                        <span
                                          className="w-3 h-3 rounded-full border border-slate-300 block shadow-2xs"
                                          style={{ backgroundColor: color }}
                                        />
                                        <span className="capitalize font-semibold">{part}</span>
                                      </button>

                                      {/* Popover da Paleta */}
                                      {isPaletteOpen && (
                                        <>
                                          <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setOpenPalette(null)}
                                          />

                                          <div className="absolute top-full mt-2 left-0 bg-white border border-slate-200 shadow-xl rounded-2xl p-3 z-50 flex flex-col gap-2 min-w-[160px] animate-in fade-in-50 duration-150">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">
                                              Cores do Modelo
                                            </span>

                                            {allowedColors.length > 0 ? (
                                              <div className="flex flex-wrap gap-2 mt-1">
                                                {allowedColors.map((allowedColor: string) => (
                                                  <button
                                                    key={allowedColor}
                                                    type="button"
                                                    onClick={() => {
                                                      handleUpdateColor(item.id, part, allowedColor);
                                                      setOpenPalette(null);
                                                    }}
                                                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-125 shadow-2xs ${
                                                      color === allowedColor
                                                        ? "border-slate-900 scale-110 ring-2 ring-emerald-500/40"
                                                        : "border-slate-200"
                                                    }`}
                                                    style={{ backgroundColor: allowedColor }}
                                                    title={allowedColor}
                                                  />
                                                ))}
                                              </div>
                                            ) : (
                                              <p className="text-[10px] text-rose-500 font-semibold">
                                                Sem cores extras vinculadas.
                                              </p>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>

                          {/* Subtotal do Item e Exclusão */}
                          <div className="flex items-center sm:flex-col sm:items-end justify-between gap-3 shrink-0">
                            <span className="text-base font-black text-slate-900 font-mono">
                              R$ {(item.quantity * item.unitPrice).toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100"
                              title="Remover item da proposta"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Lado Direito: Resumo Financeiro e Fechamento */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6 sticky top-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Resumo Financeiro da Proposta
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Valores calculados em tempo real</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Subtotal Bruto ({items.reduce((acc, i) => acc + i.quantity, 0)} itens):</span>
                    <span className="font-bold text-slate-800 font-mono">R$ {subtotal.toFixed(2)}</span>
                  </div>

                  {/* Input de Desconto Global */}
                  <div className="pt-3 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" /> Desconto Concedido (R$):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={subtotal}
                      value={discountAmount || ""}
                      onChange={(e) => setDiscountAmount(Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full text-sm border border-slate-200 rounded-xl p-3 font-black text-rose-600 bg-slate-50 focus:bg-white focus:outline-emerald-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider font-mono">
                      Valor Final Líquido
                    </span>
                    <span className="text-2xl font-black text-emerald-600 tracking-tight font-mono">
                      R$ {finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || items.length === 0}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2 text-xs shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Salvando Alterações..." : "Confirmar & Salvar Alterações"}
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}