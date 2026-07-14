"use client";

import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/Layout";
import { Hero } from "@/components/Hero";
import { authFetch } from "@/lib/auth-fetch";
import { parseHistoricalFile, HistoricalType } from "@/lib/historical-parser";
import { OperationalType } from "@/lib/operational-parser";
import { AlertTriangle, Database, CheckCircle2, History, Files, CalendarRange, TableProperties } from "lucide-react";

const HISTORICAL_TYPES: [HistoricalType, string, string][] = [
  ["ventas_historicas", "Ventas históricas", "Facturas por vendedor, almacén, cliente y fecha."],
  ["compras_historicas", "Compras históricas", "Facturas de proveedor, valores, saldos y estado."],
  ["remisiones_historicas", "Remisiones históricas", "Detalle por referencia, cantidad, cliente y estado."],
];

const OPERATIONAL_TYPES: [OperationalType, string, string][] = [
  ["ventas", "Ventas operativas", "Ventas actuales con factura, fecha, cliente, producto y vendedor."],
  ["cartera", "Cartera", "Facturas, saldos, vencimientos, mora, riesgo y promesas de pago."],
  ["inventario", "Inventario", "Stock, costos, precios, mínimos, punto de pedido y lead time."],
  ["clientes", "Clientes", "Maestro de clientes, NIT, ciudad, sector y comercial asignado."],
  ["productos", "Productos", "Maestro de productos, SKU, referencia, categoría y clasificación ABC."],
  ["comerciales", "Comerciales", "Vendedores, códigos, sucursales y estado."],
  ["metas", "Metas", "Metas por vendedor, sucursal, año y mes."],
  ["sucursales", "Sucursales", "Sedes, almacenes, ciudades y estado."],
  ["ventas_perdidas", "Ventas perdidas", "Causas, valor, cliente, producto y responsable."],
];

const BATCH_SIZE = 500;

