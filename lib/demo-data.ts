export type Role =
  | "Administrador"
  | "Gerencia General"
  | "Gerencia Comercial"
  | "Comercial"
  | "Compras"
  | "Cartera"
  | "Asistente Comercial"
  | "Invitado";

export const demoUsers = [
  { usuario: "admin", password: "1234", nombre: "Administrador Demo", rol: "Administrador" as Role, comercial: "" },
  { usuario: "gerencia", password: "1234", nombre: "Gerencia Demo", rol: "Gerencia Comercial" as Role, comercial: "" },
  { usuario: "comercial", password: "1234", nombre: "Comercial Demo", rol: "Comercial" as Role, comercial: "Comercial Demo" },
  { usuario: "compras", password: "1234", nombre: "Compras Demo", rol: "Compras" as Role, comercial: "" },
  { usuario: "cartera", password: "1234", nombre: "Cartera Demo", rol: "Cartera" as Role, comercial: "" },
  { usuario: "asistente", password: "1234", nombre: "Asistente Demo", rol: "Asistente Comercial" as Role, comercial: "" }
];

export const comerciales = [
  { id: "c1", nombre: "Comercial Demo", sucursal: "Principal", zona: "Centro", meta: 350000000, venta: 302344121, cartera: 42000000, recuperado: 18000000, clientes: 42 },
  { id: "c2", nombre: "Juan Pérez", sucursal: "Norte", zona: "Norte", meta: 280000000, venta: 241000000, cartera: 22000000, recuperado: 12000000, clientes: 31 },
  { id: "c3", nombre: "María Gómez", sucursal: "Sur", zona: "Sur", meta: 220000000, venta: 256000000, cartera: 8400000, recuperado: 14000000, clientes: 28 },
  { id: "c4", nombre: "Carlos Díaz", sucursal: "Principal", zona: "Centro", meta: 310000000, venta: 198000000, cartera: 51800000, recuperado: 9000000, clientes: 39 }
];

export const productosPareto = [
  { sku: "P001", nombre: "Línea Industrial", valor: 980000000, participacion: 31.4, abc: "A", ventaPromedioDia: 18, leadTimeDias: 8, stockSeguridad: 45 },
  { sku: "P002", nombre: "Referencia Alto Giro", valor: 760000000, participacion: 24.3, abc: "A", ventaPromedioDia: 12, leadTimeDias: 10, stockSeguridad: 30 },
  { sku: "P003", nombre: "Línea Construcción", valor: 530000000, participacion: 17.0, abc: "A", ventaPromedioDia: 8, leadTimeDias: 12, stockSeguridad: 24 },
  { sku: "P004", nombre: "Línea Hogar", valor: 320000000, participacion: 10.2, abc: "B", ventaPromedioDia: 5, leadTimeDias: 7, stockSeguridad: 15 },
  { sku: "P005", nombre: "Complementarios", valor: 210000000, participacion: 6.7, abc: "B", ventaPromedioDia: 4, leadTimeDias: 6, stockSeguridad: 10 }
];

export const clientesPareto = [
  { id: "cl1", nombre: "Cliente A", comercial: "Comercial Demo", valor: 420000000, variacion: 18, cartera: 0, estado: "Activo" },
  { id: "cl2", nombre: "Cliente B", comercial: "Juan Pérez", valor: 315000000, variacion: -12, cartera: 22000000, estado: "Vigilar" },
  { id: "cl3", nombre: "Cliente C", comercial: "María Gómez", valor: 288000000, variacion: 7, cartera: 8400000, estado: "Activo" },
  { id: "cl4", nombre: "Cliente D", comercial: "Carlos Díaz", valor: 205000000, variacion: -22, cartera: 51800000, estado: "Bloqueo sugerido" },
  { id: "cl5", nombre: "Cliente E", comercial: "Comercial Demo", valor: 186000000, variacion: 11, cartera: 14000000, estado: "Activo" }
];

export const inventario = [
  { sku: "P001", producto: "Línea Industrial", stock: 0, estado: "AGOTADO", sucursal: "Principal", leadTimeDias: 8, stockSeguridad: 45, puntoPedido: 189, proveedor: "Proveedor Alfa" },
  { sku: "P002", producto: "Referencia Alto Giro", stock: 3, estado: "CRÍTICO", sucursal: "Principal", leadTimeDias: 10, stockSeguridad: 30, puntoPedido: 150, proveedor: "Proveedor Beta" },
  { sku: "P003", producto: "Línea Construcción", stock: 25, estado: "CRÍTICO", sucursal: "Norte", leadTimeDias: 12, stockSeguridad: 24, puntoPedido: 120, proveedor: "Proveedor Alfa" },
  { sku: "P004", producto: "Línea Hogar", stock: 82, estado: "DISPONIBLE", sucursal: "Sur", leadTimeDias: 7, stockSeguridad: 15, puntoPedido: 50, proveedor: "Proveedor Gamma" }
];

