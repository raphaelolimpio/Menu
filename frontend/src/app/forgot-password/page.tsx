"use client";

import React, { useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Send,
  Layers,
  AlertCircle,
  CheckCircle2,
  KeyRound
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:3333/api/auth/forgot-password", { email });
      setMessage(res.data.message || "Instruções enviadas com sucesso para seu e-mail.");
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao solicitar recuperação de senha.");
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
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Login
            </Link>

            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
              Segurança
            </span>
          </div>

          {/* Identidade Visual & Título */}
          <div className="text-left space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 mb-3 shadow-2xs">
              <KeyRound className="w-5 h-5" />
            </div>
            
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Recuperar Acesso
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Informe o endereço de e-mail cadastrado na sua conta para receber o link de redefinição de senha.
            </p>
          </div>

          {/* Mensagens de Retorno */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200/80 text-rose-700 text-xs rounded-xl font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{message}</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 text-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Enviando instruções...</span>
                </>
              ) : (
                <>
                  <span>Enviar Link de Recuperação</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Rodapé com Assinatura da Plataforma */}
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