"use client";

import React, { useState, Suspense } from "react";
import axios from "axios";
import api, { API_URL } from "@/services/api";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Layers
} from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError("Token de recuperação ausente ou inválido. Solicite um novo link.");
      return;
    }

    if (newPassword.length < 6) {
      setError("A nova senha deve possuir no mínimo 6 caracteres.");
      return;
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      setError("As senhas informadas não coincidem.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await api.post("/api/auth/reset-password", {
        token,
        newPassword,
      });

      setMessage(res.data.message || "Senha redefinida com sucesso!");
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao redefinir senha. O token pode ter expirado.");
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

          {/* Título & Descrição */}
          <div className="text-left space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 mb-3 shadow-2xs">
              <KeyRound className="w-5 h-5" />
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Definir Nova Senha
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Crie uma nova credencial segura para restabelecer o acesso ao seu painel e pedidos.
            </p>
          </div>

          {/* Alertas */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200/80 text-rose-700 text-xs rounded-xl font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{message} Redirecionando para o login...</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleReset} className="space-y-4 pt-1">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="No mínimo 6 dígitos"
                  disabled={loading || !!message}
                  className="w-full text-xs border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:outline-emerald-500 transition-all placeholder:text-slate-400 disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita sua nova senha"
                  disabled={loading || !!message}
                  className="w-full text-xs border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:outline-emerald-500 transition-all placeholder:text-slate-400 disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!message}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 text-xs disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando nova senha...</span>
                </>
              ) : (
                <>
                  <span>Atualizar e Entrar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
          <div className="w-8 h-8 border-3 border-slate-800 border-t-emerald-500 rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-400">Verificando token de segurança...</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}