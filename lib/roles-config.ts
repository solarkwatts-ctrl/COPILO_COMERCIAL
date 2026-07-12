import type { Role } from "./demo-data";

export type RoleConfig = {
  key: Role;
  nombreVisible: string;
  saludo: string;
  descripcion: string;
};

export const defaultRoleConfig: RoleConfig[] = [
  { key: "Administrador", nombreVisible: "Administrador del Sistema", saludo: "Bienvenido, líder de configuración", descripcion: "Configure usuarios, roles, demo, permisos e información maestra." },
  { key: "Gerencia General", nombreVisible: "Gerente General", saludo: "Buenos días, líder de la empresa", descripcion: "Revise el estado completo del negocio y las decisiones críticas sugeridas." },
  { key: "Gerencia Comercial", nombreVisible: "Gerente Comercial", saludo: "Buenos días, líder comercial", descripcion: "Controle metas, cumplimiento, ranking, oportunidades y alertas comerciales." },
  { key: "Comercial", nombreVisible: "Asesor Comercial", saludo: "Hola, vamos por la meta de hoy", descripcion: "Revise su avance, sus clientes, cartera asignada y acciones urgentes." },
  { key: "Compras", nombreVisible: "Líder de Compras e Inventarios", saludo: "Hola, protejamos el abastecimiento", descripcion: "Revise agotados, stock crítico, reposición, compras sugeridas y alertas de ventas." },
  { key: "Cartera", nombreVisible: "Gestor de Cartera", saludo: "Hola, prioricemos la recuperación", descripcion: "Gestione cartera vencida, bloqueos, acciones al comercial y promesas de pago." },
  { key: "Asistente Comercial", nombreVisible: "Asistente Comercial", saludo: "Hola, gracias por mantener la información al día", descripcion: "Cargue las bases operativas sin acceso a reportes sensibles." },
  { key: "Invitado", nombreVisible: "Invitado", saludo: "Bienvenido a la demostración", descripcion: "Conozca el potencial del sistema." }
];

export function getStoredRoleConfig(): RoleConfig[] {
  if (typeof window === "undefined") return defaultRoleConfig;
  try {
    const raw = localStorage.getItem("copiloto_role_config");
    if (!raw) return defaultRoleConfig;
    const parsed = JSON.parse(raw) as Partial<RoleConfig>[];
    return defaultRoleConfig.map((def) => ({ ...def, ...(parsed.find((x) => x.key === def.key) || {}), key: def.key }));
  } catch {
    return defaultRoleConfig;
  }
}

export function saveStoredRoleConfig(config: RoleConfig[]) {
  if (typeof window !== "undefined") localStorage.setItem("copiloto_role_config", JSON.stringify(config));
}

export function getRolePresentation(role?: string) {
  const config = getStoredRoleConfig();
  return config.find((r) => r.key === role) || config.find((r) => r.key === "Invitado") || defaultRoleConfig[0];
}