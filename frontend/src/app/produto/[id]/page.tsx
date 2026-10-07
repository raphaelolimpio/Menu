"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import api, { API_URL } from "@/services/api";
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Check,
  X,
  Trash2,
  Edit2,
  ShoppingCart,
  Sparkles,
  Layers,
  Bell,
  ChevronDown,
  Box,
  Palette,
  CheckCheck,
  Building2,
  Shield,
  User,
  LogOut
} from "lucide-react";
import { useCart, CartVariation } from "@/context/CartContext";
import { FinishType, ModelViewerHandle } from "@/components/ModelViewer";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), { ssr: false });

interface LocalVariation {
  id: string;
  quantity: number;
  configuration: Record<string, string>;
  thumbnail?: string | null;
}

interface CustomGroup {
  name: string;
  bodies: string[];
  availableColors: string[];
}

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

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { cart, addToCart } = useCart();
  const productId = params?.id as string;

  const viewerRef = useRef<ModelViewerHandle>(null);

  const [product, setProduct] = useState<any>(null);
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({});
  const [finish, setFinish] = useState<FinishType>("standard");
  const [quantity, setQuantity] = useState(1);
  const [variations, setVariations] = useState<LocalVariation[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [backupConfig, setBackupConfig] = useState<{
    config: Record<string, string>;
    qty: number;
  } | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [logoError, setLogoError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const getFullModelUrl = (path?: string | null) => {
    if (!path) return null;
    let cleanPath = path;
    if (cleanPath.includes("localhost:3333") || cleanPath.includes("127.0.0.1:3333")) {
      cleanPath = cleanPath.replace(/^https?:\/\/(localhost|127\.0\.0\.1):3333/, "");
    }
    if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
      return cleanPath;
    }
    const formatted = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
    return `${API_URL}${formatted}`;
  };

  const getFullImageUrl = (path?: string | null) => {
    if (!path) return null;
    let cleanPath = path;
    if (cleanPath.includes("localhost:3333") || cleanPath.includes("127.0.0.1:3333")) {
      cleanPath = cleanPath.replace(/^https?:\/\/(localhost|127\.0\.0\.1):3333/, "");
    }
    if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
      return cleanPath;
    }
    const formatted = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
    return `${API_URL}${formatted}`;
  };

  const parseGroups = (raw: any): CustomGroup[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      const storedStore = localStorage.getItem("store");

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setCurrentUser(parsedUser);

          if (token && parsedUser?.id) {
            api.get(`/api/users/${parsedUser.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            }).then((res) => {
              if (res.data) {
                setCurrentUser(res.data);
                localStorage.setItem("user", JSON.stringify(res.data));
              }
            }).catch(() => {});
          }
        } catch {}
      }

      if (storedStore) {
        try {
          const parsedStore = JSON.parse(storedStore);
          setStore(parsedStore);

          if (token && parsedStore?.id) {
            api.get(`/api/stores/${parsedStore.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            }).then((res) => {
              if (res.data) {
                setStore(res.data);
                localStorage.setItem("store", JSON.stringify(res.data));
              }
            }).catch(() => {});
          }
        } catch {}
      }
    };

    loadUserData();
    window.addEventListener("storage-updated", loadUserData);
    return () => window.removeEventListener("storage-updated", loadUserData);
  }, []);

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

  useEffect(() => {
    if (!productId) return;
    api
      .get(`/api/products/${productId}`)
      .then((res) => {
        setProduct(res.data);
        initColors(res.data);
      })
      .catch((err) => {
        console.error("Erro ao carregar produto:", err);
        router.push("/");
      });
  }, [productId, router]);

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

  const initColors = (prod: any) => {
    const groups = parseGroups(prod.customizableParts);
    const initialConfig: Record<string, string> = {};

    groups.forEach((g) => {
      const defaultColor = g.availableColors?.[0] || "#111827";
      initialConfig[g.name] = defaultColor;
    });

    setSelectedColors(initialConfig);
  };

  const handleColorChange = (groupName: string, color: string) => {
    setSelectedColors((prev) => ({ ...prev, [groupName]: color }));
  };

  const handleApplyGlobalColor = (hex: string) => {
    const groups = parseGroups(product?.customizableParts);
    const updated: Record<string, string> = {};

    groups.forEach((g) => {
      const normalizedName = g.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      const isTopTip =
        normalizedName.includes("superior") ||
        (normalizedName.includes("ponteira") && normalizedName.includes("sup"));

      if (isTopTip) {
        const greyHex = "#6B7280";
        updated[g.name] = g.availableColors.includes(greyHex)
          ? greyHex
          : (g.availableColors.find((c) => c === "#6B7280" || c === "#111827" || c === "#FFFFFF") || g.availableColors[0]);
      } else {
        updated[g.name] = g.availableColors.includes(hex)
          ? hex
          : (g.availableColors[0] || hex);
      }
    });

    setSelectedColors(updated);
  };

  const handleAddVariation = () => {
    const thumb = viewerRef.current ? viewerRef.current.captureSnapshot() : null;

    const newVar: LocalVariation = {
      id: crypto.randomUUID(),
      quantity: quantity,
      configuration: { ...selectedColors },
      thumbnail: thumb,
    };
    setVariations((prev) => [...prev, newVar]);
    setQuantity(1);
  };

  const handleStartEdit = (item: LocalVariation) => {
    setEditingId(item.id);
    setBackupConfig({ config: { ...selectedColors }, qty: quantity });
    setSelectedColors({ ...item.configuration });
    setQuantity(item.quantity);
    setActiveMenuId(null);
  };

  const handleConfirmEdit = () => {
    if (!editingId) return;
    const updatedThumb = viewerRef.current ? viewerRef.current.captureSnapshot() : null;

    setVariations((prev) =>
      prev.map((v) =>
        v.id === editingId
          ? {
            ...v,
            quantity: quantity,
            configuration: { ...selectedColors },
            thumbnail: updatedThumb || v.thumbnail,
          }
          : v
      )
    );
    setEditingId(null);
    setBackupConfig(null);
    setQuantity(1);
  };

  const handleCancelEdit = () => {
    if (backupConfig) {
      setSelectedColors(backupConfig.config);
      setQuantity(backupConfig.qty);
    }
    setEditingId(null);
    setBackupConfig(null);
  };

  const handleDeleteVariation = (id: string) => {
    setVariations((prev) => prev.filter((v) => v.id !== id));
    if (editingId === id) handleCancelEdit();
    setActiveMenuId(null);
  };

  const handlePushToCart = () => {
    if (variations.length === 0) return;

    const cartPayload: CartVariation[] = variations.map((v) => ({
      id: v.id,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      unitPrice: Number(product.basePrice),
      quantity: v.quantity,
      configuration: v.configuration,
      model3dUrl: product.model3dUrl,
      thumbnail: v.thumbnail,
    }));

    addToCart(cartPayload);
    router.push("/cart");
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-slate-800 border-t-emerald-500 rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-400">Carregando especificações e malhas 3D...</p>
      </div>
    );
  }

  const groups = parseGroups(product.customizableParts);
  const cleanModelUrl = getFullModelUrl(product.model3dUrl);
  const storeLogoSrc = getFullImageUrl(store?.logoUrl);
  const userAvatarSrc = getFullImageUrl(currentUser?.avatarUrl);

  return (
    <div
      className="min-h-screen bg-slate-100 flex flex-col font-sans"
      onClick={() => setActiveMenuId(null)}
    >
      <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            {storeLogoSrc && !logoError ? (
              <img
                src={storeLogoSrc}
                alt=""
                onError={() => setLogoError(true)}
                className="h-8 max-w-[140px] sm:max-w-[170px] object-contain rounded-md"
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-xs font-black text-slate-900 tracking-tight uppercase leading-none">
                    {store?.name || "Catálogo 3D"}
                  </h1>
                  <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase">
                    Portal de Pedidos
                  </span>
                </div>
              </div>
            )}
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            title="Voltar ao Catálogo 3D"
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
                      className={`p-3.5 flex gap-3 transition-colors ${n.read ? "bg-white" : "bg-emerald-50/20"}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? "bg-slate-300" : "bg-emerald-500"}`}
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

          <div className="relative" ref={profileRef}>
            {currentUser ? (
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotifOpen(false);
                }}
                className="flex items-center gap-1.5 p-1 pl-1.5 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-2xs"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs overflow-hidden">
                  {userAvatarSrc && !avatarError ? (
                    <img
                      src={userAvatarSrc}
                      alt=""
                      onError={() => setAvatarError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{currentUser?.name?.charAt(0).toUpperCase() || "U"}</span>
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
              </button>
            ) : (
              <Link
                href="/login"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-2xs"
              >
                Entrar
              </Link>
            )}

            {isProfileOpen && currentUser && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 duration-150">
                <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0 overflow-hidden">
                    {userAvatarSrc && !avatarError ? (
                      <img
                        src={userAvatarSrc}
                        alt=""
                        onError={() => setAvatarError(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{currentUser?.name?.charAt(0).toUpperCase() || "U"}</span>
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Catálogo
              </Link>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                {product.name}
              </h1>
              <span className="text-[11px] font-mono font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded-md">
                SKU: {product.sku}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Personalizador interativo 3D com renderização em tempo real e simulação de acabamentos.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
              Preço Base
            </span>
            <span className="text-2xl font-black text-emerald-600 font-mono">
              R$ {Number(product.basePrice).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-12">
          <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-24">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs overflow-hidden">
              <div className="h-[460px] sm:h-[520px] w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center">
                {cleanModelUrl ? (
                  <ModelViewer
                    ref={viewerRef}
                    modelUrl={cleanModelUrl}
                    selectedColors={selectedColors}
                    finish={finish}
                    customizableParts={product.customizableParts}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <Box className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs font-bold">Arquivo 3D indisponível</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Esquemas Rápidos:</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { name: "Azul Real", hex: "#1E3A8A" },
                  { name: "Total Amarelo", hex: "#F59E0B" },
                  { name: "Total Verde", hex: "#10B981" },
                  { name: "Vibrante", hex: "#DC2626" },
                ].map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleApplyGlobalColor(p.hex)}
                    className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl text-slate-700 transition-colors shadow-2xs"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-wider text-slate-800">
                  <Layers className="w-4 h-4 text-slate-600" />
                  <span>Acabamento da Superfície</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(["standard", "matte", "glossy"] as FinishType[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFinish(f)}
                      className={`py-2.5 text-xs font-bold rounded-xl border transition-all capitalize ${finish === f
                        ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      {f === "standard" ? "Padrão" : f === "matte" ? "Fosco / Textura" : "Brilhante"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 border-t border-slate-100 pt-5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800">
                  <Palette className="w-4 h-4 text-emerald-600" />
                  <span>Personalizar Cores dos Grupos</span>
                </div>

                {groups.length === 0 && (
                  <p className="text-xs text-slate-400 italic">
                    Nenhum grupo customizável foi cadastrado para este produto.
                  </p>
                )}

                <div className="space-y-3">
                  {groups.map((group) => {
                    const currentVal = selectedColors[group.name] || group.availableColors[0] || "#111827";

                    return (
                      <div
                        key={group.name}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70"
                      >
                        <span className="capitalize text-slate-800 text-xs font-bold">
                          {group.name}:
                        </span>

                        <div className="flex gap-2 items-center">
                          {group.availableColors.map((hex: string) => (
                            <button
                              key={hex}
                              type="button"
                              onClick={() => handleColorChange(group.name, hex)}
                              className={`w-6 h-6 rounded-full border-2 transition-transform ${currentVal === hex
                                ? "border-slate-900 scale-125 shadow-xs ring-2 ring-emerald-500/40 ring-offset-1"
                                : "border-slate-300 hover:scale-110 opacity-80 hover:opacity-100"
                                }`}
                              style={{ backgroundColor: hex }}
                              title={hex}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                    Quantidade
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Unidades desta configuração</span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 border border-slate-200 rounded-xl p-2.5 text-center text-slate-900 font-black text-sm bg-slate-50 focus:bg-white focus:outline-emerald-500 transition-all font-mono"
                  />

                  {!editingId ? (
                    <button
                      type="button"
                      onClick={handleAddVariation}
                      title="Salvar variação montada"
                      className="bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-xl transition-colors flex items-center justify-center shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmEdit}
                        title="Confirmar alteração"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl transition-colors shadow-xs"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        title="Cancelar edição"
                        className="bg-slate-300 hover:bg-slate-400 text-slate-800 p-3 rounded-xl transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Variações na Lista ({variations.length})
                </h3>
                <span className="text-[11px] text-slate-400 font-medium font-mono">
                  Total: R$ {variations.reduce((acc, v) => acc + v.quantity * Number(product.basePrice), 0).toFixed(2)}
                </span>
              </div>

              {variations.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">
                  Nenhuma variação adicionada. Escolha as cores e clique no botão (+) para listar.
                </p>
              ) : (
                <div className="space-y-3">
                  {variations.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${editingId === item.id
                        ? "border-amber-500 bg-amber-50/50"
                        : "border-slate-200/80 bg-white shadow-2xs"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt="Preview"
                            className="w-12 h-12 rounded-xl bg-slate-900 object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-medium shrink-0">
                            Sem foto
                          </div>
                        )}

                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900 font-mono">
                            #{idx + 1} • {item.quantity} un. (R${" "}
                            {(item.quantity * Number(product.basePrice)).toFixed(2)})
                          </span>

                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {Object.entries(item.configuration)
                              .filter(([key]) => key !== "[object Object]" && !key.startsWith("Body") && !key.startsWith("body"))
                              .map(([groupName, hexColor]) => (
                                <div key={groupName} className="flex items-center gap-1.5 text-[10px] text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-slate-300 block shadow-2xs"
                                    style={{ backgroundColor: hexColor }}
                                  />
                                  <span className="capitalize font-semibold">{groupName}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>

                      <div className="relative">
                        {editingId === item.id ? (
                          <span className="text-[10px] font-black text-amber-600 uppercase bg-amber-100 px-2.5 py-1 rounded-md">
                            Editando...
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === item.id ? null : item.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuId === item.id && (
                              <div className="absolute right-0 top-8 bg-white border border-slate-200 shadow-xl rounded-xl py-1 w-32 z-10 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(item)}
                                  className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-bold"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVariation(item.id)}
                                  className="w-full px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-bold"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Excluir
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handlePushToCart}
                disabled={variations.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-xs text-xs"
              >
                <ShoppingCart className="w-4 h-4" />
                Adicionar Variações ao Carrinho ({variations.length})
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}