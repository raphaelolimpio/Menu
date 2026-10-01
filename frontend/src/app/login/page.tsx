"use client";

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, ArrowRight, Lock, Mail, Layers, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:3333/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      if (res.data.store) {
        localStorage.setItem("store", JSON.stringify(res.data.store));
      }

      // Sincroniza o Navbar instantaneamente
      window.dispatchEvent(new Event("storage-updated"));

      router.push("/admin");
    } catch (err: any) {
      setError(err.response?.data?.error || "Credenciais inválidas ou erro ao conectar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 flex items-center justify-center p-4 font-sans selection:bg-emerald-500 selection:text-slate-950">
      <div className="max-w-md w-full space-y-6">

        {/* Card Principal */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-8 shadow-2xl space-y-6">
          
          {/* Cabeçalho do Card */}
          <div className="text-left space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 mb-3 shadow-2xs">
              <LogIn className="w-5 h-5" />
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Acessar Plataforma
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Entre com suas credenciais para gerenciar produtos 3D, ordens de fábrica e vendas.
            </p>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200/80 text-rose-700 text-xs rounded-xl font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-4 pt-1">
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Senha
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 text-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Validando acesso...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Link para Cadastro */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Ainda não tem acesso?{" "}
              <Link
                href="/register"
                className="text-emerald-600 font-bold hover:underline"
              >
                Cadastre-se ou entre com código
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