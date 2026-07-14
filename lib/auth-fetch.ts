"use client";
import { supabaseBrowser } from "@/lib/supabase/client";

export async function authFetch(path: string, init: RequestInit = {}) {
  const { data } = await supabaseBrowser.auth.getSession();
  const companyId = typeof window !== "undefined" ? localStorage.getItem("active_company_id") || "" : "";
  const headers = new Headers(init.headers || {});
  if (data.session?.access_token) headers.set("Authorization", `Bearer ${data.session.access_token}`);
  if (companyId) headers.set("X-Company-Id", companyId);
  return fetch(path, { ...init, headers, cache: "no-store" });
}