export default function CargarBasesPage() {
  const [section, setSection] = useState<"historicos" | "operativos">("historicos");
  const [type, setType] = useState<HistoricalType>("ventas_historicas");
  const [mode, setMode] = useState("reemplazar");
  const [files, setFiles] = useState<File[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const [operationalType, setOperationalType] = useState<OperationalType>("ventas");
  const [operationalMode, setOperationalMode] = useState("reemplazar");
  const [operationalFiles, setOperationalFiles] = useState<File[]>([]);
  const [operationalCount, setOperationalCount] = useState(0);

  const selectedSummary = summary?.[type] || { registros: 0, desde: null, hasta: null };

  async function loadSummary() {
    try {
      const response = await authFetch("/api/historicos");
      const payload = await response.json();
      if (response.ok) setSummary(payload.resumen || {});
    } catch {}
  }

  async function loadOperationalCount(nextType = operationalType) {
    try {
      const response = await authFetch(`/api/importaciones?type=${encodeURIComponent(nextType)}`);
      const payload = await response.json();
      if (response.ok) setOperationalCount(Number(payload.registros_actuales || 0));
    } catch {}
  }

  useEffect(() => { loadSummary(); }, []);
  useEffect(() => { if (section === "operativos") loadOperationalCount(); }, [section, operationalType]);

  const totalSize = useMemo(() => files.reduce((sum, f) => sum + f.size, 0), [files]);

  async function uploadHistorical() {
    setMessage(""); setError(""); setProgress(0);
    if (!files.length) { setError("Seleccione uno o varios archivos históricos."); return; }
    setBusy(true);
    try {
      const parsedFiles = [];
      let periodFrom: string | null = null;
      let periodTo: string | null = null;
      for (let index = 0; index < files.length; index += 1) {
        const parsed = await parseHistoricalFile(files[index], type);
        parsedFiles.push(parsed);
        if (parsed.periodFrom && (!periodFrom || parsed.periodFrom.localeCompare(periodFrom) < 0)) periodFrom = parsed.periodFrom;
        if (parsed.periodTo && (!periodTo || parsed.periodTo.localeCompare(periodTo) > 0)) periodTo = parsed.periodTo;
        setProgress(Math.round(((index + 1) / files.length) * 20));
      }

      if (mode === "reemplazar" && selectedSummary.registros > 0) {
        const ok = window.confirm(`Los ${files.length} archivos fueron validados. Se eliminarán ${selectedSummary.registros} registros de esta categoría, únicamente para la empresa activa. ¿Continuar?`);
        if (!ok) return;
      }

      const startResponse = await authFetch("/api/historicos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", table: type, mode })
      });
      const startPayload = await startResponse.json();
      if (!startResponse.ok) throw new Error(startPayload.error || "No fue posible iniciar la carga.");

      let totalRows = 0; let processedFiles = 0;
      for (const parsed of parsedFiles) {
        for (let i = 0; i < parsed.rows.length; i += BATCH_SIZE) {
          const batch = parsed.rows.slice(i, i + BATCH_SIZE);
          const response = await authFetch("/api/historicos", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "batch", table: type, rows: batch })
          });
          const payload = await response.json();
          if (!response.ok) throw new Error(`${parsed.sourceFile}: ${payload.error || "Error cargando lote."}`);
          totalRows += Number(payload.procesados ?? batch.length);
          setProgress(Math.min(99, 20 + Math.round(((processedFiles + (i + batch.length) / parsed.rows.length) / parsedFiles.length) * 79)));
        }
        processedFiles += 1;
      }
      const finish = await authFetch("/api/historicos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finish", table: type, total: totalRows, files: files.length, fileNames: files.map(f => f.name), periodFrom, periodTo, mode })
      });
      if (!finish.ok) throw new Error("Los datos se cargaron, pero no fue posible cerrar la auditoría.");
      setProgress(100);
      setMessage(`${totalRows.toLocaleString("es-CO")} registros históricos válidos cargados desde ${files.length} archivo(s). Periodo: ${periodFrom || "-"} a ${periodTo || "-"}.`);
      setFiles([]);
      const input = document.getElementById("historical-files") as HTMLInputElement | null; if (input) input.value = "";
      await loadSummary();
    } catch (e: any) { setError(e.message || "No fue posible procesar los históricos."); }
    finally { setBusy(false); }
  }

  async function uploadOperational() {
    setMessage(""); setError(""); setProgress(0);
    if (!operationalFiles.length) { setError("Seleccione uno o varios archivos operativos."); return; }
    if (operationalMode === "reemplazar" && operationalCount > 0) {
      const ok = window.confirm(`Se validará el archivo antes de reemplazar. Si es válido, se eliminarán ${operationalCount.toLocaleString("es-CO")} registros de ${operationalType}, únicamente para la empresa activa. ¿Continuar?`);
      if (!ok) return;
    }
    setBusy(true);
    try {
      let totalLoaded = 0;
      let totalDeleted = 0;
      let totalRejected = 0;
      for (let index = 0; index < operationalFiles.length; index += 1) {
        const currentFile = operationalFiles[index];
        const form = new FormData();
        form.append("file", currentFile);
        form.append("type", operationalType);
        // En una carga múltiple se reemplaza únicamente con el primer archivo;
        // los siguientes se agregan para conservar todo el periodo seleccionado.
        const currentMode = index === 0 ? operationalMode : (operationalMode === "reemplazar" ? "agregar" : operationalMode);
        form.append("mode", currentMode);
        setProgress(Math.round((index / operationalFiles.length) * 90));
        const response = await authFetch("/api/importaciones", { method: "POST", body: form });
        const payload = await response.json();
        if (!response.ok) throw new Error(`${currentFile.name}: ${payload.error || "No fue posible cargar la base."}`);
        totalLoaded += Number(payload.registros || 0);
        totalDeleted += Number(payload.eliminados || 0);
        totalRejected += Number(payload.rechazados || 0);
      }
      setProgress(100);
      setMessage(`${totalLoaded.toLocaleString("es-CO")} registros válidos cargados en ${operationalType} desde ${operationalFiles.length} archivo(s). ${totalDeleted.toLocaleString("es-CO")} anteriores eliminados.${totalRejected ? ` ${totalRejected} filas rechazadas.` : ""}`);
      setOperationalFiles([]);
      const input = document.getElementById("operational-file") as HTMLInputElement | null; if (input) input.value = "";
      await loadOperationalCount();
    } catch (e: any) { setError(e.message || "No fue posible procesar la base operativa."); }
    finally { setBusy(false); }
  }

  return <AppLayout>
    <Hero title="Centro de datos empresarial" subtitle="Cargue históricos y bases operativas con el mismo motor de validación, normalización, aislamiento por empresa y auditoría." />
    {message && <div className="alert alert-green mb-6 flex items-center gap-2"><CheckCircle2 />{message}</div>}
    {error && <div className="alert alert-red mb-6 flex items-center gap-2"><AlertTriangle />{error}</div>}

    <div className="mb-6 flex gap-3">
      <button className={section === "historicos" ? "btn" : "btn-secondary"} onClick={() => setSection("historicos")}><History size={18}/> Históricos</button>
      <button className={section === "operativos" ? "btn" : "btn-secondary"} onClick={() => setSection("operativos")}><TableProperties size={18}/> Bases operativas</button>
    </div>

    {section === "historicos" ? <section className="grid gap-6 xl:grid-cols-[1fr_390px]">
      <div className="card">
        <div className="flex items-center gap-3"><History className="text-blue-700"/><div><h2 className="text-xl font-black">Carga histórica múltiple</h2><p className="text-sm text-slate-500">Admite CSV, XLS y XLSX con encabezados variables.</p></div></div>
        <div className="mt-6 space-y-5">
          <div><label className="text-sm font-bold">Categoría histórica</label><div className="mt-3 grid gap-3 md:grid-cols-3">{HISTORICAL_TYPES.map(([value,label,desc])=><button type="button" key={value} onClick={()=>setType(value)} className={`rounded-2xl border p-4 text-left ${type===value?"border-blue-500 bg-blue-50":"border-slate-200"}`}><p className="font-black">{label}</p><p className="mt-1 text-xs text-slate-500">{desc}</p></button>)}</div></div>
          <div><label className="text-sm font-bold">Comportamiento</label><div className="mt-3 grid gap-3 md:grid-cols-2"><label className={`rounded-2xl border p-4 ${mode==="reemplazar"?"border-blue-500 bg-blue-50":""}`}><input type="radio" checked={mode==="reemplazar"} onChange={()=>setMode("reemplazar")}/> <strong className="ml-2">Reemplazar categoría</strong><p className="mt-1 text-xs text-slate-500">Valida todos los archivos antes de borrar la categoría de la empresa activa.</p></label><label className={`rounded-2xl border p-4 ${mode==="agregar"?"border-blue-500 bg-blue-50":""}`}><input type="radio" checked={mode==="agregar"} onChange={()=>setMode("agregar")}/> <strong className="ml-2">Agregar / actualizar</strong><p className="mt-1 text-xs text-slate-500">Conserva lo anterior y evita filas exactamente duplicadas.</p></label></div></div>
          <div><label className="text-sm font-bold">Archivos históricos</label><input id="historical-files" className="input mt-2" type="file" multiple accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={e=>setFiles(Array.from(e.target.files||[]))}/>{files.length>0&&<div className="mt-3 rounded-2xl bg-slate-50 p-4"><p className="font-black">{files.length} archivo(s) · {(totalSize/1024/1024).toFixed(1)} MB</p><div className="mt-2 max-h-32 overflow-auto text-sm text-slate-600">{files.map(f=><p key={`${f.name}-${f.size}`}>• {f.name}</p>)}</div></div>}</div>
          {busy&&<Progress value={progress}/>}<button className="btn w-full" onClick={uploadHistorical} disabled={busy}>{busy?"Depurando y cargando…":"Unificar y cargar históricos"}</button>
        </div>
      </div>
      <aside className="card h-fit"><Database className="text-blue-700"/><h2 className="mt-3 text-xl font-black">Histórico consolidado</h2><p className="mt-5 text-5xl font-black">{Number(selectedSummary.registros||0).toLocaleString("es-CO")}</p><p className="text-sm font-bold text-slate-500">registros en {type.replace("_historicas","").replace("_historicos","")}</p><div className="mt-5 rounded-2xl bg-slate-50 p-4"><CalendarRange size={18}/><p className="mt-2 text-xs text-slate-500">Periodo disponible</p><p className="font-black">{selectedSummary.desde||"Sin datos"} — {selectedSummary.hasta||"Sin datos"}</p></div></aside>
    </section> : <section className="grid gap-6 xl:grid-cols-[1fr_390px]">
      <div className="card">
        <div className="flex items-center gap-3"><TableProperties className="text-blue-700"/><div><h2 className="text-xl font-black">Carga operativa universal</h2><p className="text-sm text-slate-500">Reconoce equivalencias de columnas en CSV, XLS y XLSX para todos los módulos.</p></div></div>
        <div className="mt-6 space-y-5">
          <div><label className="text-sm font-bold">Base a cargar</label><div className="mt-3 grid gap-3 md:grid-cols-3">{OPERATIONAL_TYPES.map(([value,label,desc])=><button type="button" key={value} onClick={()=>{setOperationalType(value);setOperationalFiles([]);}} className={`rounded-2xl border p-4 text-left ${operationalType===value?"border-blue-500 bg-blue-50":"border-slate-200"}`}><p className="font-black">{label}</p><p className="mt-1 text-xs text-slate-500">{desc}</p></button>)}</div></div>
          <div><label className="text-sm font-bold">Comportamiento</label><div className="mt-3 grid gap-3 md:grid-cols-3">{[["reemplazar","Reemplazar","Valida primero y luego sustituye solo esta base de la empresa activa."],["agregar","Agregar","Conserva lo existente y añade registros nuevos."],["actualizar","Actualizar por clave","Sustituye coincidencias por factura, NIT, código, SKU o nombre."]].map(([value,label,desc])=><label key={value} className={`rounded-2xl border p-4 ${operationalMode===value?"border-blue-500 bg-blue-50":""}`}><input type="radio" checked={operationalMode===value} onChange={()=>setOperationalMode(value)}/> <strong className="ml-2">{label}</strong><p className="mt-1 text-xs text-slate-500">{desc}</p></label>)}</div></div>
          <div><label className="text-sm font-bold">Archivo</label><input id="operational-file" className="input mt-2" type="file" multiple accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={e=>setOperationalFiles(Array.from(e.target.files||[]))}/>{operationalFiles.length>0&&<div className="mt-3 rounded-2xl bg-slate-50 p-4"><p className="font-black">{operationalFiles.length} archivo(s)</p><div className="mt-2 max-h-32 overflow-auto text-sm text-slate-500">{operationalFiles.map(file=><p key={`${file.name}-${file.size}`}>• {file.name} · {(file.size/1024/1024).toFixed(1)} MB</p>)}</div></div>}</div>
          {busy&&<Progress value={progress}/>}<button className="btn w-full" onClick={uploadOperational} disabled={busy}>{busy?"Validando y cargando…":"Validar y cargar base"}</button>
        </div>
      </div>
      <aside className="card h-fit"><Database className="text-blue-700"/><h2 className="mt-3 text-xl font-black">Base activa</h2><p className="mt-5 text-5xl font-black">{operationalCount.toLocaleString("es-CO")}</p><p className="text-sm font-bold text-slate-500">registros actuales en {operationalType}</p><div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"><strong>Protección incorporada</strong><p className="mt-2">El archivo se valida y normaliza antes de reemplazar. La operación solo afecta la empresa activa y queda registrada en auditoría.</p></div></aside>
    </section>}
  </AppLayout>;
}

function Progress({ value }: { value: number }) {
  return <div><div className="h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-blue-600 transition-all" style={{width:`${value}%`}}/></div><p className="mt-2 text-sm font-bold">Procesando {value}%</p></div>;
}
