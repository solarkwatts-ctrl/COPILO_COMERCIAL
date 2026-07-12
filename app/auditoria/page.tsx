"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/Layout";
import { Hero } from "@/components/Hero";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function AuditPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabaseBrowser.auth.getUser();
      if (!auth.user) return;
      const { data: usuario } = await supabaseBrowser
        .from("usuarios")
        .select("id,empresa_id")
        .eq("auth_user_id", auth.user.id)
        .single();
      if (!usuario?.empresa_id) return;
      const { data, error } = await supabaseBrowser
        .from("auditoria")
        .select("*")
        .eq("empresa_id", usuario.empresa_id)
        .order("fecha", { ascending: false })
        .limit(500);
      if (error) setError(error.message);
      setRows(data || []);
    })();
  }, []);

  return (
    <AppLayout>
      <Hero title="Trazabilidad empresarial" subtitle="Quién cambió qué, cuándo, dónde y con qué detalle." />
      {error && <div className="alert alert-red mb-6">{error}</div>}
      <section className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>Fecha</th><th>Usuario</th><th>Rol</th><th>Módulo</th><th>Acción</th><th>Detalle</th></tr></thead>
            <tbody>{rows.map((r)=>(
              <tr key={r.id}>
                <td>{new Date(r.fecha || r.creado_en || Date.now()).toLocaleString("es-CO")}</td>
                <td>{r.usuario_nombre || r.usuario_id || "Sistema"}</td>
                <td>{r.rol || ""}</td>
                <td>{r.modulo || r.tabla_afectada || ""}</td>
                <td>{r.accion || ""}</td>
                <td>{r.detalle || ""}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </AppLayout>
  );
}
