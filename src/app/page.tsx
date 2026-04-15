import Link from "next/link";

const features = [
  { icon: "📝", title: "Notas & Documentos", desc: "Crea, edita y organiza documentos del equipo en tiempo real" },
  { icon: "🔍", title: "Búsqueda Rápida", desc: "Encuentra cualquier documento por título, contenido o categoría" },
  { icon: "📁", title: "Categorías", desc: "Organiza tus notas por proyecto, área o prioridad" },
  { icon: "👥", title: "Colaboración", desc: "Todo el equipo accede a los documentos de la organización" },
  { icon: "📌", title: "Fijados", desc: "Marca documentos importantes para acceso rápido" },
  { icon: "📋", title: "Auditoría", desc: "Registro completo de quién creó, editó o eliminó cada documento" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            NovaTech Document Manager
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
            NovaTech Docs
          </h1>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Gestiona documentos, notas e información de tu equipo.
            Organiza por categorías, busca al instante y colabora con tu organización.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/login"
              className="bg-white text-indigo-700 px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition font-bold shadow-lg shadow-indigo-900/30 hover:shadow-xl hover:-translate-y-0.5"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="border-2 border-white/50 text-white px-8 py-3.5 rounded-xl hover:bg-white/10 transition font-bold backdrop-blur"
            >
              Crear Organización
            </Link>
          </div>
          <p className="mt-6 text-indigo-200 text-sm">
            Demo: <code className="bg-white/10 px-2 py-0.5 rounded">admin@demo.com</code> / <code className="bg-white/10 px-2 py-0.5 rounded">Demo1234!</code>
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-4 text-slate-800">Características</h2>
        <p className="text-center text-slate-500 mb-12">Todo lo que necesita tu equipo para gestionar información</p>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-xl border p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <span className="text-3xl mb-3 block">{f.icon}</span>
              <h3 className="font-bold text-lg mb-1 text-slate-800">{f.title}</h3>
              <p className="text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t py-8 text-center text-sm text-slate-400">
        NovaTech Docs — Gestión de documentos y notas para tu equipo
      </footer>
    </div>
  );
}
