"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/Layout";
import { Hero } from "@/components/Hero";
import { supabaseBrowser } from "@/lib/supabase/client";
import { UploadCloud } from "lucide-react";

const TYPES = [
  ["ventas","Ventas"],
  ["cartera","Cartera"],
  ["inventario","Inventario"],
  ["clientes","Clientes"],
  ["comerciales","Comerciales"],
  ["metas","Metas"],
  ["productos","Productos"],
  ["sucursales","Sucursales"],
  ["ventas_perdidas","Ventas perdidas"]
];

export default function CargarBasesPage() {
  const [profile, setProfile] = useState<any>(null);
  const [type, setType] = useState("ventas");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabaseBrowser.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabaseBrowser.from("usuarios").select("*").eq("auth_user_id", auth.user.id).single();
      setProfile(data);
    })();
  }, []);

  async function upload() {
    if (!file || !profile?.empresa_id) return;
    const form = new FormData();
    form.append("file", file);
    form.append("type", type);
    form.append("empresa_id", profile.empresa_id);
    form.append("usuario_id", profile.id);
    form.append("usuario_nombre", profile.nombre || "Asistente Comercial");

    const { data: session } = await supabaseBrowser.auth.getSession();
    const res = await fetch("/api/importaciones", {
      method: "POST",
      headers: session.session?.access_token
        ? { Authorization: `Bearer ${session.session.access_token}`, "X-Company-Id": localStorage.getItem("active_company_id") || "" }
        : {},
      body: form
    });
    const data = await res.json();
    setMessage(data.ok ? `Carga completada: ${data.registros} registros.` : data.error || "Error en la carga.");
  }

  return (
    <AppLayout>
      <Hero
        title="Carga de bases empresariales"
        subtitle="El Asistente Comercial alimenta el sistema. Cada archivo se guarda en Supabase y deja trazabilidad."
      />

      {message && <div className="alert alert-blue mb-6">{message}</div>}

      <section className="card max-w-3xl">
        <div className="flex items-center gap-3">
          <UploadCloud className="text-blue-700" />
          <h2 className="text-xl font-black">Nueva importación</h2>
        </div>

        <div className="mt-5 space-y-4">
          <select className="input" value={type} onChange={(e)=>setType(e.target.value)}>
            {TYPES.map(([value,label])=><option key={value} value={value}>{label}</option>)}
          </select>
          <input className="input" type="file" accept=".csv,text/csv" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
          <button className="btn w-full" onClick={upload}>Subir y procesar</button>
        </div>
      </section>
    </AppLayout>
  );
}