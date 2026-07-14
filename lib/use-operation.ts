"use client";
import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";

export function useOperation(from?: string, to?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams();
      if (from) q.set("from", from);
      if (to) q.set("to", to);
      // Evita que el navegador reutilice indicadores anteriores después de borrar o cambiar empresa.
      q.set("_ts", String(Date.now()));
      const r = await authFetch(`/api/operacion?${q.toString()}`, { cache: "no-store" });
      const p = await r.json();
      if (!r.ok) throw new Error(p.error || "No fue posible cargar la información.");
      setData(p);
    } catch (e: any) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const refresh = () => load();
    const storage = (event: StorageEvent) => {
      if (event.key === "active_company_id" || event.key === "company_data_revision") load();
    };
    window.addEventListener("company-data-changed", refresh);
    window.addEventListener("storage", storage);
    return () => {
      window.removeEventListener("company-data-changed", refresh);
      window.removeEventListener("storage", storage);
    };
  }, [load]);

  return { data, loading, error, load };
}
