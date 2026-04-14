"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        return;
      }

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="w-full max-w-md animate-fade-in">
        <Link href="/" className="block text-center mb-2 text-indigo-600 font-bold text-xl">🔐 SaaS Auth</Link>
        <h1 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border p-6 space-y-4">
          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input name="email" type="email" required className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input name="password" type="password" required className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition font-semibold shadow-md hover:shadow-lg"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
          <p className="text-center text-sm text-slate-500">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-indigo-600 hover:underline font-medium">Regístrate</Link>
          </p>
        </form>
        <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm">
          <p className="font-semibold text-indigo-700 mb-2">🧪 Credenciales demo</p>
          <div className="space-y-1 text-slate-600">
            <p><span className="font-medium">Owner:</span> admin@demo.com</p>
            <p><span className="font-medium">Admin:</span> maria@demo.com</p>
            <p><span className="font-medium">Member:</span> carlos@demo.com</p>
            <p className="text-slate-400 mt-1">Contraseña: Demo1234!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
