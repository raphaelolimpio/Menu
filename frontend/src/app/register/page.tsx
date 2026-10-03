"use client";

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api, { API_URL } from "@/services/api";
import {
  Store,
  UserCheck,
  ArrowRight,
  Lock,
  Mail,
  User,
  Building,
  Layers,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  ShieldCheck
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<"OWNER" | "SELLER">("SELLER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeCode, setStoreCode] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);

    try {
      const res = await api.post("/api/auth/register", {
        name,
        email,
        password,
        accountType,
        storeName: accountType === "OWNER" ? storeName : undefined,
        storeCode: accountType === "SELLER" ? storeCode.trim().toUpperCase() : undefined,
      });

      if (accountType === "OWNER") {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("store", JSON.stringify(res.data.store));

        // Notifica componentes globais (ex: Navbar)
        window.dispatchEvent(new Event("storage-updated"));

        router.push("/admin");
      } else {
        setMsg("Cadastro enviado com sucesso! Aguarde a aprovação do proprietário para realizar o login.");
        setName("");
        setEmail("");
        setPassword("");
        setStoreCode("");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 flex items-center justify-center p-4 font-sans selection:bg-emerald-500 selection:text-slate-950">
      <div className="max-w-md w-full space-y-6">

        {/* Card Principal */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-8 shadow-2xl space-y-6">

          {/* Cabeçalho */}
          <div className="text-left space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 mb-3 shadow-2xs">
              <UserPlus className="w-5 h-5" />
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Criar Conta
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Inicie uma nova loja para produção 3D ou vincule-se à equipe de vendas de uma fábrica parceira.
            </p>
          </div>

          {/* Alternador de Perfil */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200/70">
            <button
              type="button"
              onClick={() => {
                setAccountType("SELLER");
                setError("");
                setMsg("");
              }}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                accountType === "SELLER"
                  ? "bg-white text-slate-900 shadow-2xs border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-600" /> Sou Vendedor
            </button>

            <button
              type="button"
              onClick={() => {
                setAccountType("OWNER");
                setError("");
                setMsg("");
              }}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                accountType === "OWNER"
                  ? "bg-white text-slate-900 shadow-2xs border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Store className="w-4 h-4 text-emerald-600" /> Criar Loja
            </button>
          </div>

          {/* Alertas */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200/80 text-rose-700 text-xs rounded-xl font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {msg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{msg}</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleRegister} className="space-y-4 pt-1">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                Nome Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full text-xs border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:outline-emerald-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                E-mail Corporativo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@empresa.com"
                  className="w-full text-xs border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:outline-emerald-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:outline-emerald-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {accountType === "OWNER" ? (
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  Nome da Empresa / Fábrica
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Ex: Minha Indústria 3D"
                    className="w-full text-xs border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:outline-emerald-500 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  Código de Convite da Loja
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    required
                    value={storeCode}
                    onChange={(e) => setStoreCode(e.target.value.toUpperCase())}
                    placeholder="Ex: LOJA-A1B2C"
                    className="w-full text-xs font-mono border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 bg-slate-50 text-slate-900 font-black uppercase tracking-wider focus:bg-white focus:outline-emerald-500 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 text-xs disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Cadastrando...</span>
                </>
              ) : (
                <>
                  <span>
                    {accountType === "OWNER"
                      ? "Cadastrar Loja e Acessar"
                      : "Solicitar Entrada na Equipe"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Link para Login */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Já possui uma conta ativa?{" "}
              <Link href="/login" className="text-emerald-600 font-bold hover:underline">
                Acessar Login
              </Link>
            </p>
          </div>
        </div>

        {/* Rodapé com Assinatura da Marca */}
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Layers className="w-3 h-3" />
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            Catálogo 3D <span className="font-mono text-slate-600">• SISTEMA ERP</span>
          </span>
        </div>

      </div>
    </div>
  );
}