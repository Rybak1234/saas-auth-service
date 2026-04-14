"use client";

import { useState, useEffect, useCallback } from "react";
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

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  stats: { userCount: number; activeUsers: number; sessionCount: number; auditCount: number };
}

interface SessionEntry {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  user: { email: string; name: string };
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
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [tab, setTab] = useState<"team" | "audit" | "settings" | "sessions">("team");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "member" });
  const [createError, setCreateError] = useState("");

  const fetchTeam = useCallback(async () => {
    const res = await fetch("/api/users", { headers: authHeaders() });
    if (res.ok) setTeam(await res.json());
  }, []);

  const fetchAudit = useCallback(async () => {
    const res = await fetch("/api/audit", { headers: authHeaders() });
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs || []);
    }
  }, []);

  const fetchTenant = useCallback(async (tenantId: string) => {
    const res = await fetch(`/api/tenants/${tenantId}`, { headers: authHeaders() });
    if (res.ok) setTenant(await res.json());
  }, []);

  const fetchSessions = useCallback(async () => {
    const res = await fetch("/api/sessions", { headers: authHeaders() });
    if (res.ok) setSessions(await res.json());
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/login");
      return;
    }
    const u = JSON.parse(stored);
    setUser(u);
    fetchTeam();
    fetchAudit();
    fetchTenant(u.tenantId);
    fetchSessions();
  }, [router, fetchTeam, fetchAudit, fetchTenant, fetchSessions]);

  const logout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {});
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

  const changeRole = async (id: string, role: string) => {
    await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ role }),
    });
    fetchTeam();
    fetchAudit();
  };

  const deleteUser = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE", headers: authHeaders() });
    fetchTeam();
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(createForm),
    });
    if (!res.ok) {
      const data = await res.json();
      setCreateError(data.error || "Error al crear usuario");
      return;
    }
    setShowCreateUser(false);
    setCreateForm({ name: "", email: "", password: "", role: "member" });
    fetchTeam();
    fetchAudit();
  };

  const revokeSession = async (sessionId: string) => {
    await fetch(`/api/sessions?id=${sessionId}`, { method: "DELETE", headers: authHeaders() });
    fetchSessions();
  };

  const cleanExpired = async () => {
    await fetch("/api/sessions", { method: "DELETE", headers: authHeaders() });
    fetchSessions();
  };

  const updateTenantName = async (name: string) => {
    if (!tenant) return;
    const res = await fetch(`/api/tenants/${tenant.id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ name }),
    });
    if (res.ok) fetchTenant(tenant.id);
  };

  if (!user) return null;

  const roleColor: Record<string, string> = {
    owner: "bg-purple-100 text-purple-700",
    admin: "bg-blue-100 text-blue-700",
    member: "bg-gray-100 text-gray-700",
  };

  const actionColor: Record<string, string> = {
    login: "bg-green-50 text-green-700",
    logout: "bg-red-50 text-red-700",
    register: "bg-blue-50 text-blue-700",
    refresh: "bg-gray-50 text-gray-600",
    user_created: "bg-indigo-50 text-indigo-700",
    role_change: "bg-amber-50 text-amber-700",
  };

  const isOwner = user.role === "owner";
  const isAdmin = user.role === "admin" || isOwner;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-indigo-600">🔐 SaaS Auth</h1>
            {tenant && (
              <span className="text-sm text-gray-400 hidden sm:inline">
                {tenant.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{user.name}</span>
            <span className={`px-2 py-0.5 rounded text-xs ${roleColor[user.role]}`}>{user.role}</span>
            <button onClick={logout} className="text-sm text-red-500 hover:text-red-700 transition">
              Salir
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* KPIs */}
        {tenant && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border p-5">
              <p className="text-sm text-gray-500">Usuarios</p>
              <p className="text-3xl font-bold text-gray-900">{tenant.stats.userCount}</p>
              <p className="text-xs text-green-600 mt-1">{tenant.stats.activeUsers} activos</p>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <p className="text-sm text-gray-500">Sesiones</p>
              <p className="text-3xl font-bold text-gray-900">{tenant.stats.sessionCount}</p>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <p className="text-sm text-gray-500">Eventos Auditoría</p>
              <p className="text-3xl font-bold text-gray-900">{tenant.stats.auditCount}</p>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <p className="text-sm text-gray-500">Organización</p>
              <p className="text-xl font-bold text-indigo-700 truncate">{tenant.name}</p>
              <p className="text-xs text-gray-400">{tenant.slug}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["team", "audit", "sessions", "settings"] as const).map((t) => {
            const labels = { team: "👥 Equipo", audit: "📋 Auditoría", sessions: "🔑 Sesiones", settings: "⚙️ Configuración" };
            if (t === "settings" && !isOwner) return null;
            if ((t === "sessions") && !isAdmin) return null;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t ? "bg-indigo-600 text-white shadow" : "bg-white text-slate-600 border hover:bg-gray-50"}`}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>

        {/* Team Tab */}
        {tab === "team" && (
          <div>
            {isAdmin && (
              <div className="mb-4 flex justify-end">
                <button
                  onClick={() => setShowCreateUser(!showCreateUser)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition"
                >
                  {showCreateUser ? "Cancelar" : "+ Nuevo Usuario"}
                </button>
              </div>
            )}

            {showCreateUser && (
              <div className="bg-white rounded-xl border p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Crear Usuario</h3>
                {createError && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">{createError}</p>}
                <form onSubmit={createUser} className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre</label>
                    <input type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contraseña</label>
                    <input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} required minLength={8} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Rol</label>
                    <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="member">Member</option>
                      {isOwner && <option value="admin">Admin</option>}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-indigo-700 transition">Crear</button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-5 py-3">Nombre</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Rol</th>
                    <th className="px-5 py-3 text-center">Estado</th>
                    <th className="px-5 py-3">Registro</th>
                    <th className="px-5 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {team.map((m) => (
                    <tr key={m.id} className={`hover:bg-slate-50 ${!m.active ? "opacity-50" : ""}`}>
                      <td className="px-5 py-3 font-medium">{m.name}</td>
                      <td className="px-5 py-3 text-slate-500">{m.email}</td>
                      <td className="px-5 py-3">
                        {isOwner && m.id !== user.id ? (
                          <select
                            value={m.role}
                            onChange={(e) => changeRole(m.id, e.target.value)}
                            className="text-xs border rounded px-2 py-1"
                          >
                            <option value="member">member</option>
                            <option value="admin">admin</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-xs ${roleColor[m.role] || "bg-gray-100"}`}>
                            {m.role}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs ${m.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {m.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{new Date(m.createdAt).toLocaleDateString("es")}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          {m.id !== user.id && (isOwner || (user.role === "admin" && m.role === "member")) && (
                            <button onClick={() => toggleActive(m.id, m.active)} className={`text-xs px-2 py-1 rounded ${m.active ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"} transition`}>
                              {m.active ? "Desactivar" : "Activar"}
                            </button>
                          )}
                          {isOwner && m.id !== user.id && (
                            <button onClick={() => deleteUser(m.id)} className="text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50 transition">
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audit Tab */}
        {tab === "audit" && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-5 py-3">Acción</th>
                  <th className="px-5 py-3">Usuario</th>
                  <th className="px-5 py-3">Detalles</th>
                  <th className="px-5 py-3">IP</th>
                  <th className="px-5 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionColor[log.action] || "bg-gray-50 text-gray-600"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{log.user.name}</p>
                      <p className="text-xs text-gray-400">{log.user.email}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs max-w-xs truncate">{log.details || "—"}</td>
                    <td className="px-5 py-3 text-xs text-slate-400">{log.ip || "—"}</td>
                    <td className="px-5 py-3 text-xs text-slate-400">{new Date(log.createdAt).toLocaleString("es")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sessions Tab */}
        {tab === "sessions" && (
          <div>
            {isOwner && (
              <div className="mb-4 flex justify-end">
                <button onClick={cleanExpired} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-100 transition">
                  Limpiar Sesiones Expiradas
                </button>
              </div>
            )}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-5 py-3">Usuario</th>
                    <th className="px-5 py-3">Creada</th>
                    <th className="px-5 py-3">Expira</th>
                    <th className="px-5 py-3">Estado</th>
                    {isOwner && <th className="px-5 py-3">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sessions.map((s) => {
                    const expired = new Date(s.expiresAt) < new Date();
                    return (
                      <tr key={s.id} className={`hover:bg-slate-50 ${expired ? "opacity-50" : ""}`}>
                        <td className="px-5 py-3">
                          <p className="font-medium">{s.user.name}</p>
                          <p className="text-xs text-gray-400">{s.user.email}</p>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">{new Date(s.createdAt).toLocaleString("es")}</td>
                        <td className="px-5 py-3 text-xs text-gray-500">{new Date(s.expiresAt).toLocaleString("es")}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs ${expired ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                            {expired ? "Expirada" : "Activa"}
                          </span>
                        </td>
                        {isOwner && (
                          <td className="px-5 py-3">
                            <button onClick={() => revokeSession(s.id)} className="text-xs text-red-600 hover:underline">
                              Revocar
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {sessions.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">Sin sesiones activas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab (Owner only) */}
        {tab === "settings" && isOwner && tenant && (
          <div className="bg-white rounded-xl border shadow-sm p-8 max-w-2xl">
            <h2 className="text-xl font-bold mb-6">Configuración de Organización</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                updateTenantName(fd.get("name") as string);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Nombre de la Organización</label>
                <input
                  name="name"
                  defaultValue={tenant.name}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input value={tenant.slug} disabled className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" />
                <p className="text-xs text-gray-400 mt-1">El slug no se puede cambiar</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ID del Tenant</label>
                <input value={tenant.id} disabled className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 font-mono" />
              </div>
              <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-indigo-700 transition">
                Guardar Cambios
              </button>
            </form>

            <hr className="my-8" />

            <h3 className="text-lg font-semibold mb-4">Estadísticas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Usuarios Totales</p>
                <p className="text-2xl font-bold">{tenant.stats.userCount}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Usuarios Activos</p>
                <p className="text-2xl font-bold text-green-600">{tenant.stats.activeUsers}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Sesiones Activas</p>
                <p className="text-2xl font-bold">{tenant.stats.sessionCount}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Eventos de Auditoría</p>
                <p className="text-2xl font-bold">{tenant.stats.auditCount}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