export const cartera = [
  { id: "k1", cliente: "Cliente B", comercial: "Juan Pérez", saldo: 22000000, dias: 48, riesgo: "Medio", accion: "Solicitar gestión comercial", bloqueado: false, promesa: "Sin promesa" },
  { id: "k2", cliente: "Cliente D", comercial: "Carlos Díaz", saldo: 51800000, dias: 92, riesgo: "Crítico", accion: "Bloqueo sugerido y escalamiento", bloqueado: true, promesa: "Incumplida" },
  { id: "k3", cliente: "Cliente F", comercial: "María Gómez", saldo: 8400000, dias: 18, riesgo: "Bajo", accion: "Seguimiento normal", bloqueado: false, promesa: "Vence viernes" },
  { id: "k4", cliente: "Cliente E", comercial: "Comercial Demo", saldo: 14000000, dias: 36, riesgo: "Medio", accion: "Llamada antes de vender de nuevo", bloqueado: false, promesa: "Pendiente confirmar" }
];

export const ventasPerdidas = [
  { id: "vp1", comercial: "Juan Pérez", cliente: "Cliente B", motivo: "Agotado", producto: "Línea Industrial", sku: "P001", valor: 18000000, alertaCompras: true },
  { id: "vp2", comercial: "Carlos Díaz", cliente: "Cliente D", motivo: "Precio", producto: "Línea Hogar", sku: "P004", valor: 18700000, alertaCompras: false },
  { id: "vp3", comercial: "Comercial Demo", cliente: "Cliente E", motivo: "Agotado", producto: "Referencia Alto Giro", sku: "P002", valor: 14500000, alertaCompras: true },
  { id: "vp4", comercial: "María Gómez", cliente: "Cliente C", motivo: "Competencia", producto: "Línea Construcción", sku: "P003", valor: 9400000, alertaCompras: false }
];

export const alertas = [
  { id: "a1", destinoRol: "Comercial", destino: "Carlos Díaz", tipo: "Cartera crítica", prioridad: "Urgente", mensaje: "Cliente D tiene 92 días de mora. Bloqueo sugerido y gestión inmediata.", origen: "Cartera" },
  { id: "a2", destinoRol: "Comercial", destino: "Juan Pérez", tipo: "Cartera vencida", prioridad: "Alta", mensaje: "Cliente B tiene cartera de 48 días. Solicitar compromiso de pago antes de nueva venta.", origen: "Cartera" },
  { id: "a3", destinoRol: "Compras", destino: "Compras", tipo: "Agotado reportado", prioridad: "Urgente", mensaje: "Ventas perdió $18.000.000 por agotado de Línea Industrial.", origen: "Ventas perdidas" },
  { id: "a4", destinoRol: "Compras", destino: "Compras", tipo: "Stock crítico", prioridad: "Alta", mensaje: "Referencia Alto Giro tiene stock 3 y punto de pedido 150.", origen: "Inventario" }
];

export const festivosColombia2026 = [
  "2026-01-01", "2026-01-12", "2026-03-23", "2026-04-02", "2026-04-03", "2026-05-01",
  "2026-05-18", "2026-06-08", "2026-06-15", "2026-06-29", "2026-07-20", "2026-08-07",
  "2026-08-17", "2026-10-12", "2026-11-02", "2026-11-16", "2026-12-08", "2026-12-25"
];

export function money(value: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
}

export function pct(value: number) {
  if (!isFinite(value)) return "0.0%";
  return `${value.toFixed(1)}%`;
}

export function diasHabilesColombia(year: number, monthIndex1: number) {
  const festivos = new Set(festivosColombia2026);
  const last = new Date(year, monthIndex1, 0).getDate();
  let habiles = 0;
  for (let d = 1; d <= last; d++) {
    const date = new Date(year, monthIndex1 - 1, d);
    const dow = date.getDay();
    const iso = date.toISOString().slice(0, 10);
    if (dow !== 0 && dow !== 6 && !festivos.has(iso)) habiles++;
  }
  return habiles;
}

export function diasHabilesTranscurridosColombia(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const festivos = new Set(festivosColombia2026);
  let habiles = 0;
  for (let d = 1; d <= date.getDate(); d++) {
    const cur = new Date(year, month - 1, d);
    const dow = cur.getDay();
    const iso = cur.toISOString().slice(0, 10);
    if (dow !== 0 && dow !== 6 && !festivos.has(iso)) habiles++;
  }
  return habiles;
}

export function metaEsperadaPorDias(meta: number, date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const habilesMes = diasHabilesColombia(year, month);
  const habilesPasados = diasHabilesTranscurridosColombia(date);
  return {
    habilesMes,
    habilesPasados,
    esperado: habilesMes > 0 ? (meta / habilesMes) * habilesPasados : 0,
    cumplimientoEsperado: habilesMes > 0 ? (habilesPasados / habilesMes) * 100 : 0
  };
}