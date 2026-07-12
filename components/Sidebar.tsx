"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getRolePresentation } from "@/lib/roles-config";
import {
  BarChart3,
  Bot,
  DollarSign,
  Home,
  LogOut,
  Menu,
  Package,
  Settings,
  Target,
  UploadCloud,
  AlertTriangle,
  X,
  ExternalLink,
  History,
  DatabaseBackup
} from "lucide-react";

type User = { nombre: string; usuario: string; rol: string; comercial?: string; empresa_id?: string };

const baseItems = [
  { href: "/dashboard", label: "Inicio", icon: Home, roles: ["Administrador", "Gerencia General", "Gerencia Comercial", "Compras", "Cartera"] },
  { href: "/reportes", label: "Reportes", icon: BarChart3, roles: ["Administrador", "Gerencia General", "Gerencia Comercial", "Compras", "Cartera", "Comercial"] },
  { href: "/admin", label: "Administración", icon: Settings, roles: ["Administrador"] },
  { href: "/auditoria", label: "Trazabilidad", icon: History, roles: ["Administrador"] },
  { href: "/copias-seguridad", label: "Copias de seguridad", icon: DatabaseBackup, roles: ["Administrador"] },
  { href: "/cargar-bases", label: "Cargar bases", icon: UploadCloud, roles: ["Administrador", "Asistente Comercial"] },
  { href: "/comercial", label: "Comercial y metas", icon: Target, roles: ["Administrador", "Gerencia General", "Gerencia Comercial", "Comercial"] },
  { href: "/inventario", label: "Compras e inventario", icon: Package, roles: ["Administrador", "Gerencia General", "Compras"] },
  { href: "/cartera", label: "Cartera", icon: DollarSign, roles: ["Administrador", "Gerencia General", "Cartera", "Gerencia Comercial", "Comercial"] },
  { href: "/ventas-perdidas", label: "Ventas perdidas", icon: AlertTriangle, roles: ["Administrador", "Gerencia General", "Gerencia Comercial", "Comercial"] },
  { href: "/ia", label: "Copiloto IA", icon: Bot, roles: ["Administrador", "Gerencia General", "Gerencia Comercial", "Comercial", "Compras", "Cartera"] }
];

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [roleName, setRoleName] = useState("Invitado");
  const [open, setOpen] = useState(false);
  const [fechaActual, setFechaActual] = useState("");
  const [demoActivo, setDemoActivo] = useState<boolean | null>(null);
  const [empresaNombre, setEmpresaNombre] = useState("");

  useEffect(() => {
    setFechaActual(new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }));
    try {
      const raw = localStorage.getItem("copiloto_user");
      const parsed = raw ? JSON.parse(raw) : null;
      setUser(parsed);
      setRoleName(getRolePresentation(parsed?.rol).nombreVisible);
      if (parsed?.empresa_id) {
        supabaseBrowser.from("empresa").select("nombre_comercial,nombre,demo_activo").eq("id", parsed.empresa_id).single().then(({data})=>{
          if(data){ setDemoActivo(!!data.demo_activo); setEmpresaNombre(data.nombre_comercial || data.nombre || ""); }
        });
      }
    } catch {
      setUser(null);
    }
  }, []);

  const items = baseItems.filter((item) => item.roles.includes(user?.rol || "Invitado"));

  async function cerrarSesion() {
    await supabaseBrowser.auth.signOut();
    localStorage.removeItem("copiloto_user");
    window.location.href = "/login";
  }

  const MenuContent = () => (
    <>
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl font-black text-slate-950">
          IA
        </div>
        <div>
          <p className="font-black">{empresaNombre || "Copiloto Comercial"}</p>
          <p className="text-xs text-slate-400">Gestión inteligente</p>
          <p className="mt-1 text-[11px] capitalize text-slate-500">{fechaActual}</p>
        </div>
      </div>

      <div className="mb-6 rounded-3xl bg-white/10 p-4">
        <p className="font-black text-white">{user?.nombre || "Usuario"}</p>
        <p className="text-sm text-slate-300">{roleName}</p>
        <button
          onClick={cerrarSesion}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-950"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>

      <nav className="space-y-2 overflow-y-auto pr-1">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10"
        >
          <ExternalLink size={18} />
          Volver a bienvenida
        </Link>

        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                active ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-3xl bg-white/10 p-4 text-sm text-slate-300">
        <p className="font-bold text-white">Modo actual</p>
        <p>{demoActivo === null ? "Cargando entorno..." : demoActivo ? "Modo DEMO separado" : "Empresa REAL"}</p>
      </div>
    </>
  );

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">
            IA
          </div>
          <div>
            <p className="text-sm font-black text-slate-950">Copiloto Comercial</p>
            <p className="text-xs text-slate-500">{roleName}</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white"
        >
          <Menu size={18} />
          Menú
        </button>
      </div>

      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-72 flex-col bg-slate-950 p-6 text-white lg:flex">
        <MenuContent />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-slate-950 p-6 text-white shadow-2xl">
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className="rounded-2xl bg-white/10 p-3 text-white"
                aria-label="Cerrar menú"
              >
                <X size={22} />
              </button>
            </div>
            <MenuContent />
          </aside>
        </div>
      )}
    </>
  );
}