"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { canAccess } from "@/lib/role-permissions";
import { getHomeForRole } from "@/lib/session";

type StoredUser = { rol?: string; nombre?: string };

const moduleByPath: Array<[RegExp, string]> = [
  [/^\/admin(?:\/|$)/, "admin"],
  [/^\/auditoria(?:\/|$)/, "auditoria"],
  [/^\/copias-seguridad(?:\/|$)/, "copias"],
  [/^\/cargar-bases(?:\/|$)/, "cargar"],
  [/^\/comercial(?:\/|$)/, "comercial"],
  [/^\/inventario(?:\/|$)/, "inventario"],
  [/^\/cartera(?:\/|$)/, "cartera"],
  [/^\/ventas-perdidas(?:\/|$)/, "ventas-perdidas"],
  [/^\/reportes(?:\/|$)/, "reportes"],
  [/^\/ia(?:\/|$)/, "ia"],
  [/^\/dashboard(?:\/|$)/, "dashboard"]
];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  const moduleName = useMemo(
    () => moduleByPath.find(([pattern]) => pattern.test(pathname))?.[1],
    [pathname]
  );

  useEffect(() => {
    let user: StoredUser | null = null;
    try {
      const raw = localStorage.getItem("copiloto_user");
      user = raw ? JSON.parse(raw) : null;
    } catch {
      user = null;
    }

    if (!user?.rol) {
      router.replace("/login");
      return;
    }

    const hasAccess = !moduleName || canAccess(user.rol, moduleName);
    setAllowed(hasAccess);
    setChecked(true);

    if (!hasAccess) {
      router.replace(getHomeForRole(user.rol as any));
    }
  }, [moduleName, router]);

  if (!checked || !allowed) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-black text-slate-950">Validando permisos…</p>
          <p className="mt-2 text-sm text-slate-500">El acceso depende del rol asignado.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
