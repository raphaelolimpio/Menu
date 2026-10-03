"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import api, { API_URL } from "@/services/api";
import {
  Upload,
  Trash2,
  Plus,
  Check,
  Percent,
  Layers,
  Palette,
  Eye,
  Edit3,
  X,
  Box,
  Clock,
  Sparkles,
  Search,
  PackageOpen,
  DollarSign,
  SlidersHorizontal,
  ChevronRight
} from "lucide-react";
import { extractBodiesFromGlb } from "@/utils/parseGlbBodies";
import { AdminInspectorHandle } from "./AdminModelInspector";

const AdminModelInspector = dynamic(() => import("./AdminModelInspector"), { ssr: false });

export interface CustomPartGroup {
  name: string;
  bodies: string[];
  availableColors: string[];
}

interface DiscountRule {
  minQty: number;
  discountPercent: number;
}

const PALETTE_OPTIONS = [
  "#1E3A8A", "#FFFFFF", "#111827", "#DC2626", "#F59E0B",
  "#10B981", "#6B7280", "#8B5CF6", "#EC4899", "#D97706", "#64748B"
];

export default function ProductManagement() {
  const inspectorRef = useRef<AdminInspectorHandle>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Estado do Modal de Cadastro / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [existingModelUrl, setExistingModelUrl] = useState<string | null>(null);

  // Estados dos Campos do Produto
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [estimatedTimeMin, setEstimatedTimeMin] = useState("");

  // Grupos Customizáveis e Corpos
  const [detectedBodies, setDetectedBodies] = useState<string[]>([]);
  const [focusedBodies, setFocusedBodies] = useState<string[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedBodiesForGroup, setSelectedBodiesForGroup] = useState<string[]>([]);
  const [groupColors, setGroupColors] = useState<string[]>(["#1E3A8A", "#FFFFFF", "#111827"]);
  const [customGroups, setCustomGroups] = useState<CustomPartGroup[]>([]);

  // Regras de Desconto
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [ruleQty, setRuleQty] = useState("");
  const [rulePercent, setRulePercent] = useState("");

  const getStoreId = () => {
    if (typeof window !== "undefined") {
      const storeData = localStorage.getItem("store");
      return storeData ? JSON.parse(storeData).id : "";
    }
    return "";
  };

  const storeId = getStoreId();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/products?storeId=${storeId}`);
      setProducts(res.data || []);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewModal = () => {
    setEditingProductId(null);
    setExistingModelUrl(null);
    setFile(null);
    setName("");
    setSku("");
    setDescription("");
    setBasePrice("");
    setEstimatedTimeMin("");
    setDetectedBodies([]);
    setCustomGroups([]);
    setDiscountRules([]);
    setIsModalOpen(true);
  };

  const handleStartEditProduct = (prod: any) => {
    if (!prod || !prod.id) return;

    setEditingProductId(prod.id);
    setExistingModelUrl(prod.model3dUrl || null);
    setName(prod.name || "");
    setSku(prod.sku || "");
    setDescription(prod.description || "");
    setBasePrice(String(prod.basePrice || "0"));
    setEstimatedTimeMin(String(prod.estimatedTimeMin || "0"));
    setFile(null);

    const groups = Array.isArray(prod.customizableParts)
      ? prod.customizableParts
      : typeof prod.customizableParts === "string"
      ? JSON.parse(prod.customizableParts || "[]")
      : [];
    setCustomGroups(groups);

    const allRegisteredBodies = groups.flatMap((g: CustomPartGroup) => g.bodies || []);
    setDetectedBodies(Array.from(new Set(allRegisteredBodies)));

    const discounts = Array.isArray(prod.discountRules)
      ? prod.discountRules
      : typeof prod.discountRules === "string"
      ? JSON.parse(prod.discountRules || "[]")
      : [];
    setDiscountRules(discounts);

    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProductId(null);
    setExistingModelUrl(null);
    setFile(null);
    setName("");
    setSku("");
    setDescription("");
    setBasePrice("");
    setEstimatedTimeMin("");
    setDetectedBodies([]);
    setCustomGroups([]);
    setDiscountRules([]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    try {
      const bodies = await extractBodiesFromGlb(selectedFile);
      setDetectedBodies(bodies);
    } catch (err) {
      alert("Erro ao ler meshes do modelo 3D.");
    }
  };

  const groupedBodiesPreview = customGroups.reduce((acc, g) => {
    const primaryColor = g.availableColors[0] || "#94A3B8";
    g.bodies.forEach((b) => {
      acc[b] = primaryColor;
    });
    return acc;
  }, {} as Record<string, string>);

  const toggleBodySelection = (bodyName: string) => {
    setSelectedBodiesForGroup((prev) =>
      prev.includes(bodyName) ? prev.filter((b) => b !== bodyName) : [...prev, bodyName]
    );
  };

  const toggleGroupColor = (hex: string) => {
    setGroupColors((prev) =>
      prev.includes(hex) ? prev.filter((c) => c !== hex) : [...prev, hex]
    );
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim() || selectedBodiesForGroup.length === 0) {
      alert("Preencha o nome do grupo e selecione ao menos um body.");
      return;
    }
    setCustomGroups((prev) => [
      ...prev,
      {
        name: newGroupName,
        bodies: selectedBodiesForGroup,
        availableColors: groupColors,
      },
    ]);
    setNewGroupName("");
    setSelectedBodiesForGroup([]);
    setFocusedBodies([]);
  };

  const handleRemoveGroup = (idx: number) => {
    setCustomGroups((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddDiscountRule = () => {
    const qty = parseInt(ruleQty);
    const pct = parseFloat(rulePercent);
    if (!qty || !pct) return;

    setDiscountRules((prev) => [...prev, { minQty: qty, discountPercent: pct }]);
    setRuleQty("");
    setRulePercent("");
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProductId && !file) {
      alert("Carregue o arquivo .GLB do produto.");
      return;
    }

    const snapshotBase64 = inspectorRef.current?.captureSnapshot();

    const formData = new FormData();
    if (file) formData.append("file3d", file);
    formData.append("name", name);
    formData.append("sku", sku);
    formData.append("description", description);
    formData.append("basePrice", basePrice);
    formData.append("estimatedTimeMin", estimatedTimeMin || "0");
    formData.append("customizableParts", JSON.stringify(customGroups));
    formData.append("discountRules", JSON.stringify(discountRules));
    formData.append("storeId", storeId);

    if (snapshotBase64) {
      formData.append("thumbnailUrl", snapshotBase64);
    }

    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      if (editingProductId) {
        await api.put(`/api/products/${editingProductId}`, formData, config);
        alert("Produto atualizado com sucesso!");
      } else {
        await api.post("/api/products", formData, config);
        alert("Produto cadastrado com sucesso!");
      }
      handleCloseModal();
      loadProducts();
    } catch (err: any) {
      const backendError = err.response?.data?.error || err.message;
      alert("Erro ao salvar produto: " + backendError);
      console.error("Detalhes do erro:", err.response?.data);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Deseja excluir este modelo 3D permanentemente?")) return;
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      await api.delete(`/api/products/${id}`, config);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      if (editingProductId === id) handleCloseModal();
      alert("Produto excluído com sucesso!");
      loadProducts();
    } catch (err: any) {
      alert("Erro ao excluir produto: " + (err.response?.data?.error || err.message));
    }
  };

  const hasModelToInspect = !!file || !!existingModelUrl;

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = (p.name || "").toLowerCase().includes(term);
    const skuMatch = (p.sku || "").toLowerCase().includes(term);
    return nameMatch || skuMatch;
  });

  const totalCatalogItems = products.length;
  const avgPrice =
    totalCatalogItems > 0
      ? products.reduce((acc, p) => acc + Number(p.basePrice || 0), 0) / totalCatalogItems
      : 0;

  return (
    <div className="space-y-6">
      
      {/* 1. BARRA SUPERIOR DE AÇÕES E INDICADORES DA LINHA DE PRODUTOS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 border border-slate-200/90 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block font-mono">
            Modelos no Catálogo
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalCatalogItems}</p>
          <span className="text-[11px] text-slate-500 font-medium">Peças ativas para vendas</span>
        </div>

        <div className="bg-white p-4.5 border border-slate-200/90 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block font-mono">
            Preço Médio Unitário
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            R$ {avgPrice.toFixed(2)}
          </p>
          <span className="text-[11px] text-slate-500 font-medium">Base de portfólio</span>
        </div>

        <div className="bg-white p-4.5 border border-slate-200/90 rounded-2xl shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block font-mono">
            Engenharia & 3D
          </span>
          <button
            type="button"
            onClick={handleOpenNewModal}
            className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Novo Modelo 3D</span>
          </button>
        </div>
      </div>

      {/* 2. TABELA / LISTA PRINCIPAL DE PRODUTOS */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Header da Tabela com Campo de Pesquisa Instantânea */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Peças Industriais & Modelos Cadastrados ({filteredProducts.length})
            </h2>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou SKU..."
              className="w-full text-xs border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 bg-white font-medium focus:outline-emerald-500"
            />
          </div>
        </div>

        {/* Linhas de Produtos */}
        <div className="divide-y divide-slate-100">
          {filteredProducts.length === 0 ? (
            <div className="p-16 text-center text-slate-400">
              <PackageOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-bold text-slate-700">Nenhum modelo localizado.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Clique no botão "Novo Modelo 3D" acima para enviar uma peça .GLB ao sistema.
              </p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const groupsCount = Array.isArray(p.customizableParts)
                ? p.customizableParts.length
                : typeof p.customizableParts === "string"
                ? JSON.parse(p.customizableParts || "[]").length
                : 0;

              return (
                <div
                  key={p.id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row justify-between lg:items-center gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Preview da Peça */}
                    <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                      {p.thumbnailUrl ? (
                        <img
                          src={p.thumbnailUrl}
                          alt={p.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <Box className="w-6 h-6 text-slate-600" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-black text-slate-900">{p.name}</h3>
                        <span className="text-[10px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md">
                          SKU: {p.sku || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        <span className="font-mono font-bold text-emerald-600 text-sm">
                          R$ {Number(p.basePrice || 0).toFixed(2)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {p.estimatedTimeMin || 0} min fabril
                        </span>
                        <span>•</span>
                        <span className="text-[11px] text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-semibold">
                          {groupsCount} grupo(s) de cores
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ações da Peça */}
                  <div className="flex items-center gap-2 self-end lg:self-center">
                    <button
                      type="button"
                      onClick={() => handleStartEditProduct(p)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-colors border border-slate-200/80 shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(p.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl text-xs font-bold transition-colors border border-slate-200/80"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL EXECUTIVO: CADASTRO / EDIÇÃO DO MODELO 3D                       */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in-50 duration-150">
            
            {/* Topo do Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    {editingProductId ? `Editando Modelo: ${sku}` : "Novo Modelo 3D & Engenharia Fabril"}
                  </h3>
                  <p className="text-[11px] text-slate-400">Inspeção de malhas, grupos de acabamento e regras comerciais</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corpo do Modal Rolável */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Upload do Arquivo .GLB */}
              <div className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-2xl p-5 text-center hover:bg-slate-50/50 transition-colors">
                <input type="file" accept=".glb" id="file3d_modal" onChange={handleFileChange} className="hidden" />
                <label htmlFor="file3d_modal" className="cursor-pointer flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shadow-2xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      {file
                        ? file.name
                        : editingProductId
                        ? "Substituir arquivo 3D .GLB existente (opcional)"
                        : "Carregar arquivo 3D (.GLB)"}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Geometrias Fusion 360, Blender ou exportação glTF nativa
                    </span>
                  </div>
                </label>
              </div>

              {/* Viewport 3D de Inspeção */}
              {hasModelToInspect && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-800 tracking-wider">
                    <Eye className="w-4 h-4 text-emerald-600" /> Viewport de Inspeção de Corpos
                  </div>
                  <AdminModelInspector
                    ref={inspectorRef}
                    file={file}
                    modelUrl={existingModelUrl}
                    highlightedBodies={focusedBodies.length > 0 ? focusedBodies : selectedBodiesForGroup}
                    groupedBodies={groupedBodiesPreview}
                    onMeshClick={(clickedBody) => {
                      toggleBodySelection(clickedBody);
                      setFocusedBodies([clickedBody]);
                    }}
                  />
                </div>
              )}

              {/* Dados Básicos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Nome do Modelo</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Cadeira Adulto Pro"
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-semibold focus:bg-white focus:outline-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">SKU / Código</label>
                  <input
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="CAD-ADU-001"
                    className="w-full text-xs font-mono font-bold uppercase border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Preço Base (R$)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="189.90"
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-black focus:bg-white focus:outline-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Tempo Fabril (Min)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={estimatedTimeMin}
                    onChange={(e) => setEstimatedTimeMin(e.target.value)}
                    placeholder="Ex: 45"
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:outline-emerald-500"
                    title="Tempo estimado de fabricação por unidade"
                  />
                </div>
              </div>

              {/* Gerenciamento de Grupos Customizáveis */}
              <div className="border border-slate-200/90 bg-slate-50/70 p-5 rounded-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Grupos de Cores do Produto ({customGroups.length})
                  </h3>
                </div>

                {detectedBodies.length > 0 && (
                  <div className="space-y-4">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                        Corpos Identificados (Clique para vincular ao grupo):
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2.5 bg-white rounded-xl border border-slate-200">
                        {detectedBodies.map((b) => (
                          <button
                            type="button"
                            key={b}
                            onMouseEnter={() => setFocusedBodies([b])}
                            onMouseLeave={() => setFocusedBodies([])}
                            onClick={() => toggleBodySelection(b)}
                            className={`text-[10px] px-2.5 py-1 rounded-lg font-mono border transition-all ${
                              selectedBodiesForGroup.includes(b)
                                ? "bg-slate-900 text-emerald-400 border-slate-900 font-bold shadow-2xs"
                                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Nome do Grupo:</label>
                        <input
                          type="text"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          placeholder="Ex: Assento, Estrutura, Ponteiras..."
                          className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white font-semibold focus:outline-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Paleta de Cores Permitidas:</label>
                        <div className="flex flex-wrap gap-2">
                          {PALETTE_OPTIONS.map((hex) => (
                            <button
                              type="button"
                              key={hex}
                              onClick={() => toggleGroupColor(hex)}
                              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                                groupColors.includes(hex)
                                  ? "border-slate-900 scale-125 shadow-xs ring-2 ring-emerald-500/40"
                                  : "border-slate-300 opacity-60 hover:opacity-100"
                              }`}
                              style={{ backgroundColor: hex }}
                            >
                              {groupColors.includes(hex) && <Check className="w-3 h-3 text-white stroke-[3] mx-auto" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddGroup}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Grupo Customizável
                    </button>
                  </div>
                )}

                {/* Cards dos Grupos Cadastrados */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {customGroups.map((g, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded-xl p-3.5 flex justify-between items-start text-xs shadow-2xs"
                    >
                      <div>
                        <strong className="text-slate-900 font-bold block">{g.name}</strong>
                        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                          Corpos: {g.bodies.join(", ")}
                        </span>
                        <div className="flex gap-1.5 mt-2">
                          {g.availableColors.map((c) => (
                            <span
                              key={c}
                              className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs block"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveGroup(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regras de Desconto */}
              <div className="space-y-3 border-t border-slate-100 pt-5">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Desconto Progressivo por Volume
                  </h3>
                </div>

                <div className="flex gap-2 items-center flex-wrap">
                  <input
                    type="number"
                    placeholder="Qtd Mínima (Ex: 10)"
                    value={ruleQty}
                    onChange={(e) => setRuleQty(e.target.value)}
                    className="w-36 text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-bold"
                  />
                  <input
                    type="number"
                    placeholder="Desconto % (Ex: 5)"
                    value={rulePercent}
                    onChange={(e) => setRulePercent(e.target.value)}
                    className="w-36 text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleAddDiscountRule}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 transition-colors"
                  >
                    + Adicionar Regra
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {discountRules.map((r, i) => (
                    <span
                      key={i}
                      className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-2 font-bold"
                    >
                      A partir de {r.minQty} un: {r.discountPercent}% OFF
                      <button
                        type="button"
                        onClick={() => setDiscountRules(discountRules.filter((_, idx) => idx !== i))}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Botões do Rodapé do Modal */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs"
                >
                  {editingProductId ? "Salvar Alterações do Modelo" : "Cadastrar Modelo no Catálogo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}