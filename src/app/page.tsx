import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-indigo-600">SaaS Auth Service</h1>
        <p className="text-slate-500 mb-8 max-w-md">
          Módulo de identidad y acceso multi-tenant con JWT, RBAC y auditoría de sesiones.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-50 transition font-semibold"
          >
            Registrarse
          </Link>
        </div>
      </div>
    </div>
  );
}
