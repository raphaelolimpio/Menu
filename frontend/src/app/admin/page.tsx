"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import ExcelJS from "exceljs";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import api, { API_URL } from "@/services/api";
import {
  ShoppingCart,
  LayoutDashboard,
  Clock,
  History,
  Users,
  CheckCircle,
  Download,
  Calendar,
  FileSpreadsheet,
  ArrowDownRight,
  ArrowUpRight,
  Layers,
  Filter,
  LogOut,
  DollarSign,
  MoreVertical,
  Edit,
  Menu,
  X,
  XCircle,
  Factory,
  TrendingUp,
  Timer,
  Bell,
  ChevronDown,
  Activity,
  Box,
  CheckCheck,
  Building2,
  Shield,
  User,
  Search
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import ProductManagement from "@/components/admin/ProductManagement";

const COLORS = ["#0284c7", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const formatOrderCode = (id: number, dateStr: string) => {
  const year = new Date(dateStr).getFullYear() || 2026;
  return `PED-${year}-${String(id).padStart(4, "0")}`;
};

function AdminDashboardContent() {
  const router = useRouter();
  const { cart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [openMenuOrderId, setOpenMenuOrderId] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as any;

  const [activeTab, setActiveTab] = useState<
    "dashboard" | "orders" | "history" | "contacts" | "products" | "commissions" | "production"
  >(tabParam || "dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [productionMetrics, setProductionMetrics] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeRange, setTimeRange] = useState<"today" | "7days" | "month" | "all">("all");
  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commissionsData, setCommissionsData] = useState<any>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<"ALL" | "FINISHED" | "CANCELED">("ALL");

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tabParam && ["dashboard", "orders", "history", "contacts", "products", "commissions", "production"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!orders || orders.length === 0) {
      setNotifications([]);
      return;
    }

    const storageKey = store?.id ? `read_notifications_${store.id}` : "read_notifications_ids";
    const readIds: string[] = JSON.parse(localStorage.getItem(storageKey) || "[]");

    const dynamicNotifs = orders.slice(0, 8).map((o: any) => {
      const orderCode = formatOrderCode(o.id, o.createdAt);
      const notifId = `order-${o.id}-${o.productionStep || o.status}`;
      const isRead = readIds.includes(notifId);

      let title = `Novo Pedido Emitido: ${orderCode}`;
      let desc = `Cliente ${o.customer?.name || "Consumidor"} — R$ ${Number(o.totalAmount || 0).toFixed(2)}`;

      if (o.productionStep === "PRONTO_ENTREGA") {
        title = `Ordem Concluída: ${orderCode}`;
        desc = `Lote pronto para expedição e entrega ao cliente.`;
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

    setNotifications(dynamicNotifs);
  }, [orders, store]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    const storedStore = localStorage.getItem("store");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    setCurrentUser(JSON.parse(userData));
    if (storedStore) {
      try {
        setStore(JSON.parse(storedStore));
      } catch (e) {}
    }
    setAuthLoading(false);
    loadAllData();
  }, [timeRange, router]);

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

  const loadAllData = async () => {
    setLoading(true);
    try {
      const storedStore = localStorage.getItem("store");
      const storeId = storedStore ? JSON.parse(storedStore).id : "";

      const storedUser = localStorage.getItem("user");
      const userObj = storedUser ? JSON.parse(storedUser) : null;

      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const defaultMetrics = {
        totalRevenue: 0,
        totalOrdersCount: 0,
        productSales: [],
        regionSales: [],
        topCustomers: [],
        bottomCustomers: [],
      };

      const [metricsRes, ordersRes, customersRes, commRes, productsRes, prodRes] = await Promise.all([
        api
          .get(`/api/orders/analytics/dashboard?range=${timeRange}&storeId=${storeId}`, config)
          .catch(() => ({ data: defaultMetrics })),
        api
          .get(`/api/orders?storeId=${storeId}`, config)
          .catch(() => ({ data: [] })),
        api
          .get(`/api/customers?storeId=${storeId}`, config)
          .catch(() => ({ data: [] })),
        api
          .get(
            `/api/orders/analytics/commissions?range=${timeRange}&storeId=${storeId}&userId=${userObj?.id}&role=${userObj?.role}`,
            config
          )
          .catch(() => ({ data: { summary: {}, sellers: [] } })),
        api
          .get(`/api/products?storeId=${storeId}`, config)
          .catch(() => ({ data: [] })),
        api
          .get(`/api/orders/analytics/production?range=${timeRange}&storeId=${storeId}`, config)
          .catch(() => ({ data: null })),
      ]);
      setMetrics(metricsRes.data || defaultMetrics);
      setOrders(ordersRes.data || []);
      setCustomers(customersRes.data || []);
      setCommissionsData(commRes.data || null);
      setProducts(productsRes.data || []);
      setProductionMetrics(prodRes.data);
    } catch (err: any) {
      console.error("Erro ao carregar dados do Dashboard:", err);
      if (err.response?.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
      }
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
    const allIds = notifications.map((n) => n.id);
    const storageKey = store?.id ? `read_notifications_${store.id}` : "read_notifications_ids";
    localStorage.setItem(storageKey, JSON.stringify(allIds));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    window.dispatchEvent(new Event("notifications-updated"));
  };
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      loadAllData();
    } catch (err: any) {
      alert("Erro ao atualizar status: " + err.message);
    }
  };

  const handleSendWhatsApp = (order: any) => {
    const baseUrl = window.location.origin;
    const proposalLink = `${baseUrl}/proposta/${order.id}`;
    const phone = order.customer.phone?.replace(/\D/g, "") || "";
    const text = `Olá, *${order.customer.name}*!\n\nSegue o link com a configuração 3D, valores e detalhes do seu projeto.\n\nAcesse aqui para visualizar e aprovar: ${proposalLink}\n\n*Validade da proposta: 7 dias.*`;
    const waUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  };

  const handleExportExcel = async () => {
    if (orders.length === 0) {
      alert("Nenhum pedido disponível para exportação.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistema Catálogo 3D B2B";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Relatório Comercial", {
      views: [{ showGridLines: true }],
    });

    worksheet.mergeCells("A1:H1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "RELATÓRIO GERENCIAL DE VENDAS & FATURAMENTO";
    titleCell.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.getRow(1).height = 35;

    worksheet.mergeCells("A2:H2");
    const subCell = worksheet.getCell("A2");
    subCell.value = `Exportado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")} | Base Consolidada`;
    subCell.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "FF64748B" } };
    subCell.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.getRow(2).height = 20;

    const tableRows = orders.map((o) => {
      const orderCode = formatOrderCode(o.id, o.createdAt);
      const dateFormatted = new Date(o.createdAt).toLocaleDateString("pt-BR");
      const statusLabel =
        o.status === "FINISHED" || o.status === "COMPLETED"
          ? "CONCLUÍDO"
          : o.status === "CANCELED"
            ? "CANCELADO"
            : o.status === "IN_PRODUCTION"
              ? `EM PRODUÇÃO (${o.productionStep || "ANDAMENTO"})`
              : o.status === "PAID"
                ? "PAGO"
                : "PENDENTE";

      return [
        orderCode,
        dateFormatted,
        o.customer?.name || "Consumidor",
        o.customer?.responsibleArea || "Geral",
        o.customer?.phone || "Não informado",
        o.paymentMethod || "PIX",
        statusLabel,
        Number(o.totalAmount),
      ];
    });

    worksheet.addTable({
      name: "TabelaVendas",
      ref: "A4",
      headerRow: true,
      totalsRow: true,
      style: {
        theme: "TableStyleMedium9",
        showRowStripes: true,
      },
      columns: [
        { name: "Cód. Pedido", filterButton: true },
        { name: "Data", filterButton: true },
        { name: "Cliente / Razão Social", filterButton: true },
        { name: "Região / Setor", filterButton: true },
        { name: "Contato Telefônico", filterButton: true },
        { name: "Pagamento", filterButton: true },
        { name: "Status", filterButton: true, totalsRowLabel: "Total Geral:" },
        { name: "Valor Total", filterButton: true, totalsRowFunction: "sum" },
      ],
      rows: tableRows,
    });

    worksheet.getColumn(1).width = 18;
    worksheet.getColumn(2).width = 14;
    worksheet.getColumn(3).width = 30;
    worksheet.getColumn(4).width = 22;
    worksheet.getColumn(5).width = 20;
    worksheet.getColumn(6).width = 15;
    worksheet.getColumn(7).width = 20;
    worksheet.getColumn(8).width = 20;

    worksheet.getColumn(5).numFmt = "@";
    worksheet.getColumn(8).numFmt = '"R$" #,##0.00;[Red]-"R$" #,##0.00';

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `painel_vendas_consolidado_${new Date().toISOString().slice(0, 10)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeOrders = orders.filter(
    (o) => o.status !== "FINISHED" && o.status !== "COMPLETED" && o.status !== "CANCELED"
  );

  const rawHistoricalOrders = orders.filter(
    (o) => o.status === "FINISHED" || o.status === "COMPLETED" || o.status === "CANCELED"
  );

  const filteredHistory = rawHistoricalOrders.filter((o) => {
    const code = formatOrderCode(o.id, o.createdAt).toLowerCase();
    const customer = (o.customer?.name || "").toLowerCase();
    const search = historySearch.toLowerCase();
    const matchesSearch = code.includes(search) || customer.includes(search);

    const matchesStatus =
      historyStatusFilter === "ALL"
        ? true
        : historyStatusFilter === "FINISHED"
          ? o.status === "FINISHED" || o.status === "COMPLETED"
          : o.status === historyStatusFilter;

    return matchesSearch && matchesStatus;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-sm font-bold text-slate-400 animate-pulse">
          Validando acesso seguro...
        </div>
      </div>
    );
  }

  const navMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "production", label: "Produção & PCP", icon: Activity, role: "OWNER", badge: "Owner" },
    { id: "orders", label: `Fila de Pedidos (${activeOrders.length})`, icon: Clock },
    { id: "products", label: "Gerenciar Produtos", icon: Layers, role: "OWNER", badge: "Owner" },
    { id: "history", label: "Histórico de Vendas", icon: History },
    { id: "commissions", label: currentUser?.role === "OWNER" ? "Comissões" : "Minhas Comissões", icon: DollarSign },
    { id: "contacts", label: "Clientes", icon: Users },
  ];

  const getPageTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return "Dashboard Comercial";
      case "production":
        return "PRODUÇÃO & PCP";
      case "orders":
        return "Fila de Pedidos & Fábrica";
      case "products":
        return "Gestão de Catálogo 3D";
      case "history":
        return "Histórico de Vendas";
      case "commissions":
        return "Relatório de Comissões";
      case "contacts":
        return "Base de Clientes";
      default:
        return "Painel de Controle";
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 h-full w-64 bg-slate-950 text-slate-300 z-50 flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
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
              if (item.role && currentUser?.role !== item.role) return null;
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                    isActive
                      ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/10"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-slate-950" : "text-slate-400"}`} />
                    <div className="flex flex-col">
                      <span>{item.label}</span>
                      {item.badge && !isActive && (
                        <span className="text-[9px] font-normal text-slate-500 -mt-0.5">{item.badge}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

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

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 shadow-2xs">
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

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Ícone: Abrir Catálogo 3D */}
            <Link
              href={store?.id ? `/?store=${store.id}` : "/"}
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

            {/* Notificações */}
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

            {/* Avatar & Perfil */}
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

        <div className="px-6 sm:px-8 pt-6 pb-2 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{getPageTitle()}</h1>
            <p className="text-xs text-slate-500 mt-0.5">Controle em tempo real de vendas e manufatura.</p>
          </div>

          <button
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4" /> Exportar Dados
          </button>
        </div>

        <main className="flex-1 overflow-y-auto px-6 sm:px-8 py-4">
          <div className="max-w-7xl mx-auto space-y-6">
            {loading ? (
              <div className="py-24 text-center flex flex-col items-center justify-center text-slate-400">
                <div className="w-8 h-8 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin mb-3" />
                <p className="text-xs font-bold">Carregando métricas e dados de produção...</p>
              </div>
            ) : (
              <>
                {/* 1. ABA DE PRODUTOS */}
                {activeTab === "products" && currentUser?.role === "OWNER" && <ProductManagement />}

                {/* 2. ABA DASHBOARD COMERCIAL */}
                {activeTab === "dashboard" && metrics && (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-2xl shadow-xs">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 whitespace-nowrap">
                        <Calendar className="w-4 h-4 text-slate-400" /> Período das Métricas:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: "today", label: "Hoje" },
                          { id: "7days", label: "Últimos 7 dias" },
                          { id: "month", label: "Mês Atual" },
                          { id: "all", label: "Todo o Período" },
                        ].map((r) => (
                          <button
                            key={r.id}
                            onClick={() => setTimeRange(r.id as any)}
                            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                              timeRange === r.id
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs">
                        <span className="text-xs font-bold uppercase text-slate-400">Receita no Período</span>
                        <p className="text-3xl font-black text-emerald-600 mt-1">R$ {metrics.totalRevenue.toFixed(2)}</p>
                      </div>
                      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs">
                        <span className="text-xs font-bold uppercase text-slate-400">Volume de Ordens</span>
                        <p className="text-3xl font-black text-slate-800 mt-1">{metrics.totalOrdersCount}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
                          Receita por Modelo de Produto
                        </h3>
                        <div className="h-64 flex items-center justify-center">
                          {metrics?.productSales?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={metrics.productSales}>
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                                <YAxis stroke="#94a3b8" fontSize={11} />
                                <Tooltip />
                                <Bar dataKey="revenue" fill="#0f172a" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <p className="text-xs text-slate-400 font-semibold">Nenhuma venda de produto registrada no período.</p>
                          )}
                        </div>
                      </div>

                      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
                          Vendas por Região / Espaço
                        </h3>
                        <div className="h-64 flex items-center justify-center">
                          {metrics?.regionSales?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={metrics.regionSales}
                                  dataKey="total"
                                  nameKey="region"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  label
                                >
                                  {metrics.regionSales.map((_: any, idx: number) => (
                                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <p className="text-xs text-slate-400 font-semibold">Nenhuma região computada ainda.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs">
                        <div className="flex items-center gap-2 text-emerald-700 mb-3 font-bold text-xs uppercase tracking-wider">
                          <ArrowUpRight className="w-4 h-4" /> Top Clientes
                        </div>
                        <div className="divide-y divide-slate-100">
                          {metrics.topCustomers.map((c: any, i: number) => (
                            <div key={i} className="py-2.5 flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-800">{c.name}</span>
                              <span className="font-bold text-emerald-600">R$ {c.total.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs">
                        <div className="flex items-center gap-2 text-rose-600 mb-3 font-bold text-xs uppercase tracking-wider">
                          <ArrowDownRight className="w-4 h-4" /> Menor Frequência de Compras
                        </div>
                        <div className="divide-y divide-slate-100">
                          {metrics.bottomCustomers.map((c: any, i: number) => (
                            <div key={i} className="py-2.5 flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-800">{c.name}</span>
                              <span className="font-bold text-slate-600">R$ {c.total.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. ABA COMISSÕES */}
                {activeTab === "commissions" && (
                  <div className="space-y-6">
                    {currentUser?.role !== "OWNER" ? (
                      <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-xs">
                        <span className="text-xs font-bold uppercase text-slate-400">Minha Comissão Acumulada</span>
                        <p className="text-4xl font-black text-emerald-600 mt-2">
                          R$ {Number(commissionsData?.summary?.totalCommission || 0).toFixed(2)}
                        </p>
                        <div className="mt-4 flex gap-8 text-xs text-slate-600 pt-4 border-t border-slate-100">
                          <div>
                            <span className="text-slate-400 block font-medium">Total Vendido por Mim:</span>
                            <strong className="text-sm text-slate-800">
                              R$ {Number(commissionsData?.summary?.totalRevenue || 0).toFixed(2)}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Pedidos Faturados:</span>
                            <strong className="text-sm text-slate-800">
                              {commissionsData?.summary?.totalOrdersCount || 0}
                            </strong>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs">
                            <span className="text-xs font-bold uppercase text-slate-400">Total a Repassar (Equipe)</span>
                            <p className="text-3xl font-black text-emerald-600 mt-1">
                              R$ {Number(commissionsData?.summary?.totalCommission || 0).toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs">
                            <span className="text-xs font-bold uppercase text-slate-400">Faturamento Intermediado</span>
                            <p className="text-3xl font-black text-slate-800 mt-1">
                              R$ {Number(commissionsData?.summary?.totalRevenue || 0).toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs">
                            <span className="text-xs font-bold uppercase text-slate-400">Vendas com Comissão</span>
                            <p className="text-3xl font-black text-slate-800 mt-1">
                              {commissionsData?.summary?.totalOrdersCount || 0}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                          <div className="p-4 border-b bg-slate-50 font-bold text-xs text-slate-500 uppercase flex justify-between items-center">
                            <span>Repasse por Vendedor</span>
                            <span className="text-slate-400">{commissionsData?.sellers?.length || 0} vendedor(es)</span>
                          </div>

                          <div className="divide-y divide-slate-100">
                            {commissionsData?.sellers?.length === 0 ? (
                              <p className="text-center text-xs text-slate-400 py-12">Nenhuma comissão registrada para o período.</p>
                            ) : (
                              commissionsData?.sellers?.map((seller: any) => (
                                <div key={seller.id} className="p-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
                                  <div>
                                    <h4 className="font-bold text-slate-900 text-sm">{seller.name}</h4>
                                    <p className="text-xs text-slate-400">{seller.email}</p>
                                    <div className="mt-1 flex items-center gap-2">
                                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                        Taxa: {seller.commissionPercent}%
                                      </span>
                                      <span className="text-[10px] text-slate-500">{seller.ordersCount} pedido(s)</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-6">
                                    <div className="text-right">
                                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Vendido</span>
                                      <span className="text-xs font-bold text-slate-700">
                                        R$ {Number(seller.totalRevenue).toFixed(2)}
                                      </span>
                                    </div>

                                    <div className="text-right bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl">
                                      <span className="text-[10px] text-emerald-800 block uppercase font-bold">Comissão Devida</span>
                                      <span className="text-sm font-black text-emerald-700">
                                        R$ {Number(seller.totalCommission).toFixed(2)}
                                      </span>
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
                )}

                {/* 4. ABAS DE FILA DE PEDIDOS E DE PRODUÇÃO & PCP */}
                {(activeTab === "orders" || activeTab === "production") && (
                  <div className="space-y-6">
                    {activeTab === "production" && currentUser?.role === "OWNER" && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-white p-5 border border-slate-200/90 rounded-2xl shadow-xs">
                            <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1 font-mono">
                              <Timer className="w-3.5 h-3.5 text-emerald-500" /> Eficiência Operacional
                            </span>
                            <p className="text-3xl font-black text-slate-800 mt-2">
                              {productionMetrics?.summary?.efficiencyPercent || 0}%
                            </p>
                            <span className="text-[11px] text-slate-500 font-medium block mt-1">
                              Meta: 100% (Estimado = Real)
                            </span>
                          </div>

                          <div
                            className={`p-5 border rounded-2xl shadow-xs ${
                              (productionMetrics?.summary?.financialResult || 0) >= 0
                                ? "bg-emerald-50/70 border-emerald-200"
                                : "bg-rose-50/70 border-rose-200"
                            }`}
                          >
                            <span
                              className={`text-[10px] font-bold uppercase flex items-center gap-1 font-mono ${
                                (productionMetrics?.summary?.financialResult || 0) >= 0
                                  ? "text-emerald-700"
                                  : "text-rose-700"
                              }`}
                            >
                              <TrendingUp className="w-3.5 h-3.5" /> Resultado Financeiro
                            </span>
                            <p
                              className={`text-3xl font-black mt-2 font-mono ${
                                (productionMetrics?.summary?.financialResult || 0) >= 0
                                  ? "text-emerald-600"
                                  : "text-rose-600"
                              }`}
                            >
                              R$ {Number(productionMetrics?.summary?.financialResult || 0).toFixed(2)}
                            </p>
                            <span className="text-[11px] opacity-75 font-medium block mt-1">
                              Custo: R$ {Number(productionMetrics?.summary?.operationalCostPerHour || 0).toFixed(2)}/h
                            </span>
                          </div>

                          <div className="bg-white p-5 border border-slate-200/90 rounded-2xl shadow-xs">
                            <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">
                              Horas de Máquina / Fabril
                            </span>
                            <p className="text-3xl font-black text-slate-800 mt-2 font-mono">
                              {(Number(productionMetrics?.summary?.totalActualMin || 0) / 60).toFixed(1)}h
                            </p>
                            <span className="text-[11px] text-slate-500 font-medium block mt-1">
                              Orçado: {(Number(productionMetrics?.summary?.totalEstimatedMin || 0) / 60).toFixed(1)}h
                            </span>
                          </div>

                          <div className="bg-white p-5 border border-slate-200/90 rounded-2xl shadow-xs">
                            <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1 font-mono">
                              <Factory className="w-3.5 h-3.5 text-blue-500" /> Carga em Processo
                            </span>
                            <p className="text-3xl font-black text-slate-800 mt-2 font-mono">
                              {activeOrders.reduce(
                                (acc, o) => acc + (o.items || []).reduce((sum: number, it: any) => sum + (it.quantity || 1), 0),
                                0
                              )}{" "}
                              <span className="text-sm font-bold text-slate-400">un.</span>
                            </p>
                            <span className="text-[11px] text-slate-500 font-medium block mt-1">
                              Distribuídas em {activeOrders.length} lote(s)
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="bg-white p-5 border border-slate-200/90 rounded-2xl shadow-xs">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">
                                  Distribuição por Etapa Fabril
                                </h3>
                                <p className="text-[11px] text-slate-400">Volume físico em cada posto de trabalho</p>
                              </div>
                              <Activity className="w-4 h-4 text-emerald-600" />
                            </div>

                            <div className="h-60 flex items-center justify-center">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={[
                                    {
                                      step: "Aguardando",
                                      qtd: activeOrders.filter((o) => !o.productionStep || o.productionStep === "AGUARDANDO").length,
                                    },
                                    { step: "Corte", qtd: activeOrders.filter((o) => o.productionStep === "CORTE").length },
                                    { step: "Solda", qtd: activeOrders.filter((o) => o.productionStep === "SOLDA").length },
                                    { step: "Pintura", qtd: activeOrders.filter((o) => o.productionStep === "PINTURA").length },
                                    { step: "Montagem", qtd: activeOrders.filter((o) => o.productionStep === "MONTAGEM").length },
                                    { step: "Expedição", qtd: activeOrders.filter((o) => o.productionStep === "PRONTO_ENTREGA").length },
                                  ]}
                                >
                                  <XAxis dataKey="step" stroke="#94a3b8" fontSize={10} />
                                  <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                                  <Tooltip />
                                  <Bar dataKey="qtd" fill="#0f172a" radius={[6, 6, 0, 0]} name="Ordens Ativas" />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          <div className="bg-white p-5 border border-slate-200/90 rounded-2xl shadow-xs">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">
                                  Tempo Orçado vs. Real (Minutos)
                                </h3>
                                <p className="text-[11px] text-slate-400">Desvios de cronômetro por ordem de produção</p>
                              </div>
                              <Timer className="w-4 h-4 text-blue-600" />
                            </div>

                            <div className="h-60 flex items-center justify-center">
                              {activeOrders.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={activeOrders.slice(0, 5).map((o) => {
                                      const estimatedMin = (o.items || []).reduce(
                                        (acc: number, it: any) => acc + (it.product?.estimatedTimeMin || 0) * (it.quantity || 1),
                                        0
                                      );
                                      const elapsedMin = o.productionStartedAt
                                        ? Math.round((currentTime.getTime() - new Date(o.productionStartedAt).getTime()) / 60000)
                                        : 0;
                                      return {
                                        code: formatOrderCode(o.id, o.createdAt),
                                        Estimado: Math.round(estimatedMin * 1.1),
                                        Real: elapsedMin,
                                      };
                                    })}
                                  >
                                    <XAxis dataKey="code" stroke="#94a3b8" fontSize={10} />
                                    <YAxis stroke="#94a3b8" fontSize={10} />
                                    <Tooltip />
                                    <Bar dataKey="Estimado" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Real" fill="#10b981" radius={[4, 4, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              ) : (
                                <p className="text-xs text-slate-400 font-semibold">Nenhuma ordem em andamento no momento.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {activeOrders.map((o) => {
                        let totalEstimatedMin = 0;
                        const orderItems = o.items || [];
                        const itemMetrics = orderItems.map((item: any) => {
                          const timePerUnit = item.product?.estimatedTimeMin || 0;
                          const totalItemTime = timePerUnit * (item.quantity || 1);
                          totalEstimatedMin += totalItemTime;
                          return { ...item, totalItemTime };
                        });

                        const timeWithMargin = totalEstimatedMin > 0 ? totalEstimatedMin * 1.1 : 0;
                        const hasStarted = !!o.productionStartedAt;

                        let estimatedDelivery: Date | null = null;
                        let isLate = false;
                        let remainingMin = 0;
                        let elapsedMin = 0;
                        let startedTimeFormatted = "";

                        if (hasStarted) {
                          const started = new Date(o.productionStartedAt);
                          startedTimeFormatted = started.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                          estimatedDelivery = new Date(started.getTime() + timeWithMargin * 60000);
                          isLate = currentTime > estimatedDelivery;
                          remainingMin = Math.round((estimatedDelivery.getTime() - currentTime.getTime()) / 60000);
                          elapsedMin = Math.round((currentTime.getTime() - started.getTime()) / 60000);
                        }

                        return (
                          <div
                            key={o.id}
                            className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col gap-6"
                          >
                            <div>
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3 font-mono">
                                PEDIDO EM ABERTO: {formatOrderCode(o.id, o.createdAt)}
                              </span>

                              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                                <div>
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="font-extrabold text-slate-900 font-mono text-lg">
                                      {formatOrderCode(o.id, o.createdAt)}
                                    </span>

                                    <span
                                      className={`text-[11px] font-extrabold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                                        o.productionStep === "PRONTO_ENTREGA"
                                          ? "bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse"
                                          : o.productionStep && o.productionStep !== "AGUARDANDO"
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                            : "bg-amber-100 text-amber-800 border-amber-200"
                                      }`}
                                    >
                                      {o.productionStep ? `ETAPA: ${o.productionStep}` : "AGUARDANDO INÍCIO"}
                                      <Activity className="w-3.5 h-3.5 text-emerald-500" />
                                    </span>
                                  </div>

                                  <p className="text-xs text-slate-600 mt-1">
                                    Cliente: <strong>{o.customer?.name || "Consumidor Geral"}</strong>{" "}
                                    {o.customer?.responsibleArea ? `(${o.customer.responsibleArea})` : ""} — R${" "}
                                    {Number(o.totalAmount || 0).toFixed(2)} via {o.paymentMethod || "PIX"}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  <Link
                                    href={`/linha-producao/${o.id}?storeId=${store?.id || ""}`}
                                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                                  >
                                    Abrir Fábrica / MES
                                  </Link>

                                  <a
                                    href={`${API_URL}/api/orders/${o.id}/production-pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                                  >
                                    Ficha Técnica
                                  </a>

                                  {o.pdfUrl && (
                                    <a
                                      href={`${API_URL}/api${o.pdfUrl.startsWith("/") ? o.pdfUrl : `/${o.pdfUrl}`}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                                    >
                                      Pedido (PDF)
                                    </a>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleSendWhatsApp(o)}
                                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                                  >
                                    WhatsApp
                                  </button>

                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuOrderId(openMenuOrderId === o.id ? null : o.id);
                                      }}
                                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </button>

                                    {openMenuOrderId === o.id && (
                                      <>
                                        <div
                                          className="fixed inset-0 z-40"
                                          onClick={() => setOpenMenuOrderId(null)}
                                        />
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              router.push(`/admin/editar-proposta/${o.id}`);
                                              setOpenMenuOrderId(null);
                                            }}
                                            className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100"
                                          >
                                            <Edit className="w-4 h-4" /> Editar Proposta
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleUpdateStatus(o.id, "FINISHED");
                                              setOpenMenuOrderId(null);
                                            }}
                                            className="w-full text-left px-4 py-3 text-xs font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 border-b border-slate-100"
                                          >
                                            <CheckCircle className="w-4 h-4" /> Concluir (Estoque)
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (confirm(`Deseja realmente cancelar o pedido?`))
                                                handleUpdateStatus(o.id, "CANCELED");
                                              setOpenMenuOrderId(null);
                                            }}
                                            className="w-full text-left px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                          >
                                            <XCircle className="w-4 h-4" /> Cancelar Pedido
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-2xs">
                              <span className="text-xs font-black uppercase text-slate-800 tracking-wider block mb-4 font-mono">
                                Métricas em Tempo Real
                              </span>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-center">
                                <div>
                                  {itemMetrics.length > 0 ? (
                                    itemMetrics.map((item: any, idx: number) => (
                                      <div key={idx} className="mb-2">
                                        <p className="text-xl font-black text-slate-900">
                                          {item.quantity}x {item.product?.name || item.productName || "Peça 3D"}
                                        </p>
                                        <span className="text-xs text-slate-400 font-medium block mt-0.5">
                                          Composição de Produção
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <div>
                                      <p className="text-sm font-bold text-slate-700">Aguardando itens do lote</p>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-8 justify-start lg:justify-center">
                                  <div>
                                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1 font-mono">
                                      Tempo Estimado
                                    </span>
                                    <p className="text-3xl font-black text-slate-900 font-mono">
                                      {Math.round(timeWithMargin)} <span className="text-base font-bold text-slate-500">min</span>
                                    </p>
                                  </div>

                                  <div>
                                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1 font-mono">
                                      Tempo Real
                                    </span>
                                    <p
                                      className={`text-3xl font-black font-mono ${
                                        hasStarted && isLate ? "text-rose-600 animate-pulse" : "text-slate-900"
                                      }`}
                                    >
                                      {hasStarted ? elapsedMin : 0}{" "}
                                      <span className="text-base font-bold text-slate-500">min</span>
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-col items-start lg:items-end justify-center">
                                  {hasStarted ? (
                                    <>
                                      <div
                                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border ${
                                          isLate
                                            ? "bg-rose-50 text-rose-700 border-rose-200"
                                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        }`}
                                      >
                                        {isLate
                                          ? `⚠️ Atrasado (${Math.abs(remainingMin)} min)`
                                          : `✓ No prazo (${remainingMin} min restantes)`}
                                      </div>

                                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2 font-medium">
                                        <Timer className="w-3.5 h-3.5" />
                                        Iniciado às: {startedTimeFormatted}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-left lg:text-right">
                                      <span className="text-xs font-bold text-slate-400">Aguardando início</span>
                                      <p className="text-[10px] text-slate-400">Cronômetro inicia com a etapa fabril</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {activeOrders.length === 0 && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400">
                          <p className="text-sm font-semibold">Nenhum pedido aberto no momento.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. ABA HISTÓRICO COM PESQUISA E FILTROS */}
                {activeTab === "history" && (
                  <div className="space-y-4">
                    <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-xs flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                      <div className="relative w-full lg:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={historySearch}
                          onChange={(e) => setHistorySearch(e.target.value)}
                          placeholder="Buscar por código ou cliente..."
                          className="w-full text-xs border rounded-xl pl-9 pr-3 py-2 bg-slate-50 focus:bg-white"
                        />
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                        <span className="text-xs text-slate-500 font-semibold hidden sm:block">Status:</span>
                        {(["ALL", "FINISHED", "CANCELED"] as const).map((st) => (
                          <button
                            key={st}
                            onClick={() => setHistoryStatusFilter(st)}
                            className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                              historyStatusFilter === st
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {st === "ALL" ? "Todos" : st === "FINISHED" ? "Concluídos" : "Cancelados"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                      <div className="p-4 border-b bg-slate-50 font-bold text-xs text-slate-500 uppercase flex justify-between">
                        <span>Vendas Registradas ({filteredHistory.length})</span>
                        <span>Total: R$ {filteredHistory.reduce((acc, o) => acc + o.totalAmount, 0).toFixed(2)}</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {filteredHistory.map((o) => (
                          <div key={o.id} className="p-4 flex flex-col md:flex-row justify-between md:items-center gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 font-mono text-sm">
                                  {formatOrderCode(o.id, o.createdAt)}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    o.status === "FINISHED" || o.status === "COMPLETED"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-rose-100 text-rose-800"
                                  }`}
                                >
                                  {o.status === "FINISHED" || o.status === "COMPLETED" ? "CONCLUÍDO" : "CANCELADO"}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {new Date(o.createdAt).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1">
                                Cliente: <strong>{o.customer?.name}</strong> ({o.customer?.phone || "Sem tel"}) — R${" "}
                                {o.totalAmount.toFixed(2)} via {o.paymentMethod || "PIX"}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              {o.pdfUrl ? (
                                <a
                                  href={`${API_URL}/api${o.pdfUrl.startsWith("/") ? o.pdfUrl : `/${o.pdfUrl}`}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5" /> Pedido (PDF)
                                </a>
                              ) : (
                                <button
                                  disabled
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-xs font-semibold cursor-not-allowed"
                                >
                                  <Download className="w-3.5 h-3.5" /> Pedido (PDF)
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        {filteredHistory.length === 0 && (
                          <p className="text-center text-xs text-slate-400 py-12">
                            Nenhum registro localizado com os filtros selecionados.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. ABA CONTATOS / CLIENTES */}
                {activeTab === "contacts" && (
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="p-4 border-b bg-slate-50 font-bold text-xs text-slate-500 uppercase">
                      Contatos Cadastrados
                    </div>
                    <div className="divide-y divide-slate-100">
                      {customers.map((c) => (
                        <div key={c.id} className="p-4 flex justify-between items-center text-xs">
                          <div>
                            <h4 className="font-bold text-slate-900">{c.name}</h4>
                            <p className="text-slate-500">{c.responsibleArea || "Sem local"}</p>
                          </div>
                          <div className="text-right text-slate-600">
                            <p>{c.phone}</p>
                            <p>{c.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <div className="text-sm font-bold text-slate-400 animate-pulse">
            Carregando painel...
          </div>
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}