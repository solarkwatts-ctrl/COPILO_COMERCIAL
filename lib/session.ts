"use client";

import { demoUsers, Role } from "./demo-data";

export type SessionUser = {
  usuario: string;
  nombre: string;
  rol: Role;
};

export function getCurrentUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("copiloto_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: SessionUser) {
  localStorage.setItem("copiloto_user", JSON.stringify(user));
}

export function clearCurrentUser() {
  localStorage.removeItem("copiloto_user");
}

export function getDemoEnabled() {
  if (typeof window === "undefined") return true;
  const raw = localStorage.getItem("copiloto_demo_enabled");
  return raw === null ? true : raw === "true";
}

export function setDemoEnabled(value: boolean) {
  localStorage.setItem("copiloto_demo_enabled", String(value));
}

export function getUploadedSources(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("copiloto_uploaded_sources") || "[]");
  } catch {
    return [];
  }
}

export function addUploadedSource(source: string) {
  const current = getUploadedSources();
  const next = [source, ...current.filter((x) => x !== source)].slice(0, 12);
  localStorage.setItem("copiloto_uploaded_sources", JSON.stringify(next));
}

export function clearDemoData() {
  localStorage.setItem("copiloto_demo_enabled", "false");
  localStorage.removeItem("copiloto_uploaded_sources");
}

export function getHomeForRole(role?: Role) {
  if (role === "Comercial") return "/comercial";
  if (role === "Compras") return "/inventario";
  if (role === "Cartera") return "/cartera";
  return "/dashboard";
}

export function validateDemoLogin(usuario: string, password: string) {
  const user = demoUsers.find((u) => u.usuario === usuario && u.password === password);
  if (!user) return null;
  return { usuario: user.usuario, nombre: user.nombre, rol: user.rol } satisfies SessionUser;
}
