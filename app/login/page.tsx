"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";

function friendlyAuthError(message?: string) {
  const value = (message || "").toLowerCase();
  if (value.includes("invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (value.includes("email not confirmed")) return "El correo todavía no está confirmado.";
  if (value.includes("rate limit")) return "Demasiados intentos. Espere unos minutos y vuelva a intentar.";
  return message || "No fue posible iniciar sesión.";
}

export default function LoginPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const email = correo.trim().toLowerCase();
      const { data, error: authError } = await supabaseBrowser.auth.signInWithPassword({ email, password });

      if (authError || !data.user) {
        setError(friendlyAuthError(authError?.message));
        return;
      }

      const { data: usuario, error: userError } = await supabaseBrowser
        .from("usuarios")
        .select("id,auth_user_id,empresa_id,nombre,usuario,correo,activo,sucursal_id,comerciales(id),roles(nombre)")
        .eq("auth_user_id", data.user.id)
        .maybeSingle();

      if (userError) {
        await supabaseBrowser.auth.signOut();
        setError(`La autenticación funcionó, pero no se pudo leer el perfil: ${userError.message}`);
        return;
      }

      if (!usuario) {
        await supabaseBrowser.auth.signOut();
        setError("El usuario existe en Authentication, pero todavía no está vinculado en public.usuarios.");
        return;
      }

      if (usuario.activo === false) {
        await supabaseBrowser.auth.signOut();
        setError("Usuario deshabilitado.");
        return;
      }

      const roleRow: any = Array.isArray((usuario as any).roles) ? (usuario as any).roles[0] : (usuario as any).roles;
      const commercialRow: any = Array.isArray((usuario as any).comerciales) ? (usuario as any).comerciales[0] : (usuario as any).comerciales;

      if (!roleRow?.nombre) {
        await supabaseBrowser.auth.signOut();
        setError("El usuario no tiene un rol asignado.");
        return;
      }

      const profile = {
        id: usuario.id,
        auth_user_id: usuario.auth_user_id,
        empresa_id: usuario.empresa_id,
        nombre: usuario.nombre || usuario.usuario,
        usuario: usuario.usuario,
        correo: usuario.correo,
        rol: roleRow.nombre,
        comercial_id: commercialRow?.id || null,
        sucursal_id: usuario.sucursal_id,
        activo: true
      };

      localStorage.setItem("copiloto_user", JSON.stringify(profile));

      if (profile.rol === "Asistente Comercial") router.push("/cargar-bases");
      else if (profile.rol === "Comercial") router.push("/comercial");
      else router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "No fue posible iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-2xl md:grid-cols-2">
        <div className="bg-gradient-to-br from-slate-950 via-blue-700 to-teal-500 p-10 text-white">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-lg font-black text-slate-950">IA</div>
          <h1 className="text-4xl font-black">Centro inteligente de decisiones comerciales.</h1>
          <p className="mt-4 text-white/80">Acceso protegido, información segmentada por rol y análisis empresarial seguro.</p>
        </div>
        <form className="p-10" onSubmit={login}>
          <h2 className="text-2xl font-black">Ingresar</h2>
          <p className="mt-2 text-sm text-slate-500">Use su correo corporativo.</p>
          <div className="mt-8 space-y-4">
            <input className="input" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="correo@empresa.com" autoComplete="email" required />
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" autoComplete="current-password" required />
            {error && <p className="alert alert-red">{error}</p>}
            <button className="btn w-full" disabled={loading}>{loading ? "Validando..." : "Entrar"}</button>
            <Link href="/" className="btn-secondary flex w-full items-center justify-center">Volver a bienvenida</Link>
          </div>
        </form>
      </section>
    </main>
  );
}
