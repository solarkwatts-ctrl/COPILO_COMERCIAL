"use client";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";
export function useAnalytics(from?: string, to?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() {
    setLoading(true); setError("");
    try {
      const q = new URLSearchParams(); if (from) q.set("from", from); if (to) q.set("to", to);
      const response = await authFetch(`/api/analytics?${q.toString()}`);
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "No fue posible cargar el análisis.");
      setData(payload);
    } catch (e: any) { setError(e.message || "No fue posible cargar el análisis."); setData(null); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  return { data, loading, error, load };
}
