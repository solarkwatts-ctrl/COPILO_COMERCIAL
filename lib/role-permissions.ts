export type AppRole =
  | "Administrador"
  | "Gerencia General"
  | "Gerencia Comercial"
  | "Comercial"
  | "Compras"
  | "Cartera"
  | "Asistente Comercial";

export const roleModules: Record<AppRole, string[]> = {
  Administrador: [
    "dashboard", "reportes", "admin", "auditoria", "copias", "cargar",
    "comercial", "inventario", "cartera", "ventas-perdidas", "ia"
  ],
  "Gerencia General": [
    "dashboard", "reportes", "comercial", "inventario", "cartera", "ventas-perdidas", "ia"
  ],
  "Gerencia Comercial": [
    "dashboard", "reportes", "comercial", "cartera", "ventas-perdidas", "ia"
  ],
  Comercial: ["reportes", "comercial", "cartera", "ventas-perdidas", "ia"],
  Compras: ["dashboard", "reportes", "inventario", "ia"],
  Cartera: ["dashboard", "reportes", "cartera", "ia"],
  "Asistente Comercial": ["cargar"]
};

export function canAccess(role: string | undefined, module: string) {
  if (!role) return false;
  return (roleModules[role as AppRole] || []).includes(module);
}

export function roleScopeDescription(role: string) {
  const descriptions: Record<string, string> = {
    Administrador: "Configuración, empresas, usuarios, roles, auditoría, copias y visión operativa completa.",
    "Gerencia General": "Visión integral del negocio, riesgos, ventas, cartera, inventario y decisiones ejecutivas.",
    "Gerencia Comercial": "Equipo comercial, metas, clientes, cartera comercial, ventas perdidas y acompañamiento.",
    Comercial: "Únicamente su meta, clientes, cartera y ventas perdidas asociadas.",
    Compras: "Inventario, agotados, reposición, lead time, productos y pérdidas por falta de stock.",
    Cartera: "Saldos, mora, vencimientos, compromisos y prioridades de recaudo.",
    "Asistente Comercial": "Carga y validación de bases, sin acceso a información estratégica ni IA."
  };
  return descriptions[role] || "Acceso limitado al perfil asignado.";
}
