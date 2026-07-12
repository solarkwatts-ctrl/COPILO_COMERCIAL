"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/Layout";
import { Hero } from "@/components/Hero";
import { supabaseBrowser } from "@/lib/supabase/client";
import { DatabaseBackup } from "lucide-react";

export default function BackupPage() {
  const [profile, setProfile] = useState<any>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabaseBrowser.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabaseBrowser.from("usuarios").select("*").eq("auth_user_id", auth.user.id).single();
      setProfile(data);
    })();
  }, []);

  async function generate() {
    const res = await fetch("/api/backup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...((await supabaseBrowser.auth.getSession()).data.session?.access_token
          ? { Authorization: `Bearer ${(await supabaseBrowser.auth.getSession()).data.session?.access_token}`, "X-Company-Id": localStorage.getItem("active_company_id") || "" }
          : {})
      },
      body: JSON.stringify({
        empresa_id: profile?.empresa_id,
        usuario_id: profile?.id,
        usuario_nombre: profile?.nombre
      })
    });
    const data = await res.json();
    setMessage(data.ok ? `Copia generada: ${data.file}` : data.error || "No fue posible generar la copia.");
  }

  return (
    <AppLayout>
      <Hero
        title="Copias de seguridad en Supabase"
        subtitle="Las copias se almacenan en el bucket privado backups y quedan registradas en auditoría."
      />

      {message && <div className="alert alert-blue mb-6">{message}</div>}

      <section className="card max-w-2xl">
        <DatabaseBackup size={36} className="text-blue-700"/>
        <h2 className="mt-4 text-2xl font-black">Generar copia empresarial</h2>
        <p className="mt-3 text-slate-600">
          Incluye configuración, usuarios, zonas, sucursales, ventas, metas, cartera, inventario, pérdidas, importaciones y trazabilidad.
        </p>
        <button className="btn mt-6" onClick={generate}>Generar copia ahora</button>
      </section>
    </AppLayout>
  );
}