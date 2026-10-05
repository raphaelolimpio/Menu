"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import api, { API_URL } from "@/services/api";
import {
  Copy,
  Users,
  ArrowLeft,
  Palette,
  Store as StoreIcon,
  Save,
  Camera,
  Upload,
  UserCircle,
  Menu,
  X,
  LogOut,
  Bell,
  ChevronDown,
  Layers,
  LayoutDashboard,
  Clock,
  History,
  DollarSign,
  Activity,
  Check,
  Search,
  Box,
  ShoppingCart,
  CheckCheck,
  Building2,
  Shield,
  User,
  Settings,
  UserCheck,
  UserX,
} from "lucide-react";

export default function ProfileAndTeamPage() {
  const router = useRouter();
  const { cart } = useCart();

  const [user, setUser] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modal de Edição da Loja
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [storeDisplayName, setStoreDisplayName] = useState("");
  const [storeBrandColor, setStoreBrandColor] = useState("#0F172A");
  const [storePhone, setStorePhone] = useState("");
  const [storeGreeting, setStoreGreeting] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Filtro de Vendedores
  const [sellerSearch, setSellerSearch] = useState("");

  // Pop-ups do Cabeçalho
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedStore = localStorage.getItem("store");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch { }

    if (storedStore) {
      try {
        const parsedStore = JSON.parse(storedStore);
        setStore(parsedStore);
        setStoreDisplayName(parsedStore.name || "");
        setStoreBrandColor(parsedStore.themeColor || "#0F172A");
        setStorePhone(parsedStore.phone || "");
        setStoreGreeting(parsedStore.greeting || "");
        loadTeam(parsedStore.id);
      } catch {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const loadRealNotifications = async () => {
      try {
        const storedStore = localStorage.getItem("store");
        const storeId = storedStore ? JSON.parse(storedStore).id : "";
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await api.get(`/api/orders?storeId=${storeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const orders = res.data || [];
        if (orders.length === 0) {
          setNotifications([]);
          return;
        }

        const storageKey = storeId ? `read_notifications_${storeId}` : "read_notifications_ids";
        const readIds: string[] = JSON.parse(localStorage.getItem(storageKey) || "[]");

        const dynamic = orders.slice(0, 8).map((o: any) => {
          const year = new Date(o.createdAt).getFullYear() || 2026;
          const orderCode = `PED-${year}-${String(o.id).padStart(4, "0")}`;
          const notifId = `order-${o.id}-${o.productionStep || o.status}`;
          const isRead = readIds.includes(notifId);

          let title = `Novo Pedido Emitido: ${orderCode}`;
          let desc = `Cliente ${o.customer?.name || "Consumidor"} — R$ ${Number(o.totalAmount || 0).toFixed(2)}`;

          if (o.productionStep === "PRONTO_ENTREGA") {
            title = `Ordem Concluída: ${orderCode}`;
            desc = "Lote pronto para expedição e entrega ao cliente.";
          } else if (o.productionStep && o.productionStep !== "AGUARDANDO") {
            title = `Em Produção: ${orderCode}`;
            desc = `Peça em etapa fabril: ${o.productionStep}.`;
          }

          const orderDate = new Date(o.createdAt);
          const timeFormatted = orderDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

          return {
            id: notifId,
            title,
            desc,
            time: `${orderDate.toLocaleDateString("pt-BR")} às ${timeFormatted}`,
            read: isRead,
          };
        });

        setNotifications(dynamic);
      } catch {
        setNotifications([]);
      }
    };

    loadRealNotifications();
    window.addEventListener("notifications-updated", loadRealNotifications);
    return () => window.removeEventListener("notifications-updated", loadRealNotifications);
  }, []);

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

  const loadTeam = async (storeId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/api/auth/team/${storeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeam(res.data || []);
    } catch (error) {
      console.error("Erro ao carregar equipe:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleUpdateSeller = async (
    sellerId: string,
    status: string,
    commissionPercent?: number,
    maxDiscountPercent?: number
  ) => {
    try {
      const token = localStorage.getItem("token");
      await api.patch(
        `/api/team/${sellerId}`,
        { status, commissionPercent, maxDiscountPercent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (store?.id) loadTeam(store.id);
    } catch (err: any) {
      alert("Erro ao atualizar vendedor: " + (err.response?.data?.error || err.message));
    }
  };

  const handleUploadImage = async (type: "avatar" | "logo", file: File) => {
    if (!file) return;
    if (type === "logo" && user?.role !== "OWNER") {
      alert("Apenas o proprietário da loja pode alterar a logomarca.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const uploadRes = await api.post("/api/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      const imageUrl = uploadRes.data.url;

      if (type === "avatar") {
        await api.patch(`/api/users/${user.id}`, { avatarUrl: imageUrl }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const updatedUser = { ...user, avatarUrl: imageUrl };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        window.dispatchEvent(new Event("storage-updated"));
        alert("Foto de perfil atualizada!");
      } else {
        await api.patch(`/api/stores/${store.id}`, { logoUrl: imageUrl }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const updatedStore = { ...store, logoUrl: imageUrl };
        localStorage.setItem("store", JSON.stringify(updatedStore));
        setStore(updatedStore);
        window.dispatchEvent(new Event("storage-updated"));
        alert("Logomarca atualizada!");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar a imagem.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveStoreCustomization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || user?.role !== "OWNER") return;

    try {
      const token = localStorage.getItem("token");
      const payload = {
        name: storeDisplayName,
        themeColor: storeBrandColor,
        phone: storePhone,
        greeting: storeGreeting,
      };

      await api.patch(`/api/stores/${store.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedStore = { ...store, ...payload };
      localStorage.setItem("store", JSON.stringify(updatedStore));
      setStore(updatedStore);
      window.dispatchEvent(new Event("storage-updated"));

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsStoreModalOpen(false);
      }, 1000);
    } catch {
      alert("Erro ao salvar configurações da loja.");
    }
  };

  const navMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "production", label: "Produção & PCP", icon: Activity, role: "OWNER", badge: "Owner" },
    { id: "orders", label: "Fila de Pedidos", icon: Clock },
    { id: "products", label: "Gerenciar Produtos", icon: Layers, role: "OWNER", badge: "Owner" },
    { id: "history", label: "Histórico de Vendas", icon: History },
    { id: "commissions", label: user?.role === "OWNER" ? "Comissões" : "Minhas Comissões", icon: DollarSign },
    { id: "contacts", label: "Clientes", icon: Users },
  ];

  const filteredTeam = team.filter((member) => {
    const term = sellerSearch.toLowerCase();
    const nameMatch = (member.name || "").toLowerCase().includes(term);
    const emailMatch = (member.email || "").toLowerCase().includes(term);
    return nameMatch || emailMatch;
  });

  const activeSellersCount = team.filter((m) => m.status === "ACTIVE").length;
  const pendingSellersCount = team.filter((m) => m.status === "PENDING" || m.status === "PENDING_APPROVAL").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-sm font-bold text-slate-400 animate-pulse">
          Carregando informações da equipe...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed lg:static top-0 left-0 h-full w-64 bg-slate-950 text-slate-300 z-50 flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
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

          <nav className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 block mb-2 mt-2">
              Menu Principal
            </span>

            {navMenuItems.map((item) => {
              if (item.role && user?.role !== item.role) return null;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => router.push(`/admin?tab=${item.id}`)}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}

            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 block pt-5 pb-2">
              Configurações
            </span>

            <div className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-black bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10">
              <Users className="w-4 h-4 text-slate-950" /> Minha Equipe & Loja
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-900 bg-slate-950/70">
          <div className="flex items-center gap-3 px-1 mb-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || "U"
              )}
            </div>
            <div className="flex-1 overflow-hidden leading-tight">
              <span className="text-xs font-bold text-white block truncate">{user?.name || "Usuário"}</span>
              <span className="text-[10px] text-slate-500 block truncate">
                {user?.role === "OWNER" ? "Proprietário" : "Vendedor"}
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

      {/* ÁREA DE CONTEÚDO */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* CABEÇALHO SUPERIOR */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 tracking-tight uppercase">
                {store?.name || "Catálogo 3D"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={store?.id ? `/?store=${store.id}` : "/"}
              title="Ver Catálogo 3D"
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-600 transition-colors shadow-2xs"
            >
              <Box className="w-4 h-4" />
            </Link>

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

            {/* NOTIFICAÇÕES */}
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
                    {notifications.length === 0 ? (
                      <p className="p-6 text-center text-xs text-slate-400">Nenhuma notificação no momento.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3.5 flex gap-3 transition-colors ${n.read ? "bg-white" : "bg-emerald-50/20"
                            }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? "bg-slate-300" : "bg-emerald-500"
                              }`}
                          />
                          <div className="flex-1">
                            <h4 className="text-xs font-bold text-slate-900 leading-snug">{n.title}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.desc}</p>
                            <span className="text-[9px] font-mono text-slate-400 mt-1 block">{n.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* PERFIL AVATAR */}
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
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
              </button>

              {isProfileOpen && user && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 duration-150">
                  <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0 overflow-hidden">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        user?.name?.charAt(0).toUpperCase() || "U"
                      )}
                    </div>
                    <div className="overflow-hidden leading-tight">
                      <span className="text-xs font-black text-slate-900 block truncate">
                        {user?.name}
                      </span>
                      <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                        {user?.email}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.2 rounded-md mt-1.5">
                        <Shield className="w-2.5 h-2.5" />
                        {user?.role === "OWNER" ? "Proprietário" : "Vendedor"}
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
                    <button
                      type="button"
                      onClick={() => setIsProfileOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50/70 transition-colors text-left"
                    >
                      <User className="w-4 h-4 text-emerald-600" />
                      <span>Meu Perfil & Loja</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left"
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

        {/* SUB-CABEÇALHO */}
        <div className="px-6 sm:px-8 pt-6 pb-2 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-xl transition-colors shadow-2xs mr-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Painel
              </Link>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">GESTÃO DE EQUIPE & VENDEDORES</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Controle de acesso da equipe comercial, definição de comissões e limites de desconto.
            </p>
          </div>

          {user?.role === "OWNER" && (
            <button
              type="button"
              onClick={() => setIsStoreModalOpen(true)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
            >
              <Settings className="w-4 h-4 text-emerald-400" />
              <span>Editar Identidade da Loja</span>
            </button>
          )}
        </div>

        {/* CONTEÚDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto px-6 sm:px-8 py-4">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* CARD DO OPERADOR & CONVITE */}
            <div className="bg-slate-950 text-white rounded-2xl p-6 shadow-xs border border-slate-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="relative w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 shrink-0 flex items-center justify-center overflow-hidden group shadow-inner">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle className="w-10 h-10 text-slate-600" />
                  )}

                  <label
                    className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all"
                    title="Clique para enviar nova foto"
                  >
                    <Camera className="w-6 h-6 text-emerald-400" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleUploadImage("avatar", e.target.files[0]);
                      }}
                    />
                  </label>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-900 text-emerald-400 border border-slate-800 px-3 py-1 rounded-full inline-block font-mono">
                    {user?.role === "OWNER" ? "Proprietário da Loja" : "Vendedor Vinculado"}
                  </span>
                  <h2 className="text-xl font-black mt-2 tracking-tight">{store?.name || "Minha Loja 3D"}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Operador: <strong className="text-white">{user?.name}</strong> ({user?.email})
                  </p>
                  <label className="text-[11px] text-emerald-400 hover:underline cursor-pointer font-bold inline-block mt-1">
                    {uploading ? "Enviando..." : "Alterar foto de perfil"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleUploadImage("avatar", e.target.files[0]);
                      }}
                    />
                  </label>
                </div>
              </div>

              {user?.role === "OWNER" && store && (
                <div className="bg-slate-900/90 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-1 w-full md:w-auto">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                    Código de Convite da Loja
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xl font-black tracking-widest text-emerald-400">
                      {store.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(store.code);
                        alert("Código copiado!");
                      }}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors"
                      title="Copiar código"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* GESTÃO DE VENDEDORES */}
            {user?.role === "OWNER" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-4.5 border border-slate-200/90 rounded-2xl shadow-xs">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block font-mono">
                      Total de Vendedores
                    </span>
                    <p className="text-2xl font-black text-slate-900 mt-1">{team.length}</p>
                    <span className="text-[11px] text-slate-500 font-medium">Equipe cadastrada</span>
                  </div>

                  <div className="bg-white p-4.5 border border-slate-200/90 rounded-2xl shadow-xs">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block font-mono">
                      Vendedores Ativos
                    </span>
                    <p className="text-2xl font-black text-emerald-600 mt-1">{activeSellersCount}</p>
                    <span className="text-[11px] text-slate-500 font-medium">Emitindo pedidos</span>
                  </div>

                  <div className="bg-white p-4.5 border border-slate-200/90 rounded-2xl shadow-xs">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block font-mono">
                      Aprovações Pendentes
                    </span>
                    <p className={`text-2xl font-black mt-1 ${pendingSellersCount > 0 ? "text-amber-500" : "text-slate-900"}`}>
                      {pendingSellersCount}
                    </p>
                    <span className="text-[11px] text-slate-500 font-medium">Aguardando autorização</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-50/60">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Membros da Equipe Comercial ({filteredTeam.length})
                      </h2>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={sellerSearch}
                        onChange={(e) => setSellerSearch(e.target.value)}
                        placeholder="Buscar por nome ou e-mail..."
                        className="w-full text-xs border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 bg-white font-medium focus:outline-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {filteredTeam.length === 0 ? (
                      <div className="p-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs font-bold text-slate-700">Nenhum vendedor encontrado.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Compartilhe o código de convite da loja para receber novas solicitações.
                        </p>
                      </div>
                    ) : (
                      filteredTeam.map((member) => (
                        <div
                          key={member.id}
                          className="p-5 flex flex-col lg:flex-row justify-between lg:items-center gap-4 hover:bg-slate-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-700 text-xs shrink-0 overflow-hidden shadow-2xs">
                              {member.avatarUrl ? (
                                <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                              ) : (
                                member.name?.charAt(0) || "V"
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black text-slate-900">{member.name}</h4>
                                <span
                                  className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${member.status === "ACTIVE"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                    }`}
                                >
                                  {member.status === "ACTIVE" ? "ATIVO" : "PENDENTE"}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5 font-medium">{member.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
                              <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Comissão:</span>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                defaultValue={member.commissionPercent || 0}
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  if (val !== member.commissionPercent) {
                                    handleUpdateSeller(member.id, member.status, val, member.maxDiscountPercent);
                                  }
                                }}
                                className="w-12 text-xs font-black text-slate-900 bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 text-center focus:outline-emerald-500"
                              />
                              <span className="text-xs font-bold text-slate-400">%</span>
                            </div>

                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
                              <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Desc. Máx:</span>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                defaultValue={member.maxDiscountPercent || 0}
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  if (val !== member.maxDiscountPercent) {
                                    handleUpdateSeller(member.id, member.status, member.commissionPercent, val);
                                  }
                                }}
                                className="w-12 text-xs font-black text-slate-900 bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 text-center focus:outline-emerald-500"
                              />
                              <span className="text-xs font-bold text-slate-400">%</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {(member.status === "PENDING" || member.status === "PENDING_APPROVAL") && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSeller(member.id, "ACTIVE")}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Aprovar</span>
                                </button>
                              )}

                              {member.status === "ACTIVE" ? (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSeller(member.id, "INACTIVE")}
                                  className="bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>Desativar</span>
                                </button>
                              ) : (
                                member.status === "INACTIVE" && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateSeller(member.id, "ACTIVE")}
                                    className="bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>Reativar</span>
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL CONFIGURAÇÃO DE LOJA */}
      {isStoreModalOpen && user?.role === "OWNER" && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in-50 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Identidade Visual da Empresa
                  </h3>
                  <p className="text-[11px] text-slate-400">Personalização white-label da fábrica</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStoreModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStoreCustomization} className="p-6 space-y-5">
              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" /> Configurações salvas com sucesso!
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="w-32 h-16 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0 p-1 shadow-2xs">
                  {store?.logoUrl ? (
                    <img src={store.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <StoreIcon className="w-6 h-6 text-slate-300" />
                  )}
                </div>

                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-800 block">Logomarca Oficial</span>
                  <span className="text-[11px] text-slate-400 block mb-2">
                    Exibida no catálogo e nos pedidos em PDF.
                  </span>

                  <label className="cursor-pointer bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 px-3.5 rounded-xl inline-flex items-center gap-2 transition-colors shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    {uploading ? "Enviando..." : "Carregar Nova Imagem"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleUploadImage("logo", e.target.files[0]);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Nome Comercial da Loja</label>
                  <input
                    type="text"
                    value={storeDisplayName}
                    onChange={(e) => setStoreDisplayName(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:outline-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">WhatsApp de Contato</label>
                  <input
                    type="text"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    placeholder="Ex: 63984192611"
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Cor Primária do Tema</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={storeBrandColor}
                    onChange={(e) => setStoreBrandColor(e.target.value)}
                    className="w-10 h-10 p-0.5 rounded-xl border border-slate-300 cursor-pointer bg-white shrink-0"
                  />
                  <input
                    type="text"
                    value={storeBrandColor}
                    onChange={(e) => setStoreBrandColor(e.target.value)}
                    className="w-full text-xs font-mono uppercase border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-slate-900 font-bold focus:bg-white focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStoreModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" /> Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}