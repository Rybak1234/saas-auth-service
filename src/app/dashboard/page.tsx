"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
}

interface AuditEntry {
  id: string;
  action: string;
  createdAt: string;
  user: { email: string; name: string };
  ip?: string;
  details?: string;
}

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" };
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [tab, setTab] = useState<"team" | "audit">("team");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(stored));
    fetchTeam();
    fetchAudit();
  }, []);

  const fetchTeam = async () => {
    const res = await fetch("/api/users", { headers: authHeaders() });
    if (res.ok) setTeam(await res.json());
  };

  const fetchAudit = async () => {
    const res = await fetch("/api/audit", { headers: authHeaders() });
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs || []);
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const toggleActive = async (id: string, active: boolean) => {
    await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ active: !active }),
    });
    fetchTeam();
  };

  if (!user) return null;

  const roleColor: Record<string, string> = {
    owner: "bg-purple-100 text-purple-700",
    admin: "bg-blue-100 text-blue-700",
    member: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="min-h-screen">
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-indigo-600">SaaS Auth</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{user.email}</span>
            <span className={`px-2 py-0.5 rounded text-xs ${roleColor[user.role]}`}>{user.role}</span>
            <button onClick={logout} className="text-sm text-red-500 hover:underline">
              Salir
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setTab("team")}
            className={`px-4 py-2 rounded text-sm font-medium ${tab === "team" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border"}`}
          >
            Equipo
          </button>
          <button
            onClick={() => setTab("audit")}
            className={`px-4 py-2 rounded text-sm font-medium ${tab === "audit" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border"}`}
          >
            Auditoría
          </button>
        </div>

        {tab === "team" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {team.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-slate-500">{m.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${roleColor[m.role] || "bg-gray-100"}`}>
                        {m.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs ${m.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {m.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.id !== user.id && (user.role === "owner" || (user.role === "admin" && m.role === "member")) && (
                        <button
                          onClick={() => toggleActive(m.id, m.active)}
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          {m.active ? "Desactivar" : "Activar"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "audit" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3">Acción</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Detalles</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">{log.user.email}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs max-w-xs truncate">
                      {log.details || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{log.ip || "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(log.createdAt).toLocaleString("es-MX")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
