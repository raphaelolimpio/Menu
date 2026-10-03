"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import api, { API_URL } from "@/services/api";
import {
  X,
  Search,
  UserPlus,
  Edit2,
  QrCode,
  Barcode,
  CheckCircle2,
  Download,
  CreditCard,
  Building,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Receipt
} from "lucide-react";
import { CartVariation } from "@/context/CartContext";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: CartVariation[];
  totalAmount: number;
  appliedDiscount?: number;
  sellerId?: string | null;
  storeId?: string | null;
  onOrderCompleted: () => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  selectedItems,
  totalAmount,
  appliedDiscount = 0,
  sellerId,
  storeId,
  onOrderCompleted,
}: CheckoutModalProps) {
  const [tab, setTab] = useState<"search" | "create" | "details">("search");
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const getActiveStoreId = () => {
    if (storeId) return storeId;
    if (typeof window !== "undefined") {
      const storedStore = localStorage.getItem("store");
      if (storedStore) {
        try {
          return JSON.parse(storedStore).id;
        } catch {
          return null;
        }
      }
    }
    return null;
  };

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    responsibleArea: "",
    phone: "",
    email: "",
    address: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "BOLETO">("PIX");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderResult, setOrderResult] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen]);

  const loadCustomers = (query = "") => {
    const sId = getActiveStoreId();
    api
      .get(`/api/customers?search=${encodeURIComponent(query)}&storeId=${sId || ""}`)
      .then((res) => setCustomers(res.data))
      .catch(console.error);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomers(searchTerm);
  };

  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setFormData(customer);
    setTab("details");
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const sId = getActiveStoreId();
    try {
      if (formData.id) {
        const res = await api.put(`/api/customers/${formData.id}`, {
          ...formData,
          storeId: sId,
        });
        setSelectedCustomer(res.data);
      } else {
        const res = await api.post("/api/customers", {
          ...formData,
          storeId: sId,
        });
        setSelectedCustomer(res.data);
      }
      setTab("details");
      loadCustomers();
    } catch (err: any) {
      alert("Erro ao salvar cliente: " + (err.response?.data?.error || err.message));
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedCustomer) {
      alert("Selecione ou cadastre um cliente antes de prosseguir.");
      return;
    }

    const sId = getActiveStoreId();
    if (!sId) {
      alert("Erro: ID da loja não identificado. Faça login novamente para prosseguir.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await api.post("/api/orders", {
        customerId: selectedCustomer.id,
        storeId: sId,
        sellerId: sellerId || null,
        appliedDiscount: Number(appliedDiscount) || 0,
        paymentMethod,
        items: selectedItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          configuration: item.configuration,
        })),
      });

      const orderData = res.data;
      setOrderResult(orderData);

      // ========================================================
      // DISPARA A NOTIFICAÇÃO GLOBAL NO SISTEMA
      // ========================================================
      try {
        const orderIdFormatted = `PED-${new Date().getFullYear()}-${String(orderData.id || "").padStart(4, "0")}`;
        const newNotif = {
          id: String(Date.now()),
          title: `Novo Pedido Emitido: ${orderIdFormatted}`,
          desc: `Cliente ${selectedCustomer.name} via ${paymentMethod} (R$ ${Number(totalAmount).toFixed(2)}).`,
          time: "Agora",
          read: false,
        };

        const stored = localStorage.getItem("system_notifications");
        const currentList = stored ? JSON.parse(stored) : [];
        const updatedList = [newNotif, ...currentList.filter((n: any) => n.id !== newNotif.id)];
        
        localStorage.setItem("system_notifications", JSON.stringify(updatedList));
        window.dispatchEvent(new Event("notifications-updated"));
      } catch (e) {
        console.error("Erro ao registrar notificação:", e);
      }

      onOrderCompleted();
    } catch (err: any) {
      alert("Erro ao emitir pedido: " + (err.response?.data?.error || err.message));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">Finalização de Pedido</h2>
              <p className="text-[10px] text-slate-500 font-mono">EMISSÃO COMERCIAL & FATURAMENTO</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200/60 rounded-xl transition-colors text-slate-400 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 overflow-y-auto">
          
          {/* LADO ESQUERDO: GESTÃO DO CLIENTE */}
          <div className="p-6 flex flex-col space-y-4">
            
            {/* Alternador de Tabs */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200/60">
              <button
                type="button"
                onClick={() => setTab("search")}
                className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                  tab === "search" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Search className="w-3.5 h-3.5" /> Clientes
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({ id: "", name: "", responsibleArea: "", phone: "", email: "", address: "" });
                  setTab("create");
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                  tab === "create" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> Novo Cadastro
              </button>
            </div>

            {/* TAB: BUSCAR CLIENTE */}
            {tab === "search" && (
              <div className="flex-1 flex flex-col space-y-3">
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    placeholder="Pesquisar por nome, espaço ou e-mail..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </form>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[320px]">
                  {customers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className="p-3 border border-slate-200 rounded-xl hover:border-slate-900 hover:bg-slate-50/70 cursor-pointer transition-all"
                    >
                      <h4 className="text-xs font-black text-slate-900">{c.name}</h4>
                      <p className="text-[11px] text-slate-500">{c.responsibleArea || "Sem local informado"}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">
                        {c.email} • {c.phone}
                      </p>
                    </div>
                  ))}
                  {customers.length === 0 && (
                    <p className="text-center text-xs text-slate-400 py-12">Nenhum cliente cadastrado.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB: NOVO CADASTRO */}
            {tab === "create" && (
              <form onSubmit={handleSaveCustomer} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nome Completo</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-semibold focus:bg-white focus:outline-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Espaço / Setor Responsável</label>
                  <input
                    required
                    value={formData.responsibleArea}
                    onChange={(e) => setFormData({ ...formData, responsibleArea: e.target.value })}
                    placeholder="Ex: Refeitório, Laboratório..."
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-semibold focus:bg-white focus:outline-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Telefone</label>
                    <input
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="63984192611"
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-semibold focus:bg-white focus:outline-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">E-mail</label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="cliente@empresa.com"
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-semibold focus:bg-white focus:outline-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Endereço de Entrega</label>
                  <input
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-semibold focus:bg-white focus:outline-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 rounded-xl transition-colors shadow-xs"
                >
                  Salvar Dados do Cliente
                </button>
              </form>
            )}

            {/* TAB: DETALHES DO CLIENTE SELECIONADO */}
            {tab === "details" && selectedCustomer && (
              <div className="flex-1 flex flex-col justify-between bg-slate-50/70 border border-slate-200 rounded-xl p-5">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Cliente Ativo</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black">
                      ✓ Identificado
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{selectedCustomer.name}</h3>
                    <p className="text-xs text-slate-600 font-medium">{selectedCustomer.responsibleArea}</p>
                  </div>
                  <div className="text-xs space-y-1.5 text-slate-500 pt-3 border-t border-slate-200/60">
                    <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {selectedCustomer.email}</p>
                    <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedCustomer.phone}</p>
                    <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {selectedCustomer.address}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTab("create")}
                  className="mt-6 flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 rounded-xl transition-colors shadow-2xs"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar Cadastro
                </button>
              </div>
            )}
          </div>

          {/* LADO DIREITO: PAGAMENTO E RESUMO */}
          <div className="p-6 flex flex-col justify-between space-y-6">
            {!orderResult ? (
              <>
                <div className="space-y-5">
                  <div>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider block mb-3">
                      Forma de Pagamento
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("PIX")}
                        className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 text-xs font-bold transition-all ${
                          paymentMethod === "PIX"
                            ? "border-emerald-600 bg-emerald-500/10 text-emerald-950 shadow-2xs"
                            : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                        }`}
                      >
                        <QrCode className="w-6 h-6 text-emerald-600" />
                        PIX Instantâneo
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("BOLETO")}
                        className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 text-xs font-bold transition-all ${
                          paymentMethod === "BOLETO"
                            ? "border-emerald-600 bg-emerald-500/10 text-emerald-950 shadow-2xs"
                            : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                        }`}
                      >
                        <Barcode className="w-6 h-6 text-slate-700" />
                        Boleto Bancário
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Total de Peças:</span>
                      <span className="font-bold text-slate-900">{selectedItems.length} variação(ões)</span>
                    </div>
                    {appliedDiscount > 0 && (
                      <div className="flex justify-between text-xs text-rose-600 font-bold">
                        <span>Desconto Comercial:</span>
                        <span>-{appliedDiscount}%</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-2.5">
                      <span>Total da Ordem:</span>
                      <span className="text-emerald-600 text-lg font-mono">R$ {totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleProcessPayment}
                  disabled={isProcessing || !selectedCustomer}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-40 shadow-xs text-xs"
                >
                  {isProcessing ? "Emitindo Pedido..." : `Confirmar Emissão via ${paymentMethod}`}
                </button>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-6">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {paymentMethod === "PIX" ? "Pagamento Realizado com Sucesso!" : "Boleto Gerado com Sucesso!"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                    Documentos fiscais registrados e vinculados à loja comercial com sucesso.
                  </p>
                </div>

                <div className="w-full space-y-2 pt-2">
                  {orderResult?.pdfUrl && (
                    <a
                      href={`${API_URL}${orderResult.pdfUrl.startsWith('/') ? orderResult.pdfUrl : `/${orderResult.pdfUrl}`}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 py-2.5 rounded-xl text-xs font-bold text-slate-700 shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" /> Baixar Ordem de Pedido (PDF)
                    </a>
                  )}
                  {orderResult.receiptPdfUrl && (
                    <a
                      href={`${API_URL}${orderResult.receiptPdfUrl}`}
                      target="_blank"
                      download
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" /> Baixar Comprovante
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}